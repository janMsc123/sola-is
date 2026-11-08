// server.js — glavna datoteka, ki zažene spletno aplikacijo

// ===== 1) KNJIŽNICE =====
const express = require('express');          // spletni strežnik
const session = require('express-session');  // seje (kdo je prijavljen)
const path = require('path');                // delo s potmi do map
const db = require('./db');                  // naša povezava z bazo (db.js)

const app = express();
const PORT = 3000; // port znotraj Docker vsebnika (navzven je 8097)

// ===== 2) NASTAVITVE =====

// HTML predloge so v mapi "views" in so napisane v EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// datoteke v mapi "public" (npr. style.css) so dostopne vsem
app.use(express.static(path.join(__dirname, 'public')));

// da lahko preberemo podatke, poslane iz <form> (req.body)
app.use(express.urlencoded({ extended: true }));

// seja: strežnik si zapomni, kdo je prijavljen (piškotek v brskalniku)
app.use(session({
  secret: process.env.SESSION_SECRET || 'samo-za-razvoj', // skrivni ključ iz .env
  resave: false,             // ne shranjuj seje, če se ni nič spremenilo
  saveUninitialized: false,  // ne ustvari seje, dokler se nihče ne prijavi
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // seja velja 2 uri
}));

// podatke o prijavljenem uporabniku pošljemo v vse predloge,
// da lahko glava pokaže pravi meni (v EJS: uporabnik)
app.use((req, res, next) => {
  res.locals.uporabnik = req.session.uporabnik || null;
  res.locals.pot = req.originalUrl.split('?')[0]; // za označitev strani v meniju
  next();
});

// pomožne funkcije za datume, ki jih uporabljajo vse predloge
// (čas je slovenski, ker ima vsebnik nastavljeno TZ=Europe/Ljubljana)

// samo datum, npr. "10. 11. 2026"
app.locals.datum = function (d) {
  return d ? new Date(d).toLocaleDateString('sl-SI') : '';
};

// datum in ura, npr. "10. 11. 2026 23:59"
app.locals.datumUra = function (d) {
  if (!d) return '';
  d = new Date(d);
  return d.toLocaleDateString('sl-SI') + ' ' +
    d.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
};

// vrednost za <input type="datetime-local">, npr. "2026-11-10T23:59"
app.locals.zaVnos = function (d) {
  if (!d) return '';
  d = new Date(d);
  const dvo = n => String(n).padStart(2, '0'); // 5 -> "05"
  return d.getFullYear() + '-' + dvo(d.getMonth() + 1) + '-' + dvo(d.getDate()) +
    'T' + dvo(d.getHours()) + ':' + dvo(d.getMinutes());
};

// stanje naloge za enega učenca: vrne besedilo in barvo oznake (CSS razred)
// v: vrstica iz baze z oddaja_id, zamuda, ocena; rok: rok naloge; zdaj: trenutni čas
app.locals.stanje = function (v, rok, zdaj) {
  if (v.oddaja_id && v.ocena) return { besedilo: 'Ocena ' + v.ocena, barva: 'zelena' };
  if (v.oddaja_id && v.zamuda) return { besedilo: 'Oddano z zamudo', barva: 'oranzna' };
  if (v.oddaja_id) return { besedilo: 'Oddano', barva: 'zelena' };
  if (new Date(rok) < zdaj) return { besedilo: 'Ni oddano', barva: 'rdeca' };
  return { besedilo: 'Odprto', barva: 'siva' };
};

// ===== 3) POTI =====
// vsak pogled ima svojo datoteko v mapi "routes"
app.use('/', require('./routes/prijava'));          // /prijava, /registracija, /odjava
app.use('/admin', require('./routes/admin'));       // samo administrator
app.use('/ucitelj', require('./routes/ucitelj'));   // samo učitelj
app.use('/ucenec', require('./routes/ucenec'));     // samo učenec
app.use('/koledar', require('./routes/koledar'));   // učitelj in učenec: roki nalog po mesecih

// domača stran: pošlje uporabnika na pravo mesto glede na vlogo
app.get('/', (req, res) => {
  const u = req.session.uporabnik;

  if (!u) {
    return res.redirect('/prijava');          // ni prijavljen
  }
  if (u.vloga === 'administrator') {
    return res.redirect('/admin');
  }
  if (u.vloga === 'ucitelj') {
    return res.redirect('/ucitelj');
  }
  res.redirect('/ucenec');                    // ostane samo učenec
});

// preverjanje delovanja: ali strežnik in baza delata
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: true });
  } catch (err) {
    res.status(500).json({ status: 'napaka', sporocilo: err.message });
  }
});

// stran ne obstaja (404)
app.use((req, res) => {
  res.status(404).render('napaka', { sporocilo: 'Stran ne obstaja.' });
});

// nepričakovana napaka (npr. baza ne deluje) -> lepo sporočilo namesto sesutja
// (Express 5 sam ujame napake iz async funkcij in jih pošlje sem)
app.use((err, req, res, next) => {
  console.error(err); // podrobnosti zapišemo v dnevnik (docker logs)

  // prevelika datoteka (omejitev v datoteke.js)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('napaka', { sporocilo: 'Datoteka je prevelika (največ 20 MB).' });
  }
  res.status(500).render('napaka', { sporocilo: 'Prišlo je do napake na strežniku.' });
});

// ===== 4) ZAGON =====
// 0.0.0.0 pomeni, da strežnik posluša na vseh omrežnih vmesnikih
// (to rabi Docker, da lahko pride do aplikacije od zunaj)
app.listen(PORT, '0.0.0.0', () => {
  console.log('sola-is teče na portu ' + PORT);
});
