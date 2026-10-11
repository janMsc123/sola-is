// routes/ucenec.js — pogled učenca
// urejanje profila, izbira predmetov, vpogled v gradiva in oddaja nalog

const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { samo } = require('../preveri');
const { MAPA, nalaganje, popraviIme, varnoIme } = require('../datoteke');

const router = express.Router();
router.use(samo('ucenec'));

// pomožna funkcija: ali učenec obiskuje ta predmet? vrne predmet ali null
async function mojPredmet(ucenecId, predmetId) {
  const [vrstice] = await db.query(`
    SELECT p.* FROM predmeti p
    JOIN ucenec_predmet up ON up.predmet_id = p.id
    WHERE up.ucenec_id = ? AND p.id = ?`, [ucenecId, predmetId]);
  return vrstice[0] || null;
}

// domača stran: seznam mojih predmetov
router.get('/', async (req, res) => {
  const [predmeti] = await db.query(`
    SELECT p.id, p.naziv,
      (SELECT COUNT(*) FROM gradiva WHERE predmet_id = p.id) AS st_gradiv
    FROM predmeti p
    JOIN ucenec_predmet up ON up.predmet_id = p.id
    WHERE up.ucenec_id = ?
    ORDER BY p.naziv`, [req.session.uporabnik.profilId]);
  res.render('ucenec/domov', { predmeti: predmeti });
});

// ===== PROFIL =====

router.get('/profil', async (req, res) => {
  const [vrstice] = await db.query(`
    SELECT o.ime, o.priimek, u.email FROM ucenci o
    JOIN uporabniki u ON u.id = o.uporabnik_id
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

// ===== EN PREDMET: gradiva in moje naloge =====

router.get('/predmet/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const predmet = await mojPredmet(ucenecId, req.params.id);
  if (!predmet) {
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne obiskujete.' });
  }

  const [gradiva] = await db.query(
    'SELECT * FROM gradiva WHERE predmet_id = ? ORDER BY nalozeno DESC', [predmet.id]);
  const [naloge] = await db.query(
    'SELECT * FROM naloge WHERE predmet_id = ? AND ucenec_id = ? AND potrjeno = TRUE ORDER BY oddano DESC',
    [predmet.id, ucenecId]);

  res.render('ucenec/predmet', {
    predmet: predmet, gradiva: gradiva, naloge: naloge, napaka: req.query.napaka
  });
});

// prenos gradiva (samo pri predmetu, ki ga učenec obiskuje)
router.get('/gradivo/:id', async (req, res) => {
  const [vrstice] = await db.query('SELECT * FROM gradiva WHERE id = ?', [req.params.id]);
  const g = vrstice[0];
  if (!g || !(await mojPredmet(req.session.uporabnik.profilId, g.predmet_id))) {
    return res.status(403).render('napaka', { sporocilo: 'Do tega gradiva nimate dostopa.' });
  }
  res.download(g.pot, g.ime_datoteke);
});

// ===== ODDAJA NALOGE =====
// Datoteka se shrani pod imenom "Priimek Ime - Naslov naloge.končnica".
// Če naloga s tem imenom že obstaja, se stara povozi šele, ko učenec to potrdi.

router.post('/predmet/:id/oddaja', nalaganje.single('datoteka'), async (req, res) => {
  const u = req.session.uporabnik;
  const predmet = await mojPredmet(u.profilId, req.params.id);

  if (!predmet) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne obiskujete.' });
  }

  const naslov = varnoIme(req.body.naslov || '');
  if (!req.file || !naslov) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.redirect('/ucenec/predmet/' + predmet.id + '?napaka=Vpišite naslov in izberite datoteko.');
  }

  // ime in priimek vzamemo iz baze
  const [[ucenec]] = await db.query('SELECT ime, priimek FROM ucenci WHERE id = ?', [u.profilId]);

  // končnica originalne datoteke, npr. ".pdf"
  const koncnica = path.extname(popraviIme(req.file.originalname)).toLowerCase();

  // ime po navodilih: "Priimek Ime - Naslov naloge.pdf"
  const ime = varnoIme(ucenec.priimek + ' ' + ucenec.ime) + ' - ' + naslov + koncnica;

  // naloge so v mapi naloge/<id predmeta>/
  const mapa = path.join(MAPA, 'naloge', String(predmet.id));
  fs.mkdirSync(mapa, { recursive: true });
  const koncnaPot = path.join(mapa, ime);

  // ali je učenec to nalogo že oddal?
  const [prejsnje] = await db.query(`
    SELECT id FROM naloge
    WHERE predmet_id = ? AND ucenec_id = ? AND ime_datoteke = ? AND potrjeno = TRUE`,
    [predmet.id, u.profilId, ime]);

  if (prejsnje.length === 0) {
    // prva oddaja -> takoj shranimo
    fs.renameSync(req.file.path, koncnaPot);
    await db.query(
      'INSERT INTO naloge (predmet_id, ucenec_id, ime_datoteke, pot, potrjeno) VALUES (?, ?, ?, ?, TRUE)',
      [predmet.id, u.profilId, ime, koncnaPot]);
    return res.redirect('/ucenec/predmet/' + predmet.id);
  }

  // ponovna oddaja -> nova datoteka ostane v začasni mapi, zapis ima potrjeno = FALSE
  const [r] = await db.query(
    'INSERT INTO naloge (predmet_id, ucenec_id, ime_datoteke, pot, potrjeno) VALUES (?, ?, ?, ?, FALSE)',
    [predmet.id, u.profilId, ime, req.file.path]);

  // učenca vprašamo, ali res želi zamenjati prejšnjo oddajo
  res.redirect('/ucenec/potrdi/' + r.insertId);
});

// pomožna funkcija: nepotrjena oddaja tega učenca
async function nepotrjena(ucenecId, nalogaId) {
  const [vrstice] = await db.query(
    'SELECT * FROM naloge WHERE id = ? AND ucenec_id = ? AND potrjeno = FALSE', [nalogaId, ucenecId]);
  return vrstice[0] || null;
}

// stran z vprašanjem "Ali želite zamenjati?"
router.get('/potrdi/:id', async (req, res) => {
  const n = await nepotrjena(req.session.uporabnik.profilId, req.params.id);
  if (!n) return res.redirect('/ucenec');
  res.render('ucenec/potrdi', { naloga: n });
});

// učenec je potrdil -> nova datoteka povozi staro
router.post('/potrdi/:id', async (req, res) => {
  const ucenecId = req.session.uporabnik.profilId;
  const n = await nepotrjena(ucenecId, req.params.id);
  if (!n) return res.redirect('/ucenec');

  const koncnaPot = path.join(MAPA, 'naloge', String(n.predmet_id), n.ime_datoteke);

  // staro oddajo pobrišemo iz baze, nova datoteka jo povozi na disku
  await db.query(
    'DELETE FROM naloge WHERE predmet_id = ? AND ucenec_id = ? AND ime_datoteke = ? AND potrjeno = TRUE',
    [n.predmet_id, ucenecId, n.ime_datoteke]);
  fs.renameSync(n.pot, koncnaPot);
  await db.query('UPDATE naloge SET pot = ?, potrjeno = TRUE, oddano = NOW() WHERE id = ?',
    [koncnaPot, n.id]);

  res.redirect('/ucenec/predmet/' + n.predmet_id);
});

// učenec je preklical -> novo datoteko zavržemo, stara ostane
router.post('/preklici/:id', async (req, res) => {
  const n = await nepotrjena(req.session.uporabnik.profilId, req.params.id);
  if (!n) return res.redirect('/ucenec');

  if (fs.existsSync(n.pot)) fs.unlinkSync(n.pot);
  await db.query('DELETE FROM naloge WHERE id = ?', [n.id]);

  res.redirect('/ucenec/predmet/' + n.predmet_id);
});

module.exports = router;
