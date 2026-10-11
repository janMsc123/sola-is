// routes/prijava.js — prijava, registracija učenca in odjava

const express = require('express');
const bcrypt = require('bcryptjs'); // zgoščevanje gesel
const db = require('../db');

const router = express.Router();

// ===== PRIJAVA =====

// pokaži obrazec za prijavo
router.get('/prijava', (req, res) => {
  res.render('prijava', { napaka: null, email: '' });
});

// preveri email in geslo
router.post('/prijava', async (req, res) => {
  const email = req.body.email.trim();
  const geslo = req.body.geslo;

  // poiščemo uporabnika po emailu
  const [vrstice] = await db.query('SELECT * FROM uporabniki WHERE email = ?', [email]);
  const u = vrstice[0];

  // bcrypt.compare primerja vpisano geslo z zgoščenim geslom iz baze
  if (!u || !(await bcrypt.compare(geslo, u.geslo_hash))) {
    return res.render('prijava', { napaka: 'Napačen email ali geslo.', email: email });
  }

  // poiščemo še ime in id profila (učitelj ali učenec)
  let profilId = null;
  let ime = 'Administrator';

  if (u.vloga === 'ucitelj') {
    const [p] = await db.query('SELECT id, ime, priimek FROM ucitelji WHERE uporabnik_id = ?', [u.id]);
    profilId = p[0].id;
    ime = p[0].ime + ' ' + p[0].priimek;
  }
  if (u.vloga === 'ucenec') {
    const [p] = await db.query('SELECT id, ime, priimek FROM ucenci WHERE uporabnik_id = ?', [u.id]);
    profilId = p[0].id;
    ime = p[0].ime + ' ' + p[0].priimek;
  }

  // shranimo v sejo -> od zdaj naprej je uporabnik prijavljen
  req.session.uporabnik = {
    id: u.id,
    vloga: u.vloga,
    profilId: profilId,
    ime: ime
  };

  res.redirect('/'); // domača stran ga preusmeri glede na vlogo
});

// ===== REGISTRACIJA (samo učenci) =====

router.get('/registracija', (req, res) => {
  res.render('registracija', { napaka: null, podatki: {} });
});

router.post('/registracija', async (req, res) => {
  const ime = req.body.ime.trim();
  const priimek = req.body.priimek.trim();
  const email = req.body.email.trim();
  const geslo = req.body.geslo;

  // osnovna validacija
  let napaka = null;
  if (!ime || !priimek || !email) {
    napaka = 'Izpolnite vsa polja.';
  } else if (geslo.length < 6) {
    napaka = 'Geslo mora imeti vsaj 6 znakov.';
  } else if (geslo !== req.body.geslo2) {
    napaka = 'Gesli se ne ujemata.';
  }

  // ali email že obstaja
  if (!napaka) {
    const [obstaja] = await db.query('SELECT id FROM uporabniki WHERE email = ?', [email]);
    if (obstaja.length > 0) {
      napaka = 'Uporabnik s tem emailom že obstaja.';
    }
  }

  if (napaka) {
    return res.render('registracija', { napaka: napaka, podatki: req.body });
  }

  // geslo zgostimo (10 = koliko "krogov" zgoščevanja), nikoli ne shranimo čistega gesla
  const hash = await bcrypt.hash(geslo, 10);

  // 1) račun za prijavo
  const [rezultat] = await db.query(
    'INSERT INTO uporabniki (email, geslo_hash, vloga) VALUES (?, ?, ?)',
    [email, hash, 'ucenec']
  );
  // 2) profil učenca, povezan z računom
  const [rezultat2] = await db.query(
    'INSERT INTO ucenci (uporabnik_id, ime, priimek) VALUES (?, ?, ?)',
    [rezultat.insertId, ime, priimek]
  );

  // takoj ga prijavimo
  req.session.uporabnik = {
    id: rezultat.insertId,
    vloga: 'ucenec',
    profilId: rezultat2.insertId,
    ime: ime + ' ' + priimek
  };

  // nov učenec mora najprej izbrati predmete
  res.redirect('/ucenec/predmeti');
});

// ===== ODJAVA =====

router.get('/odjava', (req, res) => {
  req.session.destroy(() => {  // pobrišemo sejo
    res.redirect('/prijava');
  });
});

module.exports = router;
