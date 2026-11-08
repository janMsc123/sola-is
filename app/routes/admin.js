// routes/admin.js — pogled administratorja
// vpis, urejanje in brisanje razredov, predmetov, učiteljev in učencev (CRUD)
// ter določanje, kdo uči kateri predmet v katerem razredu in kateri predmet obiskuje učenec

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { samo } = require('../preveri');

const router = express.Router();

// vse poti v tej datoteki so samo za administratorja
router.use(samo('administrator'));

// pomožna funkcija: vrednost kljukic iz obrazca kot seznam
// (en kljukec pride kot besedilo, več kljukcev kot seznam, nič kljukcev kot undefined)
function seznam(vrednost) {
  if (!vrednost) return [];
  if (Array.isArray(vrednost)) return vrednost;
  return [vrednost];
}

// domača stran administratorja: kratek pregled
router.get('/', async (req, res) => {
  const [[st]] = await db.query(`
    SELECT (SELECT COUNT(*) FROM razredi)  AS razredi,
           (SELECT COUNT(*) FROM predmeti) AS predmeti,
           (SELECT COUNT(*) FROM ucitelji) AS ucitelji,
           (SELECT COUNT(*) FROM ucenci)   AS ucenci,
           (SELECT COUNT(*) FROM naloge)   AS naloge,
           (SELECT COUNT(*) FROM oddaje WHERE potrjeno = TRUE) AS oddaje`);
  res.render('admin/domov', { st: st });
});

// =====================================================
// RAZREDI
// =====================================================

// seznam razredov + obrazec za nov razred
router.get('/razredi', async (req, res) => {
  const [razredi] = await db.query(`
    SELECT r.id, r.naziv,
      (SELECT COUNT(*) FROM ucenci WHERE razred_id = r.id) AS st_ucencev,
      (SELECT COUNT(DISTINCT ucitelj_id) FROM ucitelj_predmet WHERE razred_id = r.id) AS st_uciteljev,
      (SELECT COUNT(*) FROM ucitelj_predmet WHERE razred_id = r.id) AS st_predmetov
    FROM razredi r
    ORDER BY r.naziv`);
  res.render('admin/razredi', { razredi: razredi, napaka: req.query.napaka });
});

// dodaj razred
router.post('/razredi', async (req, res) => {
  const naziv = req.body.naziv.trim();
  if (!naziv) {
    return res.redirect('/admin/razredi?napaka=Vpišite naziv razreda.');
  }
  try {
    await db.query('INSERT INTO razredi (naziv) VALUES (?)', [naziv]);
  } catch (err) {
    // naziv je v bazi UNIQUE
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect('/admin/razredi?napaka=Razred s tem nazivom že obstaja.');
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
      return res.redirect('/admin/razredi?napaka=Naziv je predolg (največ 20 znakov).');
    }
    throw err;
  }
  res.redirect('/admin/razredi');
});

// en razred: urejanje naziva, seznam učencev in kdo kaj uči v razredu
async function pokaziRazred(res, razred, napaka) {
  const [ucenci] = await db.query(
    'SELECT id, ime, priimek FROM ucenci WHERE razred_id = ? ORDER BY priimek, ime', [razred.id]);
  const [pouk] = await db.query(`
    SELECT p.naziv AS predmet, t.id AS ucitelj_id, t.ime, t.priimek
    FROM ucitelj_predmet up
    JOIN predmeti p ON p.id = up.predmet_id
    JOIN ucitelji t ON t.id = up.ucitelj_id
    WHERE up.razred_id = ?
    ORDER BY p.naziv`, [razred.id]);
  res.render('admin/razred-uredi', { razred: razred, ucenci: ucenci, pouk: pouk, napaka: napaka });
}

router.get('/razredi/:id', async (req, res) => {
  const [vrstice] = await db.query('SELECT * FROM razredi WHERE id = ?', [req.params.id]);
  if (vrstice.length === 0) {
    return res.status(404).render('napaka', { sporocilo: 'Razred ne obstaja.' });
  }
  await pokaziRazred(res, vrstice[0], null);
});

// shrani nov naziv razreda
router.post('/razredi/:id', async (req, res) => {
  const naziv = req.body.naziv.trim();
  const razred = { id: req.params.id, naziv: naziv };

  if (!naziv) {
    return pokaziRazred(res, razred, 'Vpišite naziv razreda.');
  }
  try {
    await db.query('UPDATE razredi SET naziv = ? WHERE id = ?', [naziv, req.params.id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return pokaziRazred(res, razred, 'Razred s tem nazivom že obstaja.');
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
      return pokaziRazred(res, razred, 'Naziv je predolg (največ 20 znakov).');
    }
    throw err;
  }
  res.redirect('/admin/razredi');
});

// briši razred: učenci ostanejo brez razreda (SET NULL),
// pouk, gradiva in naloge razreda se pobrišejo (CASCADE)
router.post('/razredi/:id/brisi', async (req, res) => {
  await db.query('DELETE FROM razredi WHERE id = ?', [req.params.id]);
  res.redirect('/admin/razredi');
});

// =====================================================
// PREDMETI
// =====================================================

// seznam predmetov + obrazec za nov predmet
router.get('/predmeti', async (req, res) => {
  const [predmeti] = await db.query(`
    SELECT p.id, p.naziv,
      (SELECT COUNT(DISTINCT ucitelj_id) FROM ucitelj_predmet WHERE predmet_id = p.id) AS st_uciteljev,
      (SELECT COUNT(*) FROM ucenec_predmet WHERE predmet_id = p.id) AS st_ucencev
    FROM predmeti p
    ORDER BY p.naziv`);
  res.render('admin/predmeti', { predmeti: predmeti, napaka: req.query.napaka });
});

// dodaj predmet
router.post('/predmeti', async (req, res) => {
  const naziv = req.body.naziv.trim();
  if (!naziv) {
    return res.redirect('/admin/predmeti?napaka=Vpišite naziv predmeta.');
  }
  try {
    await db.query('INSERT INTO predmeti (naziv) VALUES (?)', [naziv]);
  } catch (err) {
    // naziv je v bazi UNIQUE, zato isti predmet ne more obstajati dvakrat
    if (err.code === 'ER_DUP_ENTRY') {
      return res.redirect('/admin/predmeti?napaka=Predmet s tem nazivom že obstaja.');
    }
    throw err;
  }
  res.redirect('/admin/predmeti');
});

// obrazec za urejanje predmeta
router.get('/predmeti/:id', async (req, res) => {
  const [vrstice] = await db.query('SELECT * FROM predmeti WHERE id = ?', [req.params.id]);
  if (vrstice.length === 0) {
    return res.status(404).render('napaka', { sporocilo: 'Predmet ne obstaja.' });
  }
  res.render('admin/predmet-uredi', { predmet: vrstice[0], napaka: null });
});

// shrani spremembo predmeta
router.post('/predmeti/:id', async (req, res) => {
  const naziv = req.body.naziv.trim();
  const predmet = { id: req.params.id, naziv: naziv };

  if (!naziv) {
    return res.render('admin/predmet-uredi', { predmet: predmet, napaka: 'Vpišite naziv predmeta.' });
  }
  try {
    await db.query('UPDATE predmeti SET naziv = ? WHERE id = ?', [naziv, req.params.id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.render('admin/predmet-uredi', { predmet: predmet, napaka: 'Predmet s tem nazivom že obstaja.' });
    }
    throw err;
  }
  res.redirect('/admin/predmeti');
});

// briši predmet (povezave, gradiva, naloge in oddaje se pobrišejo same: ON DELETE CASCADE)
router.post('/predmeti/:id/brisi', async (req, res) => {
  await db.query('DELETE FROM predmeti WHERE id = ?', [req.params.id]);
  res.redirect('/admin/predmeti');
});

// =====================================================
// UČITELJI in UČENCI
// Oba imata enako zgradbo (račun v "uporabniki" + profil + povezave s predmeti),
// zato ju obdelamo z isto kodo. "vrsta" pove, s katero tabelo delamo.
// Razlika: učitelj uči predmet v izbranih razredih (mreža predmet x razred),
// učenec je v enem razredu in obiskuje izbrane predmete.
// =====================================================

const VRSTE = {
  ucitelji: {
    tabela: 'ucitelji',           // tabela s profili
    povezave: 'ucitelj_predmet',  // povezovalna tabela s predmeti
    stolpec: 'ucitelj_id',        // tuj ključ v povezovalni tabeli
    vloga: 'ucitelj',             // vloga v tabeli uporabniki
    naslov: 'Učitelji',
    ednina: 'učitelj',
    tozilnik: 'učitelja',         // za naslov "Uredi učitelja"
    najmanjPredmetov: 1           // učitelj mora učiti vsaj 1 predmet
  },
  ucenci: {
    tabela: 'ucenci',
    povezave: 'ucenec_predmet',
    stolpec: 'ucenec_id',
    vloga: 'ucenec',
    naslov: 'Učenci',
    ednina: 'učenec',
    tozilnik: 'učenca',
    najmanjPredmetov: 2           // učenec mora obiskovati več kot en predmet
  }
};

// "vrsta" v naslovu je lahko samo ucitelji ali ucenci
router.param('vrsta', (req, res, next, vrsta) => {
  if (!VRSTE[vrsta]) {
    return res.status(404).render('napaka', { sporocilo: 'Stran ne obstaja.' });
  }
  req.vrsta = vrsta;
  req.v = VRSTE[vrsta];
  next();
});

// seznam učiteljev / učencev (z iskanjem po imenu ali priimku, učence tudi po razredu)
router.get('/:vrsta', async (req, res) => {
  const v = req.v;
  const iskanje = req.query.iskanje || '';
  const razredId = req.query.razred || '';

  // GROUP_CONCAT združi vse predmete osebe v eno besedilo, npr. "Fizika, Matematika"
  let sql = `
    SELECT o.id, o.ime, o.priimek, u.email,
      GROUP_CONCAT(DISTINCT p.naziv ORDER BY p.naziv SEPARATOR ', ') AS predmeti
      ${req.vrsta === 'ucenci' ? ', r.naziv AS razred' : ''}
    FROM ${v.tabela} o
    JOIN uporabniki u ON u.id = o.uporabnik_id
    ${req.vrsta === 'ucenci' ? 'LEFT JOIN razredi r ON r.id = o.razred_id' : ''}
    LEFT JOIN ${v.povezave} op ON op.${v.stolpec} = o.id
    LEFT JOIN predmeti p ON p.id = op.predmet_id
    WHERE (o.ime LIKE ? OR o.priimek LIKE ?)`;
  const parametri = ['%' + iskanje + '%', '%' + iskanje + '%'];

  if (req.vrsta === 'ucenci' && razredId) {
    sql += ' AND o.razred_id = ?';
    parametri.push(razredId);
  }
  sql += ' GROUP BY o.id ORDER BY o.priimek, o.ime';

  const [osebe] = await db.query(sql, parametri);

  // pri učiteljih zapišemo še razrede: "Matematika (1.A, 3.A), Biologija (4.A)"
  if (req.vrsta === 'ucitelji') {
    const [pouk] = await db.query(`
      SELECT up.ucitelj_id, p.naziv,
        GROUP_CONCAT(r.naziv ORDER BY r.naziv SEPARATOR ', ') AS razredi
      FROM ucitelj_predmet up
      JOIN predmeti p ON p.id = up.predmet_id
      JOIN razredi r ON r.id = up.razred_id
      GROUP BY up.ucitelj_id, p.id
      ORDER BY p.naziv`);
    for (const o of osebe) {
      const moji = pouk.filter(x => x.ucitelj_id === o.id);
      o.predmeti = moji.map(x => x.naziv + ' (' + x.razredi + ')').join(', ');
    }
  }

  const [razredi] = await db.query('SELECT * FROM razredi ORDER BY naziv');
  res.render('admin/osebe', {
    osebe: osebe, vrsta: req.vrsta, v: v, iskanje: iskanje, razredi: razredi, razredId: razredId
  });
});

// pokaže obrazec za osebo (nova ali urejanje)
// izbrani: pri učitelju seznam "predmet-razred" (npr. "1-3"), pri učencu seznam id-jev predmetov
async function pokaziObrazec(req, res, oseba, izbrani, napaka) {
  const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
  const [razredi] = await db.query('SELECT * FROM razredi ORDER BY naziv');
  res.render('admin/oseba-obrazec', {
    vrsta: req.vrsta, v: req.v, predmeti: predmeti, razredi: razredi,
    oseba: oseba, izbrani: izbrani, napaka: napaka
  });
}

// obrazec za novo osebo
router.get('/:vrsta/nov', async (req, res) => {
  await pokaziObrazec(req, res, {}, [], null);
});

// obrazec za urejanje obstoječe osebe
router.get('/:vrsta/:id', async (req, res) => {
  const v = req.v;
  const [vrstice] = await db.query(`
    SELECT o.*, u.email
    FROM ${v.tabela} o JOIN uporabniki u ON u.id = o.uporabnik_id
    WHERE o.id = ?`, [req.params.id]);

  if (vrstice.length === 0) {
    return res.status(404).render('napaka', { sporocilo: 'Oseba ne obstaja.' });
  }

  let izbrani;
  if (req.vrsta === 'ucitelji') {
    const [povezave] = await db.query(
      'SELECT predmet_id, razred_id FROM ucitelj_predmet WHERE ucitelj_id = ?', [req.params.id]);
    izbrani = povezave.map(p => p.predmet_id + '-' + p.razred_id); // obkljukana polja v mreži
  } else {
    const [povezave] = await db.query(
      'SELECT predmet_id FROM ucenec_predmet WHERE ucenec_id = ?', [req.params.id]);
    izbrani = povezave.map(p => String(p.predmet_id)); // id-ji obkljukanih predmetov
  }

  await pokaziObrazec(req, res, vrstice[0], izbrani, null);
});

// shrani (nova oseba, če ni id-ja, sicer urejanje)
router.post(['/:vrsta', '/:vrsta/:id'], async (req, res) => {
  const v = req.v;
  const id = req.params.id; // undefined pri novi osebi
  const ime = req.body.ime.trim();
  const priimek = req.body.priimek.trim();
  const email = req.body.email.trim();
  const geslo = req.body.geslo;
  const razredId = req.body.razred_id || null; // samo pri učencu

  // učitelj: kljukice v mreži imajo vrednost "predmet-razred", učenec: id predmeta
  let izbrani;
  if (req.vrsta === 'ucitelji') {
    izbrani = seznam(req.body.poucuje).filter(x => /^\d+-\d+$/.test(x));
  } else {
    izbrani = seznam(req.body.predmeti);
  }

  // ===== validacija =====
  let napaka = null;
  if (!ime || !priimek || !email) {
    napaka = 'Izpolnite ime, priimek in email.';
  } else if (!id && geslo.length < 6) {
    napaka = 'Geslo mora imeti vsaj 6 znakov.';          // pri novi osebi je geslo obvezno
  } else if (id && geslo && geslo.length < 6) {
    napaka = 'Novo geslo mora imeti vsaj 6 znakov.';     // pri urejanju samo, če ga spreminjamo
  } else if (req.vrsta === 'ucenci' && !razredId) {
    napaka = 'Izberite razred.';
  } else if (izbrani.length < v.najmanjPredmetov) {
    napaka = req.vrsta === 'ucitelji'
      ? 'Izberite vsaj 1 predmet v vsaj enem razredu.'
      : 'Izberite vsaj ' + v.najmanjPredmetov + ' predmet(a).';
  }

  // email mora biti unikaten (razen če je to email te iste osebe)
  if (!napaka) {
    const [obstaja] = await db.query(`
      SELECT u.id FROM uporabniki u
      WHERE u.email = ?
        AND u.id NOT IN (SELECT uporabnik_id FROM ${v.tabela} WHERE id = ?)`,
      [email, id || 0]);
    if (obstaja.length > 0) {
      napaka = 'Ta email že uporablja drug uporabnik.';
    }
  }

  if (napaka) {
    // obrazec pokažemo znova z vpisanimi podatki in napako
    return pokaziObrazec(req, res,
      { id: id, ime: ime, priimek: priimek, email: email, razred_id: razredId },
      izbrani, napaka);
  }

  let osebaId = id;

  if (!id) {
    // ===== NOVA OSEBA =====
    const hash = await bcrypt.hash(geslo, 10);
    const [r] = await db.query(
      'INSERT INTO uporabniki (email, geslo_hash, vloga) VALUES (?, ?, ?)',
      [email, hash, v.vloga]);
    const [r2] = await db.query(
      `INSERT INTO ${v.tabela} (uporabnik_id, ime, priimek) VALUES (?, ?, ?)`,
      [r.insertId, ime, priimek]);
    osebaId = r2.insertId;
  } else {
    // ===== UREJANJE =====
    await db.query(`UPDATE ${v.tabela} SET ime = ?, priimek = ? WHERE id = ?`, [ime, priimek, id]);
    await db.query(
      `UPDATE uporabniki SET email = ? WHERE id = (SELECT uporabnik_id FROM ${v.tabela} WHERE id = ?)`,
      [email, id]);

    // geslo spremenimo samo, če je vpisano novo
    if (geslo) {
      const hash = await bcrypt.hash(geslo, 10);
      await db.query(
        `UPDATE uporabniki SET geslo_hash = ? WHERE id = (SELECT uporabnik_id FROM ${v.tabela} WHERE id = ?)`,
        [hash, id]);
    }

    // stare povezave s predmeti pobrišemo, spodaj vpišemo nove
    await db.query(`DELETE FROM ${v.povezave} WHERE ${v.stolpec} = ?`, [id]);
  }

  if (req.vrsta === 'ucitelji') {
    // vsaka kljukica "predmet-razred" postane ena vrstica v ucitelj_predmet
    for (const par of izbrani) {
      const [predmetId, rId] = par.split('-');
      await db.query(
        'INSERT INTO ucitelj_predmet (ucitelj_id, predmet_id, razred_id) VALUES (?, ?, ?)',
        [osebaId, predmetId, rId]);
    }
  } else {
    // učenec: razred in izbrani predmeti
    await db.query('UPDATE ucenci SET razred_id = ? WHERE id = ?', [razredId, osebaId]);
    for (const predmetId of izbrani) {
      await db.query(
        'INSERT INTO ucenec_predmet (ucenec_id, predmet_id) VALUES (?, ?)',
        [osebaId, predmetId]);
    }
  }

  res.redirect('/admin/' + req.vrsta);
});

// briši osebo: pobrišemo račun v "uporabniki", profil in povezave gredo zraven (CASCADE)
router.post('/:vrsta/:id/brisi', async (req, res) => {
  const v = req.v;
  await db.query(
    `DELETE FROM uporabniki WHERE id = (SELECT uporabnik_id FROM ${v.tabela} WHERE id = ?)`,
    [req.params.id]);
  res.redirect('/admin/' + req.vrsta);
});

module.exports = router;
