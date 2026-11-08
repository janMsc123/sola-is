// routes/ucenec.js — pogled učenca
// urejanje profila, izbira predmetov, gradiva, razpisane naloge z rokom, oddaja nalog,
// prenos lastnih oddaj in pregled ocen

const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { samo } = require('../preveri');
const { MAPA, nalaganje, popraviIme, varnoIme, pobrisi } = require('../datoteke');

const router = express.Router();
router.use(samo('ucenec'));

// ===== POMOŽNE FUNKCIJE =====

// ali učenec obiskuje ta predmet? vrne predmet ali null
async function mojPredmet(ucenecId, predmetId) {
  const [vrstice] = await db.query(`
    SELECT p.* FROM predmeti p
    JOIN ucenec_predmet up ON up.predmet_id = p.id
    WHERE up.ucenec_id = ? AND p.id = ?`, [ucenecId, predmetId]);
  return vrstice[0] || null;
}

// razred učenca (preberemo iz baze, ker ga lahko administrator kadarkoli spremeni)
// vrne { razred_id, razred }; če razreda nima, sta oba null
async function mojRazred(ucenecId) {
  const [[vrstica]] = await db.query(`
    SELECT u.razred_id, r.naziv AS razred FROM ucenci u
    LEFT JOIN razredi r ON r.id = u.razred_id
    WHERE u.id = ?`, [ucenecId]);
  return vrstica;
}

// razpisana naloga, če je za učenčev razred pri predmetu, ki ga obiskuje; sicer null
async function mojaNaloga(ucenecId, nalogaId) {
  const [vrstice] = await db.query(`
    SELECT n.*, p.naziv AS predmet, r.naziv AS razred,
      CONCAT(t.ime, ' ', t.priimek) AS ucitelj
    FROM naloge n
    JOIN predmeti p ON p.id = n.predmet_id
    JOIN razredi r ON r.id = n.razred_id
    JOIN ucitelji t ON t.id = n.ucitelj_id
    JOIN ucenci u ON u.razred_id = n.razred_id AND u.id = ?
    JOIN ucenec_predmet up ON up.ucenec_id = u.id AND up.predmet_id = n.predmet_id
    WHERE n.id = ?`, [ucenecId, nalogaId]);
  return vrstice[0] || null;
}

// kam na disku shranimo oddajo:
// prosta oddaja v naloge/<predmet>/, oddaja k razpisani nalogi v naloge/<predmet>/n<id naloge>/
function potOddaje(predmetId, nalogaId, ime) {
  const deli = [MAPA, 'naloge', String(predmetId)];
  if (nalogaId) deli.push('n' + nalogaId);
  return path.join(...deli, ime);
}

// prejšnje (potrjene) oddaje istega učenca za isto nalogo:
// pri razpisani nalogi je to katerakoli oddaja k tej nalogi,
// pri prosti oddaji pa oddaja z enakim imenom datoteke
async function prejsnjeOddaje(ucenecId, predmetId, nalogaId, ime) {
  if (nalogaId) {
    const [vrstice] = await db.query(
      'SELECT * FROM oddaje WHERE naloga_id = ? AND ucenec_id = ? AND potrjeno = TRUE',
      [nalogaId, ucenecId]);
    return vrstice;
  }
  const [vrstice] = await db.query(`
    SELECT * FROM oddaje
    WHERE naloga_id IS NULL AND predmet_id = ? AND ucenec_id = ? AND ime_datoteke = ? AND potrjeno = TRUE`,
    [predmetId, ucenecId, ime]);
  return vrstice;
}

// =====================================================
// DOMAČA STRAN: moji predmeti in roki
// =====================================================

router.get('/', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const razred = await mojRazred(ucenecId);

  // predmeti z imenom učitelja v mojem razredu, številom gradiv in odprtih nalog
  const [predmeti] = await db.query(`
    SELECT p.id, p.naziv,
      (SELECT GROUP_CONCAT(CONCAT(t.ime, ' ', t.priimek) SEPARATOR ', ')
         FROM ucitelj_predmet x JOIN ucitelji t ON t.id = x.ucitelj_id
         WHERE x.predmet_id = p.id AND x.razred_id = ?) AS ucitelj,
      (SELECT COUNT(*) FROM gradiva g
         WHERE g.predmet_id = p.id AND (g.razred_id = ? OR g.razred_id IS NULL)) AS st_gradiv,
      (SELECT COUNT(*) FROM naloge n
         WHERE n.predmet_id = p.id AND n.razred_id = ? AND n.rok >= NOW()
           AND NOT EXISTS (SELECT 1 FROM oddaje o
                           WHERE o.naloga_id = n.id AND o.ucenec_id = ? AND o.potrjeno = TRUE)) AS st_odprtih
    FROM predmeti p
    JOIN ucenec_predmet up ON up.predmet_id = p.id
    WHERE up.ucenec_id = ?
    ORDER BY p.naziv`,
    [razred.razred_id, razred.razred_id, razred.razred_id, ucenecId, ucenecId]);

  // naloge, ki jih še nisem oddal: tiste z bližnjim rokom in tiste, ki so zamujene (zadnjih 14 dni)
  const [roki] = await db.query(`
    SELECT n.id, n.naslov, n.rok, p.naziv AS predmet
    FROM naloge n
    JOIN predmeti p ON p.id = n.predmet_id
    JOIN ucenec_predmet up ON up.predmet_id = n.predmet_id AND up.ucenec_id = ?
    WHERE n.razred_id = ? AND n.rok >= NOW() - INTERVAL 14 DAY
      AND NOT EXISTS (SELECT 1 FROM oddaje o
                      WHERE o.naloga_id = n.id AND o.ucenec_id = ? AND o.potrjeno = TRUE)
    ORDER BY n.rok
    LIMIT 8`, [ucenecId, razred.razred_id, ucenecId]);

  res.render('ucenec/domov', { predmeti: predmeti, roki: roki, razred: razred, zdaj: new Date() });
});

// ===== PROFIL =====

router.get('/profil', async (req, res) => {
  const [vrstice] = await db.query(`
    SELECT o.ime, o.priimek, u.email, r.naziv AS razred FROM ucenci o
    JOIN uporabniki u ON u.id = o.uporabnik_id
    LEFT JOIN razredi r ON r.id = o.razred_id
    WHERE o.id = ?`, [req.session.uporabnik.profilId]);
  res.render('ucenec/profil', { profil: vrstice[0], napaka: null, uspeh: null });
});

router.post('/profil', async (req, res) => {
  const u = req.session.uporabnik;
  const profil = {
    ime: req.body.ime.trim(),
    priimek: req.body.priimek.trim(),
    email: req.body.email.trim()
  };
  const geslo = req.body.geslo;

  // razred samo prikažemo (spremeni ga lahko le administrator)
  profil.razred = (await mojRazred(u.profilId)).razred;

  // validacija
  let napaka = null;
  if (!profil.ime || !profil.priimek || !profil.email) {
    napaka = 'Izpolnite ime, priimek in email.';
  } else if (geslo && geslo.length < 6) {
    napaka = 'Novo geslo mora imeti vsaj 6 znakov.';
  } else {
    const [obstaja] = await db.query(
      'SELECT id FROM uporabniki WHERE email = ? AND id <> ?', [profil.email, u.id]);
    if (obstaja.length > 0) napaka = 'Ta email že uporablja drug uporabnik.';
  }
  if (napaka) {
    return res.render('ucenec/profil', { profil: profil, napaka: napaka, uspeh: null });
  }

  await db.query('UPDATE ucenci SET ime = ?, priimek = ? WHERE id = ?',
    [profil.ime, profil.priimek, u.profilId]);
  await db.query('UPDATE uporabniki SET email = ? WHERE id = ?', [profil.email, u.id]);

  if (geslo) {
    const hash = await bcrypt.hash(geslo, 10);
    await db.query('UPDATE uporabniki SET geslo_hash = ? WHERE id = ?', [hash, u.id]);
  }

  u.ime = profil.ime + ' ' + profil.priimek; // posodobimo ime v glavi strani
  res.render('ucenec/profil', { profil: profil, napaka: null, uspeh: 'Profil je shranjen.' });
});

// ===== IZBIRA PREDMETOV =====

router.get('/predmeti', async (req, res) => {
  const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
  const [moji] = await db.query(
    'SELECT predmet_id FROM ucenec_predmet WHERE ucenec_id = ?', [req.session.uporabnik.profilId]);
  res.render('ucenec/predmeti', {
    predmeti: predmeti,
    izbrani: moji.map(p => String(p.predmet_id)),
    napaka: null
  });
});

router.post('/predmeti', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;

  // kljukce iz obrazca -> seznam
  let izbrani = req.body.predmeti || [];
  if (!Array.isArray(izbrani)) izbrani = [izbrani];

  // učenec mora obiskovati več kot en predmet
  if (izbrani.length < 2) {
    const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
    return res.render('ucenec/predmeti', {
      predmeti: predmeti, izbrani: izbrani, napaka: 'Izberite vsaj 2 predmeta.'
    });
  }

  // pobrišemo stare povezave in vpišemo nove
  await db.query('DELETE FROM ucenec_predmet WHERE ucenec_id = ?', [ucenecId]);
  for (const predmetId of izbrani) {
    await db.query('INSERT INTO ucenec_predmet (ucenec_id, predmet_id) VALUES (?, ?)',
      [ucenecId, predmetId]);
  }
  res.redirect('/ucenec');
});

// =====================================================
// EN PREDMET: gradiva, razpisane naloge, proste oddaje
// =====================================================

router.get('/predmet/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const predmet = await mojPredmet(ucenecId, req.params.id);
  if (!predmet) {
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne obiskujete.' });
  }
  const razred = await mojRazred(ucenecId);

  // učitelj(i), ki ta predmet učijo v mojem razredu
  const [ucitelji] = await db.query(`
    SELECT t.ime, t.priimek FROM ucitelj_predmet x
    JOIN ucitelji t ON t.id = x.ucitelj_id
    WHERE x.predmet_id = ? AND x.razred_id = ?`, [predmet.id, razred.razred_id]);

  // gradiva mojega razreda in stara gradiva brez razreda
  const [gradiva] = await db.query(`
    SELECT * FROM gradiva
    WHERE predmet_id = ? AND (razred_id = ? OR razred_id IS NULL)
    ORDER BY nalozeno DESC`, [predmet.id, razred.razred_id]);

  // razpisane naloge za moj razred in moja oddaja pri vsaki
  const [naloge] = await db.query(`
    SELECT n.*, o.id AS oddaja_id, o.oddano, o.ocena, o.komentar,
      (o.oddano > n.rok) AS zamuda
    FROM naloge n
    LEFT JOIN oddaje o ON o.naloga_id = n.id AND o.ucenec_id = ? AND o.potrjeno = TRUE
    WHERE n.predmet_id = ? AND n.razred_id = ?
    ORDER BY n.rok DESC`, [ucenecId, predmet.id, razred.razred_id]);

  // moje proste oddaje (brez razpisane naloge)
  const [proste] = await db.query(`
    SELECT * FROM oddaje
    WHERE naloga_id IS NULL AND predmet_id = ? AND ucenec_id = ? AND potrjeno = TRUE
    ORDER BY oddano DESC`, [predmet.id, ucenecId]);

  res.render('ucenec/predmet', {
    predmet: predmet, razred: razred, ucitelji: ucitelji, gradiva: gradiva,
    naloge: naloge, proste: proste, napaka: req.query.napaka, zdaj: new Date()
  });
});

// prenos gradiva (samo pri predmetu, ki ga učenec obiskuje, in za njegov razred)
router.get('/gradivo/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const [vrstice] = await db.query('SELECT * FROM gradiva WHERE id = ?', [req.params.id]);
  const g = vrstice[0];
  const razred = await mojRazred(ucenecId);

  if (!g || !(await mojPredmet(ucenecId, g.predmet_id)) ||
      (g.razred_id !== null && g.razred_id !== razred.razred_id)) {
    return res.status(403).render('napaka', { sporocilo: 'Do tega gradiva nimate dostopa.' });
  }
  res.download(g.pot, g.ime_datoteke);
});

// =====================================================
// RAZPISANA NALOGA: navodila, rok, moja oddaja, ocena
// =====================================================

router.get('/naloga/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const n = await mojaNaloga(ucenecId, req.params.id);
  if (!n) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }

  const [vrstice] = await db.query(`
    SELECT *, (oddano > ?) AS zamuda FROM oddaje
    WHERE naloga_id = ? AND ucenec_id = ? AND potrjeno = TRUE`, [n.rok, n.id, ucenecId]);

  res.render('ucenec/naloga', {
    naloga: n, oddaja: vrstice[0] || null, napaka: req.query.napaka, zdaj: new Date()
  });
});

// =====================================================
// ODDAJA NALOGE
// Datoteka se shrani pod imenom "Priimek Ime - Naslov naloge.končnica".
// Pri razpisani nalogi je naslov kar naslov naloge, pri prosti oddaji ga vpiše učenec.
// Če je naloga že oddana, se stara povozi šele, ko učenec to potrdi.
// Ocenjene naloge ni več mogoče zamenjati.
// =====================================================

async function shraniOddajo(req, res, predmetId, nalogaId, naslov, nazaj) {
  const u = req.session.uporabnik;

  naslov = varnoIme(naslov || '');
  if (!req.file || !naslov) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.redirect(nazaj + '?napaka=' + encodeURIComponent('Vpišite naslov in izberite datoteko.'));
  }
  if (naslov.length > 100) {
    fs.unlinkSync(req.file.path);
    return res.redirect(nazaj + '?napaka=' + encodeURIComponent('Naslov je predolg (največ 100 znakov).'));
  }

  // ime in priimek vzamemo iz baze
  const [[ucenec]] = await db.query('SELECT ime, priimek FROM ucenci WHERE id = ?', [u.profilId]);

  // končnica originalne datoteke, npr. ".pdf"
  const koncnica = path.extname(popraviIme(req.file.originalname)).toLowerCase();

  // ime po navodilih: "Priimek Ime - Naslov naloge.pdf"
  const ime = varnoIme(ucenec.priimek + ' ' + ucenec.ime) + ' - ' + naslov + koncnica;

  // ali je učenec to nalogo že oddal?
  const prejsnje = await prejsnjeOddaje(u.profilId, predmetId, nalogaId, ime);

  // ocenjene naloge ne more zamenjati
  if (prejsnje.some(o => o.ocena !== null)) {
    fs.unlinkSync(req.file.path);
    return res.redirect(nazaj + '?napaka=' + encodeURIComponent('Naloga je že ocenjena, zato je ne morete več zamenjati.'));
  }

  // morebitne starejše nepotrjene oddaje iste naloge zavržemo (učenec ni ne potrdil ne preklical)
  const [stare] = await db.query(`
    SELECT * FROM oddaje WHERE ucenec_id = ? AND potrjeno = FALSE AND predmet_id = ?
      AND (naloga_id = ? OR (naloga_id IS NULL AND ? IS NULL AND ime_datoteke = ?))`,
    [u.profilId, predmetId, nalogaId, nalogaId, ime]);
  for (const s of stare) {
    pobrisi(s.pot);
    await db.query('DELETE FROM oddaje WHERE id = ?', [s.id]);
  }

  if (prejsnje.length === 0) {
    // prva oddaja -> takoj shranimo
    const koncnaPot = potOddaje(predmetId, nalogaId, ime);
    fs.mkdirSync(path.dirname(koncnaPot), { recursive: true });
    fs.renameSync(req.file.path, koncnaPot);
    await db.query(
      'INSERT INTO oddaje (naloga_id, predmet_id, ucenec_id, ime_datoteke, pot, potrjeno) VALUES (?, ?, ?, ?, ?, TRUE)',
      [nalogaId, predmetId, u.profilId, ime, koncnaPot]);
    return res.redirect(nazaj);
  }

  // ponovna oddaja -> nova datoteka ostane v začasni mapi, zapis ima potrjeno = FALSE
  const [r] = await db.query(
    'INSERT INTO oddaje (naloga_id, predmet_id, ucenec_id, ime_datoteke, pot, potrjeno) VALUES (?, ?, ?, ?, ?, FALSE)',
    [nalogaId, predmetId, u.profilId, ime, req.file.path]);

  // učenca vprašamo, ali res želi zamenjati prejšnjo oddajo
  res.redirect('/ucenec/potrdi/' + r.insertId);
}

// oddaja k razpisani nalogi
router.post('/naloga/:id/oddaja', nalaganje.single('datoteka'), async (req, res) => {
  const n = await mojaNaloga(req.session.uporabnik.profilId, req.params.id);
  if (!n) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }
  await shraniOddajo(req, res, n.predmet_id, n.id, n.naslov, '/ucenec/naloga/' + n.id);
});

// prosta oddaja pri predmetu (naslov vpiše učenec)
router.post('/predmet/:id/oddaja', nalaganje.single('datoteka'), async (req, res) => {
  const predmet = await mojPredmet(req.session.uporabnik.profilId, req.params.id);
  if (!predmet) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne obiskujete.' });
  }
  await shraniOddajo(req, res, predmet.id, null, req.body.naslov, '/ucenec/predmet/' + predmet.id);
});

// pomožna funkcija: nepotrjena oddaja tega učenca
async function nepotrjena(ucenecId, oddajaId) {
  const [vrstice] = await db.query(
    'SELECT * FROM oddaje WHERE id = ? AND ucenec_id = ? AND potrjeno = FALSE', [oddajaId, ucenecId]);
  return vrstice[0] || null;
}

// kam gre učenec po potrditvi ali preklicu
function poOddaji(o) {
  return o.naloga_id ? '/ucenec/naloga/' + o.naloga_id : '/ucenec/predmet/' + o.predmet_id;
}

// stran z vprašanjem "Ali želite zamenjati?"
router.get('/potrdi/:id', async (req, res) => {
  const o = await nepotrjena(req.session.uporabnik.profilId, req.params.id);
  if (!o) return res.redirect('/ucenec');
  res.render('ucenec/potrdi', { naloga: o });
});

// učenec je potrdil -> nova datoteka zamenja staro
router.post('/potrdi/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const o = await nepotrjena(ucenecId, req.params.id);
  if (!o) return res.redirect('/ucenec');

  // medtem je učitelj morda že ocenil prejšnjo oddajo
  const prejsnje = await prejsnjeOddaje(ucenecId, o.predmet_id, o.naloga_id, o.ime_datoteke);
  if (prejsnje.some(p => p.ocena !== null)) {
    pobrisi(o.pot);
    await db.query('DELETE FROM oddaje WHERE id = ?', [o.id]);
    return res.redirect(poOddaji(o) + '?napaka=' + encodeURIComponent('Naloga je že ocenjena, zato je ne morete več zamenjati.'));
  }

  // staro oddajo pobrišemo z diska in iz baze (nova ima lahko drugo končnico, zato brišemo posebej)
  for (const p of prejsnje) {
    pobrisi(p.pot);
    await db.query('DELETE FROM oddaje WHERE id = ?', [p.id]);
  }

  const koncnaPot = potOddaje(o.predmet_id, o.naloga_id, o.ime_datoteke);
  fs.mkdirSync(path.dirname(koncnaPot), { recursive: true });
  fs.renameSync(o.pot, koncnaPot);
  await db.query('UPDATE oddaje SET pot = ?, potrjeno = TRUE, oddano = NOW() WHERE id = ?',
    [koncnaPot, o.id]);

  res.redirect(poOddaji(o));
});

// učenec je preklical -> novo datoteko zavržemo, stara ostane
router.post('/preklici/:id', async (req, res) => {
  const o = await nepotrjena(req.session.uporabnik.profilId, req.params.id);
  if (!o) return res.redirect('/ucenec');

  pobrisi(o.pot);
  await db.query('DELETE FROM oddaje WHERE id = ?', [o.id]);

  res.redirect(poOddaji(o));
});

// prenos lastne oddaje (učenec lahko prenese samo svoje potrjene oddaje)
router.get('/oddaja/:id', async (req, res) => {
  const [vrstice] = await db.query(
    'SELECT * FROM oddaje WHERE id = ? AND ucenec_id = ? AND potrjeno = TRUE',
    [req.params.id, req.session.uporabnik.profilId]);
  const o = vrstice[0];
  if (!o) {
    return res.status(403).render('napaka', { sporocilo: 'Do te oddaje nimate dostopa.' });
  }
  res.download(o.pot, o.ime_datoteke);
});

// =====================================================
// MOJE OCENE: vse ocenjene oddaje, po predmetih, s povprečjem
// =====================================================

router.get('/ocene', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;

  const [vrstice] = await db.query(`
    SELECT o.id, o.ocena, o.komentar, o.ocenjeno, o.ime_datoteke, o.naloga_id,
      p.naziv AS predmet, n.naslov
    FROM oddaje o
    JOIN predmeti p ON p.id = o.predmet_id
    LEFT JOIN naloge n ON n.id = o.naloga_id
    WHERE o.ucenec_id = ? AND o.potrjeno = TRUE AND o.ocena IS NOT NULL
    ORDER BY p.naziv, o.ocenjeno`, [ucenecId]);

  // razvrstimo po predmetih: [{ predmet, ocene: [...], povprecje }]
  const predmeti = [];
  for (const v of vrstice) {
    let zadnji = predmeti[predmeti.length - 1];
    if (!zadnji || zadnji.predmet !== v.predmet) {
      zadnji = { predmet: v.predmet, ocene: [] };
      predmeti.push(zadnji);
    }
    zadnji.ocene.push(v);
  }
  for (const p of predmeti) {
    const vsota = p.ocene.reduce((s, o) => s + o.ocena, 0);
    p.povprecje = (vsota / p.ocene.length).toFixed(2).replace('.', ','); // slovenska vejica
  }

  // koliko oddaj še čaka na oceno
  const [[cakajo]] = await db.query(
    'SELECT COUNT(*) AS st FROM oddaje WHERE ucenec_id = ? AND potrjeno = TRUE AND ocena IS NULL',
    [ucenecId]);

  res.render('ucenec/ocene', { predmeti: predmeti, cakajo: cakajo.st });
});

module.exports = router;
