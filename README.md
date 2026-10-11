# Šolski IS

Spletna aplikacija za podporo šolskemu delu na daljavo — projekt zaključnega izpita pri predmetu RPS.
Sistem ima tri poglede: **administrator**, **učitelj** in **učenec**.

**Živa različica:** https://projekt.pajp.duckdns.org

## Skupina
| Član | Vloga | GitHub | Veja |
|---|---|---|---|
| Jan Marko | vzdrževalec informacijskega sistema (IS) | janMsc123 | `pajp` |
| Črt Peterlin | razvijalec aplikacije | CRTPET1 | `crt` |
| Matevž Zvir | razvijalec aplikacije | Matevzz1 | `matevz` |

Mentor: [DOPOLNI]

## Tehnologije
| Področje | Izbira |
|---|---|
| Aplikacija | Node.js 20 + Express 5, predloge EJS |
| Podatkovna baza | MariaDB 11 |
| Prijava | express-session (seje), bcryptjs (zgoščena gesla) |
| Nalaganje datotek | multer |
| Vsebniki | Docker + Docker Compose |
| Obrnjeni posrednik + HTTPS | Caddy (Let's Encrypt), domena DuckDNS |
| Nadzor različic | Git + GitHub |

## Zagon
```bash
cp .env.example .env        # nato v .env nastavi gesla in SESSION_SECRET
docker compose up -d --build
```
Aplikacija je na http://localhost:8097. Podrobnosti so v [dokumentacija/namestitev.md](dokumentacija/namestitev.md).

Testni uporabniki (geslo za vse: `geslo123`):
- administrator: `admin@sola.si`
- učitelji in učenci: `ime.priimek@sola.si` (seznam v `db/init/02-testni-podatki.sql`)

## Struktura repozitorija
```
sola-is/
├── app/                      spletna aplikacija
│   ├── server.js             vstopna točka: nastavitve, seje, poti
│   ├── db.js                 povezava z bazo
│   ├── preveri.js            preverjanje pravic (avtorizacija)
│   ├── datoteke.js           nalaganje datotek
│   ├── routes/               poti: prijava, admin, ucitelj, ucenec
│   ├── views/                HTML predloge (EJS)
│   ├── public/               style.css
│   ├── package.json
│   └── Dockerfile
├── db/init/                  SQL: tabele in testni podatki
├── scripts/                  auto-deploy, varnostne kopije, systemd enote
├── dokumentacija/            specifikacija, ER diagram, namestitev, poročila
├── porocila/                 dnevna poročila (vsak član svoja mapa)
├── docker-compose.yml
└── .env.example
```

## Pravila za veje in pull requeste
```
pajp / crt / matevz  ──PR──►  develop  ──PR──►  main  ──►  produkcija
   (osebne veje)            (skupna razvojna)   (stabilna)   (samodejno)
```
1. **Vsak dela na svoji veji** (`pajp`, `crt`, `matevz`). Pred začetkom dela potegne zadnji `develop`:
   `git pull origin develop`.
2. **Ko je naloga končana**, odpre pull request v `develop`. V opisu napiše, kaj je naredil in kako
   se to preizkusi.
3. **Pregled kode:** PR pregleda vsaj en drug član skupine. Ko je vse v redu, ga združi.
4. **`main` je zaščiten** — vanj ni mogoče pushati direktno, samo prek pull requesta iz `develop`.
   To naredimo ob koncu tedna, ko vse deluje.
5. **Vsak push v `main` gre v živo**: strežnik vsako minuto preveri `main` in aplikacijo
   samodejno posodobi (glej [scripts/systemd/README.md](scripts/systemd/README.md)).
6. **Commit sporočila** pišemo kratko in v slovenščini, s predpono: `feat:` (nova funkcija),
   `fix:` (popravek), `docs:` (dokumentacija).
7. **Napake** zapisujemo kot GitHub Issues.

## Dokumentacija
- [Specifikacija sistema](dokumentacija/specifikacija.md)
- [Namestitev in konfiguracija strežnika](dokumentacija/namestitev.md)
- [Časovni načrt](dokumentacija/casovni-nacrt.md)
- [Navodila projekta (RPS)](dokumentacija/navodila-RPS.pdf)
- ER diagram: [dokumentacija/er-diagram.png](dokumentacija/er-diagram.png)
- Tedenska poročila: `dokumentacija/porocilo-teden-*.pdf`
- Dnevna poročila: [porocila/](porocila/)
