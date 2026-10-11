// preveri.js — preverjanje pravic (avtorizacija)
// Te funkcije postavimo pred poti, da do njih pride samo pravi uporabnik.

// ali je uporabnik sploh prijavljen
function prijavljen(req, res, next) {
  if (!req.session.uporabnik) {
    return res.redirect('/prijava'); // ni prijavljen -> na prijavo
  }
  next(); // je prijavljen -> nadaljuj
}

// ali ima uporabnik točno določeno vlogo
// uporaba: router.use(samo('administrator'))
function samo(vloga) {
  return function (req, res, next) {
    const u = req.session.uporabnik;

    if (!u) {
      return res.redirect('/prijava');
    }
    if (u.vloga !== vloga) {
      // prijavljen je, ampak nima pravice (npr. učenec na /admin)
      return res.status(403).render('napaka', {
        sporocilo: 'Do te strani nimate dostopa.'
      });
    }
    next();
  };
}

module.exports = { prijavljen, samo };
