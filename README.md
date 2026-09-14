# Šolski IS

Spletna aplikacija za podporo šolskemu delu na daljavo — projekt zaključnega izpita.

## Skupina
- **Pajp** — vzdrževalec informacijskega sistema (IS)
- **Nal Dobravc** — razvijalec aplikacije
- **Mitja Jančič** — razvijalec aplikacije

## Tehnologije
- **Backend:** Node.js + Express
- **Baza:** MariaDB 11
- **Frontend:** HTML + CSS + JS (brez ogrodij)
- **Vsebniki:** Docker + Docker Compose
- **Reverse proxy + HTTPS:** Caddy (Let's Encrypt)
- **Nadzor različic:** Git + GitHub

## Živa različica
[https://projekt.pajp.duckdns.org](https://projekt.pajp.duckdns.org)

Vsak `git push` v vejo `main` avtomatično posodobi produkcijo (systemd timer poll+rebuild).

## Struktura repozitorija
```
sola-is/
├── app/                      koda spletne aplikacije (Node.js/Express)
│   ├── public/               statični HTML/CSS/JS
│   ├── routes/               API poti
│   ├── db/                   povezava do baze
│   ├── server.js             vstopna točka
│   ├── package.json
│   └── Dockerfile
├── db/init/                  SQL skripte za inicializacijo baze
├── porocila/                 dnevna in tedenska poročila
├── dokumentacija/            ER diagram, wireframi, specifikacija
├── docker-compose.yml
├── .env.example
└── README.md
```

## Veje (branches)
- `main` — stabilna, produkcijska različica; vsi merge-i preko pull requesta
- `nal` — delovna veja za Nal Dobravc
- `mitja` — delovna veja za Mitja Jančič
- `pajp` / feature-veje — po potrebi

## Kako pognati lokalno
```bash
cp .env.example .env         # nastavi gesla
docker-compose up -d --build
# aplikacija: http://localhost:8097
# baza:       localhost:3306 (samo znotraj docker omrežja)
```

## Časovni načrt (6 tednov)
Glej [dokumentacija/casovni-nacrt.md](dokumentacija/casovni-nacrt.md).
