// routes/koledar.js - koledar rokov za učitelje in učence
// Prikaže en mesec (od ponedeljka do nedelje) in v vsakem dnevu naloge, ki imajo tisti dan rok.
// Učitelj vidi naloge svojih skupin, učenec naloge svojih predmetov v svojem razredu.
// Mesec izberemo v naslovu: /koledar?mesec=2026-11

const express = require('express');
const db = require('../db');
const { prijavljen } = require('../preveri');

const router = express.Router();
router.use(prijavljen);

const MESECI = ['januar', 'februar', 'marec', 'april', 'maj', 'junij',
  'julij', 'avgust', 'september', 'oktober', 'november', 'december'];

// datum kot besedilo "2026-11-08" (za primerjanje dni)
function kljuc(d) {
  const dvo = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + dvo(d.getMonth() + 1) + '-' + dvo(d.getDate());
}

router.get('/', async (req, res) => {
  const u = req.session.uporabnik;
  if (u.vloga === 'administrator') {
    return res.status(403).render('napaka', { sporocilo: 'Koledar je za učitelje in učence.' });
  }

  // ===== 1) kateri mesec =====
  const danes = new Date();
  let leto = danes.getFullYear();
  let mesec = danes.getMonth(); // 0 = januar
  const izbran = /^(\d{4})-(\d{2})$/.exec(req.query.mesec || '');
  if (izbran && Number(izbran[2]) >= 1 && Number(izbran[2]) <= 12) {
    leto = Number(izbran[1]);
    mesec = Number(izbran[2]) - 1;
  }
  const zacetek = new Date(leto, mesec, 1);   // prvi dan meseca
  const konec = new Date(leto, mesec + 1, 1); // prvi dan naslednjega meseca

  // ===== 2) naloge z rokom v tem mesecu =====
  let naloge;
  if (u.vloga === 'ucitelj') {
    [naloge] = await db.query(`
      SELECT n.id, n.naslov, n.rok, p.naziv AS predmet, r.naziv AS razred,
        (SELECT COUNT(*) FROM oddaje o WHERE o.naloga_id = n.id AND o.potrjeno = TRUE) AS st_oddaj
      FROM naloge n
      JOIN ucitelj_predmet up ON up.predmet_id = n.predmet_id AND up.razred_id = n.razred_id
      JOIN predmeti p ON p.id = n.predmet_id
      JOIN razredi r ON r.id = n.razred_id
      WHERE up.ucitelj_id = ? AND n.rok >= ? AND n.rok < ?
      ORDER BY n.rok`, [u.profilId, zacetek, konec]);
  } else {
    [naloge] = await db.query(`
      SELECT n.id, n.naslov, n.rok, p.naziv AS predmet,
        o.id AS oddaja_id, o.ocena, (o.oddano > n.rok) AS zamuda
      FROM naloge n
      JOIN ucenci uc ON uc.razred_id = n.razred_id AND uc.id = ?
      JOIN ucenec_predmet up ON up.ucenec_id = uc.id AND up.predmet_id = n.predmet_id
      JOIN predmeti p ON p.id = n.predmet_id
      LEFT JOIN oddaje o ON o.naloga_id = n.id AND o.ucenec_id = uc.id AND o.potrjeno = TRUE
      WHERE n.rok >= ? AND n.rok < ?
      ORDER BY n.rok`, [u.profilId, zacetek, konec]);
  }

  // ===== 3) mreža dni: tedni po 7 dni, prazna polja pred 1. in za zadnjim dnem =====
  const poDnevih = {}; // "2026-11-10" -> [naloge]
  for (const n of naloge) {
    const k = kljuc(new Date(n.rok));
    if (!poDnevih[k]) poDnevih[k] = [];
    poDnevih[k].push(n);
  }

  const tedni = [];
  let teden = [];
  const prazni = (zacetek.getDay() + 6) % 7; // koliko praznih polj pred 1. dnem (ponedeljek = 0)
  for (let i = 0; i < prazni; i++) teden.push(null);

  const stDni = new Date(leto, mesec + 1, 0).getDate(); // zadnji dan meseca
  for (let dan = 1; dan <= stDni; dan++) {
    const d = new Date(leto, mesec, dan);
    teden.push({
      dan: dan,
      danes: kljuc(d) === kljuc(danes),
      vikend: d.getDay() === 0 || d.getDay() === 6,
      naloge: poDnevih[kljuc(d)] || []
    });
    if (teden.length === 7) { tedni.push(teden); teden = []; }
  }
  if (teden.length > 0) {
    while (teden.length < 7) teden.push(null);
    tedni.push(teden);
  }

  // ===== 4) povezavi na prejšnji in naslednji mesec =====
  const dvo = n => String(n).padStart(2, '0');
  const prej = new Date(leto, mesec - 1, 1);
  const nasl = new Date(leto, mesec + 1, 1);

  res.render('koledar', {
    naslovMeseca: MESECI[mesec] + ' ' + leto,
    tedni: tedni,
    naloge: naloge,
    prejsnji: prej.getFullYear() + '-' + dvo(prej.getMonth() + 1),
    naslednji: nasl.getFullYear() + '-' + dvo(nasl.getMonth() + 1),
    zdaj: danes
  });
});

module.exports = router;
