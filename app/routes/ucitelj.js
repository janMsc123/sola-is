// routes/ucitelj.js — pogled učitelja
// nalaganje in brisanje gradiv ter pregled oddanih nalog,
// vse samo za predmete, ki jih učitelj dejansko poučuje

const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { samo } = require('../preveri');
const { MAPA, nalaganje, popraviIme } = require('../datoteke');

const router = express.Router();
router.use(samo('ucitelj'));

// pomožna funkcija: ali ta učitelj uči ta predmet? vrne predmet ali null
async function mojPredmet(uciteljId, predmetId) {
  const [vrstice] = await db.query(`
    SELECT p.* FROM predmeti p
    JOIN ucitelj_predmet up ON up.predmet_id = p.id
    WHERE up.ucitelj_id = ? AND p.id = ?`, [uciteljId, predmetId]);
  return vrstice[0] || null;
}

// domača stran: seznam mojih predmetov
router.get('/', async (req, res) => {
  const [predmeti] = await db.query(`
    SELECT p.id, p.naziv,
      (SELECT COUNT(*) FROM gradiva WHERE predmet_id = p.id) AS st_gradiv,
      (SELECT COUNT(*) FROM naloge  WHERE predmet_id = p.id AND potrjeno = TRUE) AS st_nalog
    FROM predmeti p
    JOIN ucitelj_predmet up ON up.predmet_id = p.id
    WHERE up.ucitelj_id = ?
    ORDER BY p.naziv`, [req.session.uporabnik.profilId]);
  res.render('ucitelj/domov', { predmeti: predmeti });
});

// en predmet: gradiva + oddane naloge
router.get('/predmet/:id', async (req, res) => {
  const predmet = await mojPredmet(req.session.uporabnik.profilId, req.params.id);
  if (!predmet) {
    // učitelj ne uči tega predmeta -> ne sme videti
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne poučujete.' });
  }

  const [gradiva] = await db.query(`
    SELECT g.*, u.ime, u.priimek FROM gradiva g
    JOIN ucitelji u ON u.id = g.ucitelj_id
    WHERE g.predmet_id = ? ORDER BY g.nalozeno DESC`, [predmet.id]);

  // samo potrjene naloge (nepotrjena ponovna oddaja še čaka na učenca)
  const [naloge] = await db.query(`
    SELECT n.*, u.ime, u.priimek FROM naloge n
    JOIN ucenci u ON u.id = n.ucenec_id
    WHERE n.predmet_id = ? AND n.potrjeno = TRUE
    ORDER BY n.oddano DESC`, [predmet.id]);

  res.render('ucitelj/predmet', {
    predmet: predmet, gradiva: gradiva, naloge: naloge, napaka: req.query.napaka
  });
});

// naloži gradivo k predmetu
router.post('/predmet/:id/gradivo', nalaganje.single('datoteka'), async (req, res) => {
  const uciteljId = req.session.uporabnik.profilId;
  const predmet = await mojPredmet(uciteljId, req.params.id);

  if (!predmet) {
    if (req.file) fs.unlinkSync(req.file.path); // pobrišemo začasno datoteko
    return res.status(403).render('napaka', { sporocilo: 'Tega predmeta ne poučujete.' });
  }
  if (!req.file) {
    return res.redirect('/ucitelj/predmet/' + predmet.id + '?napaka=Izberite datoteko.');
  }

  const ime = popraviIme(req.file.originalname);

  // gradiva shranimo v mapo gradiva/<id predmeta>/
  // pred ime dodamo čas, da se dve datoteki z istim imenom ne povozita
  const mapa = path.join(MAPA, 'gradiva', String(predmet.id));
  fs.mkdirSync(mapa, { recursive: true });
  const pot = path.join(mapa, Date.now() + '-' + ime);
  fs.renameSync(req.file.path, pot); // premaknemo iz začasne mape

  await db.query(
    'INSERT INTO gradiva (predmet_id, ucitelj_id, ime_datoteke, pot) VALUES (?, ?, ?, ?)',
    [predmet.id, uciteljId, ime, pot]);

  res.redirect('/ucitelj/predmet/' + predmet.id);
});

// briši gradivo
router.post('/gradivo/:id/brisi', async (req, res) => {
  const [vrstice] = await db.query('SELECT * FROM gradiva WHERE id = ?', [req.params.id]);
  const g = vrstice[0];

  // gradivo mora obstajati in biti pri predmetu, ki ga učitelj uči
  if (!g || !(await mojPredmet(req.session.uporabnik.profilId, g.predmet_id))) {
    return res.status(403).render('napaka', { sporocilo: 'Tega gradiva ne morete brisati.' });
  }

  if (fs.existsSync(g.pot)) fs.unlinkSync(g.pot); // datoteka z diska
  await db.query('DELETE FROM gradiva WHERE id = ?', [g.id]); // zapis iz baze

  res.redirect('/ucitelj/predmet/' + g.predmet_id);
});

// prenos gradiva
router.get('/gradivo/:id', async (req, res) => {
  const [vrstice] = await db.query('SELECT * FROM gradiva WHERE id = ?', [req.params.id]);
  const g = vrstice[0];
  if (!g || !(await mojPredmet(req.session.uporabnik.profilId, g.predmet_id))) {
    return res.status(403).render('napaka', { sporocilo: 'Do tega gradiva nimate dostopa.' });
  }
  res.download(g.pot, g.ime_datoteke); // pošljemo datoteko s pravim imenom
});

// prenos oddane naloge
router.get('/naloga/:id', async (req, res) => {
  const [vrstice] = await db.query(
    'SELECT * FROM naloge WHERE id = ? AND potrjeno = TRUE', [req.params.id]);
  const n = vrstice[0];
  if (!n || !(await mojPredmet(req.session.uporabnik.profilId, n.predmet_id))) {
    return res.status(403).render('napaka', { sporocilo: 'Do te naloge nimate dostopa.' });
  }
  res.download(n.pot, n.ime_datoteke);
});

module.exports = router;
