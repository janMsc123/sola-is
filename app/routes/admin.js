// routes/admin.js — pogled administratorja
// vpis, urejanje in brisanje predmetov, učiteljev in učencev (CRUD)
// ter določanje, kdo uči / obiskuje kateri predmet

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { samo } = require('../preveri');

const router = express.Router();

// vse poti v tej datoteki so samo za administratorja
router.use(samo('administrator'));

// pomožna funkcija: iz obrazca dobimo izbrane predmete kot seznam
// (en kljukec pride kot besedilo, več kljukcev kot seznam, nič kljukcev kot undefined)
function izbraniPredmeti(body) {
  if (!body.predmeti) return [];
  if (Array.isArray(body.predmeti)) return body.predmeti;
  return [body.predmeti];
}

// domača stran administratorja: kratek pregled
router.get('/', async (req, res) => {
  const [[st]] = await db.query(`
    SELECT (SELECT COUNT(*) FROM predmeti) AS predmeti,
           (SELECT COUNT(*) FROM ucitelji) AS ucitelji,
           (SELECT COUNT(*) FROM ucenci)   AS ucenci`);
  res.render('admin/domov', { st: st });
});

// =====================================================
// PREDMETI
// =====================================================

// seznam predmetov + obrazec za nov predmet
router.get('/predmeti', async (req, res) => {
  const [predmeti] = await db.query(`
    SELECT p.id, p.naziv,
      (SELECT COUNT(*) FROM ucitelj_predmet WHERE predmet_id = p.id) AS st_uciteljev,
      (SELECT COUNT(*) FROM ucenec_predmet  WHERE predmet_id = p.id) AS st_ucencev
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

// briši predmet (povezave, gradiva in naloge se pobrišejo same: ON DELETE CASCADE)
router.post('/predmeti/:id/brisi', async (req, res) => {
  await db.query('DELETE FROM predmeti WHERE id = ?', [req.params.id]);
  res.redirect('/admin/predmeti');
});

// =====================================================
// UČITELJI in UČENCI
// Oba imata enako zgradbo (račun v "uporabniki" + profil + povezave s predmeti),
// zato ju obdelamo z isto kodo. "vrsta" pove, s katero tabelo delamo.
// =====================================================

const VRSTE = {
  ucitelji: {
    tabela: 'ucitelji',           // tabela s profili
    povezave: 'ucitelj_predmet',  // povezovalna tabela s predmeti
    stolpec: 'ucitelj_id',        // tuj ključ v povezovalni tabeli
    vloga: 'ucitelj',             // vloga v tabeli uporabniki
    naslov: 'Učitelji',
    ednina: 'učitelj',
    najmanjPredmetov: 1           // učitelj mora učiti vsaj 1 predmet
  },
  ucenci: {
    tabela: 'ucenci',
    povezave: 'ucenec_predmet',
    stolpec: 'ucenec_id',
    vloga: 'ucenec',
    naslov: 'Učenci',
    ednina: 'učenec',
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

// seznam učiteljev / učencev (z iskanjem po imenu ali priimku)
router.get('/:vrsta', async (req, res) => {
  const v = req.v;
  const iskanje = req.query.iskanje || '';

  // GROUP_CONCAT združi vse predmete osebe v eno besedilo, npr. "Fizika, Matematika"
  const [osebe] = await db.query(`
    SELECT o.id, o.ime, o.priimek, u.email,
      GROUP_CONCAT(p.naziv ORDER BY p.naziv SEPARATOR ', ') AS predmeti
    FROM ${v.tabela} o
    JOIN uporabniki u ON u.id = o.uporabnik_id
    LEFT JOIN ${v.povezave} op ON op.${v.stolpec} = o.id
    LEFT JOIN predmeti p ON p.id = op.predmet_id
    WHERE o.ime LIKE ? OR o.priimek LIKE ?
    GROUP BY o.id
    ORDER BY o.priimek, o.ime`,
    ['%' + iskanje + '%', '%' + iskanje + '%']);

  res.render('admin/osebe', { osebe: osebe, vrsta: req.vrsta, v: v, iskanje: iskanje });
});

// obrazec za novo osebo
router.get('/:vrsta/nov', async (req, res) => {
  const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
  res.render('admin/oseba-obrazec', {
    vrsta: req.vrsta, v: req.v, predmeti: predmeti,
    oseba: {}, izbrani: [], napaka: null
  });
});

// obrazec za urejanje obstoječe osebe
router.get('/:vrsta/:id', async (req, res) => {
  const v = req.v;
  const [vrstice] = await db.query(`
    SELECT o.id, o.ime, o.priimek, u.email
    FROM ${v.tabela} o JOIN uporabniki u ON u.id = o.uporabnik_id
    WHERE o.id = ?`, [req.params.id]);

  if (vrstice.length === 0) {
    return res.status(404).render('napaka', { sporocilo: 'Oseba ne obstaja.' });
  }

  const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
  const [povezave] = await db.query(
    `SELECT predmet_id FROM ${v.povezave} WHERE ${v.stolpec} = ?`, [req.params.id]);

  res.render('admin/oseba-obrazec', {
    vrsta: req.vrsta, v: v, predmeti: predmeti,
    oseba: vrstice[0],
    izbrani: povezave.map(p => String(p.predmet_id)), // id-ji obkljukanih predmetov
    napaka: null
  });
});

// shrani (nova oseba, če ni id-ja, sicer urejanje)
router.post(['/:vrsta', '/:vrsta/:id'], async (req, res) => {
  const v = req.v;
  const id = req.params.id; // undefined pri novi osebi
  const ime = req.body.ime.trim();
  const priimek = req.body.priimek.trim();
  const email = req.body.email.trim();
  const geslo = req.body.geslo;
  const izbrani = izbraniPredmeti(req.body);

  // ===== validacija =====
  let napaka = null;
  if (!ime || !priimek || !email) {
    napaka = 'Izpolnite ime, priimek in email.';
  } else if (!id && geslo.length < 6) {
    napaka = 'Geslo mora imeti vsaj 6 znakov.';          // pri novi osebi je geslo obvezno
  } else if (id && geslo && geslo.length < 6) {
    napaka = 'Novo geslo mora imeti vsaj 6 znakov.';     // pri urejanju samo, če ga spreminjamo
  } else if (izbrani.length < v.najmanjPredmetov) {
    napaka = 'Izberite vsaj ' + v.najmanjPredmetov + ' predmet(a).';
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
    const [predmeti] = await db.query('SELECT * FROM predmeti ORDER BY naziv');
    return res.render('admin/oseba-obrazec', {
      vrsta: req.vrsta, v: v, predmeti: predmeti,
      oseba: { id: id, ime: ime, priimek: priimek, email: email },
      izbrani: izbrani, napaka: napaka
    });
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

  // vpišemo izbrane predmete
  for (const predmetId of izbrani) {
    await db.query(
      `INSERT INTO ${v.povezave} (${v.stolpec}, predmet_id) VALUES (?, ?)`,
      [osebaId, predmetId]);
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
