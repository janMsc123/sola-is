#!/usr/bin/env bash
# backup.sh — varnostna kopija podatkovne baze
# Vsak dan jo zažene sola-is-backup.timer (glej scripts/systemd/).
# Ročni zagon: ./scripts/backup.sh

set -euo pipefail   # ob napaki se skripta takoj ustavi

# mapa projekta = mapa nad to skripto
PROJEKT="$(cd "$(dirname "$0")/.." && pwd)"
MAPA="$PROJEKT/varnostne-kopije"   # kam shranjujemo kopije (ni v gitu)
HRANI_DNI=14                       # koliko dni hranimo stare kopije

cd "$PROJEKT"
mkdir -p "$MAPA"
chmod 700 "$MAPA"                  # kopije lahko bere samo lastnik

# gesla preberemo iz .env
source .env

# ime datoteke z datumom in uro, npr. sola_is-2026-10-11_0300.sql.gz
DATOTEKA="$MAPA/${DB_NAME}-$(date +%F_%H%M).sql.gz"

# mariadb-dump izvozi celotno bazo v SQL, gzip jo stisne
docker-compose exec -T baza \
  mariadb-dump -uroot -p"$DB_ROOT_GESLO" --single-transaction "$DB_NAME" \
  | gzip > "$DATOTEKA"

chmod 600 "$DATOTEKA"

# pobrišemo kopije, starejše od HRANI_DNI dni
find "$MAPA" -name '*.sql.gz' -mtime +$HRANI_DNI -delete

echo "$(date -Is) kopija shranjena: $DATOTEKA ($(du -h "$DATOTEKA" | cut -f1))"
