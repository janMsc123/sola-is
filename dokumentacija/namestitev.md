# Namestitev in konfiguracija strežnika

Avtor: Jan Marko (vzdrževalec IS)

## 1. Strežnik
| | |
|---|---|
| Operacijski sistem | Linux (Ubuntu Server) |
| Programska oprema | Docker, Docker Compose, Git, Caddy (obrnjeni posrednik) |
| Mapa projekta | `~/stacks/sola-is` |
| Javna domena | https://projekt.pajp.duckdns.org |

Domača omrežna povezava ima javni IP naslov. Poddomena `pajp.duckdns.org` (DuckDNS) kaže nanj,
usmerjevalnik pa vrata 80 in 443 posreduje na strežnik, kjer jih sprejme Caddy.

## 2. Prva namestitev
```bash
# 1) prenos kode
git clone https://github.com/janMsc123/sola-is.git ~/stacks/sola-is
cd ~/stacks/sola-is

# 2) okoljske spremenljivke (gesla niso v gitu)
cp .env.example .env
nano .env                         # nastavi gesla; SESSION_SECRET: openssl rand -hex 32

# 3) zagon
docker compose up -d --build

# 4) preverjanje
docker compose ps                 # oba vsebnika "Up", baza "healthy"
curl http://localhost:8097/api/health    # {"status":"ok","db":true}
```
Ob prvem zagonu MariaDB izvede skripte iz `db/init/` po abecedi: najprej `01-schema.sql` (tabele),
nato `02-testni-podatki.sql`. To se zgodi samo, ko je volumen baze prazen.

**Ponastavitev baze na testne podatke** (pobriše vse podatke!):
```bash
docker compose down
docker volume rm sola-is_baza_podatki
docker compose up -d
```

## 3. Okoljske spremenljivke (`.env`)
| Spremenljivka | Namen |
|---|---|
| `DB_ROOT_GESLO` | geslo uporabnika root v MariaDB (uporablja ga samo varnostna kopija) |
| `DB_NAME` | ime baze (`sola_is`) |
| `DB_USER`, `DB_PASSWORD` | uporabnik, s katerim se poveže aplikacija |
| `SESSION_SECRET` | ključ za podpis piškotka seje; če ga kdo pozna, lahko ponaredi prijavo |

## 4. Vsebniki (`docker-compose.yml`)
| Storitev | Slika | Vrata | Volumen |
|---|---|---|---|
| `baza` | `mariadb:11` | nima (samo notranje omrežje) | `baza_podatki` → `/var/lib/mysql` |
| `aplikacija` | zgrajena iz `app/Dockerfile` (`node:20-alpine`) | `8097` → `3000` | `datoteke` → `/app/datoteke` |

Obe storitvi sta v notranjem omrežju `solanet`. Aplikacija bazo najde po imenu `baza`.
Aplikacija se zažene šele, ko healthcheck baze sporoči, da je pripravljena.

## 5. Obrnjeni posrednik in HTTPS (Caddy)
Caddy sprejme zahteve na vratih 80/443 in jih posreduje aplikaciji. Potrdilo Let's Encrypt
pridobi in obnavlja sam, HTTP pa samodejno preusmeri na HTTPS.

Del datoteke `Caddyfile`:
```
projekt.pajp.duckdns.org {
    reverse_proxy 192.168.0.50:8097
}
```
Po spremembi: `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`.

Ker Caddy aplikacijo doseže prek IP naslova strežnika, mora aplikacija poslušati na `0.0.0.0`
(v `server.js`), ne samo na `localhost`.

## 6. Varnost
- **Gesla uporabnikov** so zgoščena z bcrypt (10 krogov); v bazi je samo zgoščena vrednost.
- **Baza** nima odprtih vrat navzven.
- **Aplikacija teče kot uporabnik `node`**, ne kot root (`USER node` v Dockerfile).
- **Naložene datoteke** so v volumnu `datoteke`, ki ni v mapi `public`. Mapa ima pravice `750`
  (lastnik `node`), zato jih drugi uporabniki ne morejo brati. Prenos gre samo prek poti, ki
  preverijo, ali ima prijavljeni uporabnik pravico do predmeta.
- **Gesla za bazo** so v `.env`, ki je v `.gitignore`.
- **Seja** poteče po 2 urah.

## 7. Samodejna namestitev (auto-deploy)
Systemd timer vsako minuto preveri vejo `main` na GitHubu. Če je nov commit, naredi
`git pull` in `docker compose up -d --build`. Podrobnosti: `scripts/systemd/README.md`.

## 8. Varnostne kopije baze
Skripta `scripts/backup.sh` z `mariadb-dump` izvozi celotno bazo, jo stisne z gzip in shrani v
`varnostne-kopije/` (pravice 700, ni v gitu). Hrani kopije zadnjih 14 dni.

Zagon vsak dan ob 3:00 prek systemd:
```bash
sudo cp scripts/systemd/sola-is-backup.service scripts/systemd/sola-is-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sola-is-backup.timer
```
Ročna kopija: `./scripts/backup.sh`

**Obnovitev iz kopije:**
```bash
gunzip -c varnostne-kopije/sola_is-2026-10-11_0300.sql.gz \
  | docker compose exec -T baza mariadb -uroot -p"$DB_ROOT_GESLO" sola_is
```
