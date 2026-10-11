// datoteke.js — nastavitve za nalaganje datotek (gradiva in naloge)
// Datoteke so v mapi "datoteke", ki NI v "public", zato jih ni mogoče
// odpreti direktno prek naslova. Prenese jih samo prijavljen uporabnik s pravico.

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// glavna mapa za datoteke (v Dockerju je to ločen volumen)
const MAPA = path.join(__dirname, 'datoteke');

// multer najprej shrani datoteko v začasno mapo, potem jo mi premaknemo
const zacasno = path.join(MAPA, 'zacasno');
fs.mkdirSync(zacasno, { recursive: true });

const nalaganje = multer({
  dest: zacasno,
  limits: { fileSize: 20 * 1024 * 1024 } // največ 20 MB
});

// brskalnik pošlje ime datoteke v UTF-8, multer pa ga prebere narobe (latin1),
// zato šumnike (č, š, ž) popravimo tukaj
function popraviIme(ime) {
  return Buffer.from(ime, 'latin1').toString('utf8');
}

// iz imena odstranimo znake, ki v imenu datoteke niso dovoljeni (/ \ : * ? " < > |)
function varnoIme(ime) {
  return ime.replace(/[\/\\:*?"<>|]/g, '').trim();
}

module.exports = { MAPA, nalaganje, popraviIme, varnoIme };
