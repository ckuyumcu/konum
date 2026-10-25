#!/bin/sh
# Konum SQLite yedekleme — gecelik cron'a bağlanır.
# Kullanım: 0 4 * * * /opt/konum/scripts/yedekle.sh
# sqlite3 .backup çevrimiçi (online) yedek alır; sunucu çalışırken güvenlidir.

set -eu

DB="${KONUM_DB:-/opt/konum/server/data/konum.db}"
HEDEF_DIZIN="${KONUM_YEDEK_DIZIN:-/opt/konum/yedekler}"
TUT_GUN=14

mkdir -p "$HEDEF_DIZIN"
TARIH=$(date +%Y-%m-%d)
sqlite3 "$DB" ".backup '$HEDEF_DIZIN/konum-$TARIH.db'"

# gizli dosyaları da yedekle (LLM anahtarı, HMAC anahtarı) — aynı klasörde, 600 izinle
if [ -f "$HOME/.konum/secrets.json" ]; then
  cp "$HOME/.konum/secrets.json" "$HEDEF_DIZIN/secrets-$TARIH.json"
  chmod 600 "$HEDEF_DIZIN/secrets-$TARIH.json"
fi

# eski yedekleri süpür
find "$HEDEF_DIZIN" -name "konum-*.db" -mtime +$TUT_GUN -delete
find "$HEDEF_DIZIN" -name "secrets-*.json" -mtime +$TUT_GUN -delete

echo "yedek tamam: $HEDEF_DIZIN/konum-$TARIH.db"
