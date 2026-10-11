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
  next();
});

// ===== 3) POTI =====
// Tukaj bomo dodajali datoteke s potmi, ko jih naredimo, npr.:
// app.use('/admin', require('./routes/admin'));

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

// ===== 4) ZAGON =====
// 0.0.0.0 pomeni, da strežnik posluša na vseh omrežnih vmesnikih
// (to rabi Docker, da lahko pride do aplikacije od zunaj)
app.listen(PORT, '0.0.0.0', () => {
  console.log('sola-is teče na portu ' + PORT);
});
