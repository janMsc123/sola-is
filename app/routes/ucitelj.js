// routes/ucitelj.js — pogled učitelja
// Učitelj vidi samo predmete in razrede, v katerih res poučuje (tabela ucitelj_predmet).
// Par "predmet + razred" imenujemo skupina, npr. Matematika v 2.A.
// V skupini: gradiva, razpisane naloge z rokom, oddaje učencev in ocenjevanje.

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { samo } = require('../preveri');
const { MAPA, nalaganje, popraviIme, pobrisi } = require('../datoteke');

const router = express.Router();
router.use(samo('ucitelj'));

// ===== POMOŽNE FUNKCIJE ZA PREVERJANJE PRAVIC =====

// ali učitelj uči ta predmet v tem razredu? vrne skupino ali null
async function mojaSkupina(uciteljId, predmetId, razredId) {
  const [vrstice] = await db.query(`
    SELECT p.id AS predmet_id, p.naziv AS predmet, r.id AS razred_id, r.naziv AS razred
    FROM ucitelj_predmet up
    JOIN predmeti p ON p.id = up.predmet_id
    JOIN razredi r ON r.id = up.razred_id
    WHERE up.ucitelj_id = ? AND up.predmet_id = ? AND up.razred_id = ?`,
    [uciteljId, predmetId, razredId]);
  return vrstice[0] || null;
}

// ali učitelj uči ta predmet v vsaj enem razredu? (za stara gradiva brez razreda)
async function uciPredmet(uciteljId, predmetId) {
  const [vrstice] = await db.query(
    'SELECT 1 FROM ucitelj_predmet WHERE ucitelj_id = ? AND predmet_id = ?', [uciteljId, predmetId]);
  return vrstice.length > 0;
}

// razpisana naloga, če je iz skupine tega učitelja, sicer null
async function mojaNaloga(uciteljId, nalogaId) {
  const [vrstice] = await db.query('SELECT * FROM naloge WHERE id = ?', [nalogaId]);
  const n = vrstice[0];
  if (!n) return null;
  const skupina = await mojaSkupina(uciteljId, n.predmet_id, n.razred_id);
  if (!skupina) return null;
  n.skupina = skupina;
  return n;
}

// oddaja učenca, če jo ta učitelj sme videti, sicer null
// (oddaja k nalogi: naloga mora biti učiteljeva; prosta oddaja: učitelj uči predmet v razredu učenca)
async function mojaOddaja(uciteljId, oddajaId) {
  const [vrstice] = await db.query(`
    SELECT o.*, u.razred_id FROM oddaje o
    JOIN ucenci u ON u.id = o.ucenec_id
    WHERE o.id = ? AND o.potrjeno = TRUE`, [oddajaId]);
  const o = vrstice[0];
  if (!o) return null;
  if (o.naloga_id) {
    return (await mojaNaloga(uciteljId, o.naloga_id)) ? o : null;
  }
  return (await mojaSkupina(uciteljId, o.predmet_id, o.razred_id)) ? o : null;
}

// naslov skupine v URL-ju
function potSkupine(predmetId, razredId) {
  return '/ucitelj/predmet/' + predmetId + '/razred/' + razredId;
}

// =====================================================
// DOMAČA STRAN: moje skupine in prihajajoči roki
// =====================================================

router.get('/', async (req, res) => {
  const uciteljId = req.session.uporabnik.profilId;

  // vse skupine učitelja s številom učencev, nalog in še neocenjenih oddaj
  const [skupine] = await db.query(`
    SELECT p.id AS predmet_id, p.naziv AS predmet, r.id AS razred_id, r.naziv AS razred,
      (SELECT COUNT(*) FROM ucenci u
         JOIN ucenec_predmet x ON x.ucenec_id = u.id
         WHERE x.predmet_id = p.id AND u.razred_id = r.id) AS st_ucencev,
      (SELECT COUNT(*) FROM naloge n
         WHERE n.predmet_id = p.id AND n.razred_id = r.id) AS st_nalog,
      (SELECT COUNT(*) FROM oddaje o
         JOIN naloge n ON n.id = o.naloga_id
         WHERE n.predmet_id = p.id AND n.razred_id = r.id
           AND o.potrjeno = TRUE AND o.ocena IS NULL) AS st_neocenjenih
    FROM ucitelj_predmet up
    JOIN predmeti p ON p.id = up.predmet_id
    JOIN razredi r ON r.id = up.razred_id
    WHERE up.ucitelj_id = ?
    ORDER BY p.naziv, r.naziv`, [uciteljId]);

  // naslednjih 5 rokov v mojih skupinah
  const [roki] = await db.query(`
    SELECT n.id, n.naslov, n.rok, p.naziv AS predmet, r.naziv AS razred,
      (SELECT COUNT(*) FROM oddaje o WHERE o.naloga_id = n.id AND o.potrjeno = TRUE) AS st_oddaj
    FROM naloge n
    JOIN ucitelj_predmet up ON up.predmet_id = n.predmet_id AND up.razred_id = n.razred_id
    JOIN predmeti p ON p.id = n.predmet_id
    JOIN razredi r ON r.id = n.razred_id
    WHERE up.ucitelj_id = ? AND n.rok >= NOW()
    ORDER BY n.rok
    LIMIT 5`, [uciteljId]);

  res.render('ucitelj/domov', { skupine: skupine, roki: roki });
});

// =====================================================
// SKUPINA: gradiva, naloge, učenci, proste oddaje
// =====================================================

router.get('/predmet/:pid/razred/:rid', async (req, res) => {
  const skupina = await mojaSkupina(req.session.uporabnik.profilId, req.params.pid, req.params.rid);
  if (!skupina) {
    // učitelj ne uči tega predmeta v tem razredu -> ne sme videti
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta v tem razredu ne poučujete.' });
  }

  // gradiva tega razreda + stara gradiva brez razreda (veljajo za vse)
  const [gradiva] = await db.query(`
    SELECT g.*, u.ime, u.priimek FROM gradiva g
    JOIN ucitelji u ON u.id = g.ucitelj_id
    WHERE g.predmet_id = ? AND (g.razred_id = ? OR g.razred_id IS NULL)
    ORDER BY g.nalozeno DESC`, [skupina.predmet_id, skupina.razred_id]);

  // razpisane naloge s številom oddaj in ocen
  const [naloge] = await db.query(`
    SELECT n.*,
      (SELECT COUNT(*) FROM oddaje o WHERE o.naloga_id = n.id AND o.potrjeno = TRUE) AS st_oddaj,
      (SELECT COUNT(*) FROM oddaje o WHERE o.naloga_id = n.id AND o.potrjeno = TRUE
         AND o.ocena IS NOT NULL) AS st_ocenjenih
    FROM naloge n
    WHERE n.predmet_id = ? AND n.razred_id = ?
    ORDER BY n.rok DESC`, [skupina.predmet_id, skupina.razred_id]);

  // učenci razreda, ki obiskujejo ta predmet
  const [ucenci] = await db.query(`
    SELECT u.id, u.ime, u.priimek FROM ucenci u
    JOIN ucenec_predmet x ON x.ucenec_id = u.id
    WHERE x.predmet_id = ? AND u.razred_id = ?
    ORDER BY u.priimek, u.ime`, [skupina.predmet_id, skupina.razred_id]);

  // proste oddaje (brez razpisane naloge) učencev tega razreda
  const [proste] = await db.query(`
    SELECT o.*, u.ime, u.priimek FROM oddaje o
    JOIN ucenci u ON u.id = o.ucenec_id
    WHERE o.naloga_id IS NULL AND o.potrjeno = TRUE
      AND o.predmet_id = ? AND u.razred_id = ?
    ORDER BY o.oddano DESC`, [skupina.predmet_id, skupina.razred_id]);

  res.render('ucitelj/predmet', {
    skupina: skupina, gradiva: gradiva, naloge: naloge, ucenci: ucenci, proste: proste,
    napaka: req.query.napaka, zdaj: new Date()
  });
});

// =====================================================
// GRADIVA
// =====================================================

// naloži gradivo za skupino
router.post('/predmet/:pid/razred/:rid/gradivo', nalaganje.single('datoteka'), async (req, res) => {
  const uciteljId = req.session.uporabnik.profilId;
  const skupina = await mojaSkupina(uciteljId, req.params.pid, req.params.rid);

  if (!skupina) {
    if (req.file) fs.unlinkSync(req.file.path); // pobrišemo začasno datoteko
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta v tem razredu ne poučujete.' });
  }
  const nazaj = potSkupine(skupina.predmet_id, skupina.razred_id);
  if (!req.file) {
    return res.redirect(nazaj + '?napaka=Izberite datoteko.');
  }

  const ime = popraviIme(req.file.originalname);

  // gradiva shranimo v mapo gradiva/<id predmeta>/
  // pred ime dodamo čas, da se dve datoteki z istim imenom ne povozita
  const mapa = path.join(MAPA, 'gradiva', String(skupina.predmet_id));
  fs.mkdirSync(mapa, { recursive: true });
  const pot = path.join(mapa, Date.now() + '-' + ime);
  fs.renameSync(req.file.path, pot); // premaknemo iz začasne mape

  await db.query(
    'INSERT INTO gradiva (predmet_id, ucitelj_id, razred_id, ime_datoteke, pot) VALUES (?, ?, ?, ?, ?)',
    [skupina.predmet_id, uciteljId, skupina.razred_id, ime, pot]);

  res.redirect(nazaj);
});

// ali učitelj sme do gradiva: gradivo njegovega razreda ali staro gradivo predmeta, ki ga uči
async function mojeGradivo(uciteljId, gradivoId) {
  const [vrstice] = await db.query('SELECT * FROM gradiva WHERE id = ?', [gradivoId]);
  const g = vrstice[0];
  if (!g) return null;
  if (g.razred_id === null) {
    return (await uciPredmet(uciteljId, g.predmet_id)) ? g : null;
  }
  return (await mojaSkupina(uciteljId, g.predmet_id, g.razred_id)) ? g : null;
}

// briši gradivo
router.post('/gradivo/:id/brisi', async (req, res) => {
  const g = await mojeGradivo(req.session.uporabnik.profilId, req.params.id);
  if (!g) {
    return res.status(403).render('napaka', { sporocilo: 'Tega gradiva ne morete brisati.' });
  }

  pobrisi(g.pot);                                             // datoteka z diska
  await db.query('DELETE FROM gradiva WHERE id = ?', [g.id]); // zapis iz baze

  // nazaj v skupino, iz katere je učitelj prišel (skrito polje "nazaj" v obrazcu);
  // dovolimo samo naslove znotraj /ucitelj/, da obrazec ne more poslati drugam
  const nazaj = req.body.nazaj || '';
  res.redirect(nazaj.startsWith('/ucitelj/') ? nazaj : '/ucitelj');
});

// prenos gradiva
router.get('/gradivo/:id', async (req, res) => {
  const g = await mojeGradivo(req.session.uporabnik.profilId, req.params.id);
  if (!g) {
    return res.status(403).render('napaka', { sporocilo: 'Do tega gradiva nimate dostopa.' });
  }
  res.download(g.pot, g.ime_datoteke); // pošljemo datoteko s pravim imenom
});

// =====================================================
// RAZPISANE NALOGE
// =====================================================

// preveri podatke iz obrazca za nalogo; vrne besedilo napake ali null
function preveriNalogo(body) {
  if (!body.naslov || !body.naslov.trim()) return 'Vpišite naslov naloge.';
  if (body.naslov.trim().length > 100) return 'Naslov je predolg (največ 100 znakov).';
  if (!body.rok || isNaN(new Date(body.rok))) return 'Izberite rok oddaje.';
  return null;
}

// razpiši novo nalogo
router.post('/predmet/:pid/razred/:rid/naloga', async (req, res) => {
  const uciteljId = req.session.uporabnik.profilId;
  const skupina = await mojaSkupina(uciteljId, req.params.pid, req.params.rid);
  if (!skupina) {
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta v tem razredu ne poučujete.' });
  }

  const nazaj = potSkupine(skupina.predmet_id, skupina.razred_id);
  const napaka = preveriNalogo(req.body);
  if (napaka) {
    return res.redirect(nazaj + '?napaka=' + encodeURIComponent(napaka));
  }

  // rok pride iz obrazca kot "2026-11-10T23:59", baza ga shrani kot DATETIME
  await db.query(
    'INSERT INTO naloge (predmet_id, razred_id, ucitelj_id, naslov, navodila, rok) VALUES (?, ?, ?, ?, ?, ?)',
    [skupina.predmet_id, skupina.razred_id, uciteljId,
     req.body.naslov.trim(), (req.body.navodila || '').trim(), new Date(req.body.rok)]);

  res.redirect(nazaj);
});

// ena naloga: kdo je oddal, kdo ne, ocenjevanje
router.get('/naloga/:id', async (req, res) => {
  const n = await mojaNaloga(req.session.uporabnik.profilId, req.params.id);
  if (!n) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }

  // vsi učenci razreda, ki obiskujejo predmet, in njihova oddaja (če obstaja)
  // zamuda = 1, če je bila naloga oddana po roku
  const [ucenci] = await db.query(`
    SELECT u.id, u.ime, u.priimek,
      o.id AS oddaja_id, o.ime_datoteke, o.oddano, o.ocena, o.komentar,
      (o.oddano > ?) AS zamuda
    FROM ucenci u
    JOIN ucenec_predmet x ON x.ucenec_id = u.id AND x.predmet_id = ?
    LEFT JOIN oddaje o ON o.ucenec_id = u.id AND o.naloga_id = ? AND o.potrjeno = TRUE
    WHERE u.razred_id = ?
    ORDER BY u.priimek, u.ime`, [n.rok, n.predmet_id, n.id, n.razred_id]);

  res.render('ucitelj/naloga', {
    naloga: n, ucenci: ucenci, zdaj: new Date(), uspeh: req.query.uspeh
  });
});

// obrazec za urejanje naloge
router.get('/naloga/:id/uredi', async (req, res) => {
  const n = await mojaNaloga(req.session.uporabnik.profilId, req.params.id);
  if (!n) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }
  res.render('ucitelj/naloga-uredi', { naloga: n, napaka: null });
});

// shrani spremembe naloge
router.post('/naloga/:id/uredi', async (req, res) => {
  const n = await mojaNaloga(req.session.uporabnik.profilId, req.params.id);
  if (!n) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }

  const napaka = preveriNalogo(req.body);
  if (napaka) {
    // obrazec pokažemo znova z vpisanimi podatki
    n.naslov = req.body.naslov;
    n.navodila = req.body.navodila;
    return res.render('ucitelj/naloga-uredi', { naloga: n, napaka: napaka });
  }

  await db.query('UPDATE naloge SET naslov = ?, navodila = ?, rok = ? WHERE id = ?',
    [req.body.naslov.trim(), (req.body.navodila || '').trim(), new Date(req.body.rok), n.id]);
  res.redirect('/ucitelj/naloga/' + n.id);
});

// briši nalogo skupaj z vsemi oddajami (zapise pobriše baza, datoteke pobrišemo mi)
router.post('/naloga/:id/brisi', async (req, res) => {
  const n = await mojaNaloga(req.session.uporabnik.profilId, req.params.id);
  if (!n) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }

  const [oddaje] = await db.query('SELECT pot FROM oddaje WHERE naloga_id = ?', [n.id]);
  for (const o of oddaje) pobrisi(o.pot);
  await db.query('DELETE FROM naloge WHERE id = ?', [n.id]); // oddaje gredo zraven (CASCADE)

  res.redirect(potSkupine(n.predmet_id, n.razred_id));
});

// =====================================================
// ODDAJE UČENCEV: prenos in ocena
// =====================================================

// prenos oddane naloge
router.get('/oddaja/:id', async (req, res) => {
  const o = await mojaOddaja(req.session.uporabnik.profilId, req.params.id);
  if (!o) {
    return res.status(403).render('napaka', { sporocilo: 'Do te oddaje nimate dostopa.' });
  }
  res.download(o.pot, o.ime_datoteke);
});

// vpis ocene (1 do 5) in komentarja; prazna ocena pomeni "še ni ocenjeno"
router.post('/oddaja/:id/ocena', async (req, res) => {
  const o = await mojaOddaja(req.session.uporabnik.profilId, req.params.id);
  if (!o) {
    return res.status(403).render('napaka', { sporocilo: 'Do te oddaje nimate dostopa.' });
  }

  let ocena = null;
  if (req.body.ocena) {
    ocena = parseInt(req.body.ocena, 10);
    if (!(ocena >= 1 && ocena <= 5)) {
      return res.status(400).render('napaka', { sporocilo: 'Ocena mora biti od 1 do 5.' });
    }
  }
  const komentar = (req.body.komentar || '').trim();

  await db.query(
    'UPDATE oddaje SET ocena = ?, komentar = ?, ocenjeno = IF(? IS NULL, NULL, NOW()) WHERE id = ?',
    [ocena, komentar, ocena, o.id]);

  // nazaj na nalogo ali v skupino (pri prosti oddaji)
  if (o.naloga_id) {
    return res.redirect('/ucitelj/naloga/' + o.naloga_id + '?uspeh=Shranjeno.#u' + o.ucenec_id);
  }
  res.redirect(potSkupine(o.predmet_id, o.razred_id) + '#proste');
});

module.exports = router;
