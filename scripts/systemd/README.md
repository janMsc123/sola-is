# Auto-deploy — systemd timer

Ob vsakem push-u v vejo `main` na GitHubu se produkcija (cs2, `~/stacks/sola-is`)
avtomatično posodobi v manj kot minuti.

## Kako deluje
1. `sola-is-deploy.timer` sproži `sola-is-deploy.service` **vsakih 60 sekund**.
2. Service kliče `scripts/auto-deploy.sh`, ki:
   - `git fetch origin main`
   - primerja lokalno HEAD z `origin/main`
   - če se razlikujeta: `git pull --ff-only && docker-compose up -d --build`
   - vse logira v `deploy.log`

Brez sekretov, brez webhookov, brez zunanjih uporabnikov —
samo lokalni polling, kar je za razred popolnoma dovolj.

## Namestitev (samo enkrat, na cs2)
```bash
sudo cp scripts/systemd/sola-is-deploy.service /etc/systemd/system/
sudo cp scripts/systemd/sola-is-deploy.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sola-is-deploy.timer
```

## Preverjanje
```bash
sudo systemctl list-timers sola-is-deploy.timer
sudo journalctl -u sola-is-deploy.service -n 20
tail -f ~/stacks/sola-is/deploy.log
```

## Ročni sproh
```bash
sudo systemctl start sola-is-deploy.service
```
