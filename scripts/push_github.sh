#!/bin/bash
# Пуш чистого снимка репо (архив без .env) на GitHub: rotbardrotbard/pravoslavie2, main
set -euo pipefail
umask 077

TOKEN_FILE=/tmp/ghtoken
ARCH=/home/z/my-project/download/pravoslavnye-github-novyj-repo.zip
WORK=/tmp/prav-push
REPO="rotbardrotbard/pravoslavie2"

[ -f "$TOKEN_FILE" ] || { echo "нет токена"; exit 1; }
[ -f "$ARCH" ] || { echo "нет архива: $ARCH"; exit 1; }
TOKEN=$(cat "$TOKEN_FILE")

rm -rf "$WORK" && mkdir -p "$WORK"
python3 - "$ARCH" "$WORK" <<'EOF'
import sys, zipfile
zf = zipfile.ZipFile(sys.argv[1]); zf.extractall(sys.argv[2])
bad = [n for n in zf.namelist() if '.env' in n or n.endswith('/') is False and 'download/' in n]
print('в архиве .env:', 'ЕСТЬ — СТОП' if bad else 'нет')
EOF

cd "$WORK"
git init -q -b main
git config user.name "rotbardrotbard"
git config user.email "rotbardrotbard@users.noreply.github.com"
git add -A >/dev/null
git commit -q -m "Православные — версия 86a7535 «Фикс белого экрана: санитизация данных старых версий + экраны ошибок с восстановлением»"
git remote add origin "https://x-access-token:${TOKEN}@github.com/${REPO}.git"
echo "--- push ---"
git push -q --force origin main:main 2>&1 | sed "s/x-access-token:[^@ ]*@/***@/g" || { echo "PUSH FAILED"; exit 1; }
echo "push ok"

# проверка удалённого состояния
sleep 2
git ls-remote origin main 2>&1 | sed "s/x-access-token:[^@ ]*@/***@/g" | head -1
