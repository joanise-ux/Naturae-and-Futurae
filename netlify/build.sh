#!/usr/bin/env bash
#
# Składa katalog _site/ dla podglądu na Netlify.
#
# Zasada: WHITELISTA. Kopiujemy wyłącznie to, co wymienione niżej. Gdyby był
# to blacklista, każdy nowy plik starego frontu wyciekałby na podgląd domyślnie.
# Podgląd nie ma hasła, więc "domyślnie nie" jest jedynym bezpiecznym domyślnym.
#
# Uruchomienie lokalne:  bash netlify/build.sh && npx serve _site

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/_site"

cd "$ROOT"
rm -rf "$OUT"
mkdir -p "$OUT"

# --- 1. Strony nowego frontu -------------------------------------------------
PAGES=(
  index-nf.html
  sklep-nf.html
  kamino-nf.html
  pomona-nf.html
  technologia-nf.html
  styleguide.html
)

for page in "${PAGES[@]}"; do
  cp "$page" "$OUT/$page"
done

# Strona główna pod gołym adresem. Kopia, a nie przekierowanie — dzięki temu
# wewnętrzne linki "index-nf.html" (jest ich 5) dalej trafiają w cel.
cp index-nf.html "$OUT/index.html"

# --- 2. Assety ---------------------------------------------------------------
# Cały katalog: strony -nf sięgają też do plików współdzielonych ze starym
# frontem (theme.css, nf-ui.css, logo). Wyłączamy tylko nieużywane ciężary.
mkdir -p "$OUT/assets"
cp -R assets/. "$OUT/assets/"
rm -f "$OUT/assets/wodospad.MOV" "$OUT/assets/sekcja hero.mp4"

# --- 3. Pliki specyficzne dla podglądu ---------------------------------------
cp netlify/poza-podgladem.html "$OUT/poza-podgladem.html"
cp netlify/preview-banner.js   "$OUT/preview-banner.js"
cp netlify/_redirects          "$OUT/_redirects"
cp netlify/_headers            "$OUT/_headers"
cp netlify/robots.txt          "$OUT/robots.txt"

# --- 4. Baner podglądu -------------------------------------------------------
# Wstrzykiwany do KOPII, nigdy do źródeł. Przy przenoszeniu nowego frontu
# na OVH nie ma więc czego usuwać.
#
# Celowo sed, a nie parser HTML — build ma nie mieć żadnych zależności poza
# tym, co Netlify ma w obrazie z pudełka.
# Na Netlify COMMIT_REF ustawia sie sam; lokalnie bierzemy hash z gita.
COMMIT="${COMMIT_REF:-$(git rev-parse --short HEAD 2>/dev/null || echo lokalnie)}"
COMMIT_SHORT="${COMMIT:0:7}"
CONTEXT="${CONTEXT:-local}"

SNIPPET="<script src=\"/preview-banner.js\" defer data-commit=\"$COMMIT_SHORT\" data-context=\"$CONTEXT\"></script>"

for page in "${PAGES[@]}" index.html poza-podgladem.html; do
  file="$OUT/$page"
  [ -f "$file" ] || continue

  # Podmiana zadziała tylko przy dokładnie jednym </body>. Gdyby ktoś dołożył
  # drugi, lepiej wywalić build niż po cichu wstrzyknąć baner dwa razy.
  count=$(grep -c '</body>' "$file" || true)
  if [ "$count" != "1" ]; then
    echo "BŁĄD: $page ma $count tagów </body>, oczekiwano 1." >&2
    exit 1
  fi

  sed -i "s#</body>#${SNIPPET}\n</body>#" "$file"
done

echo "Zbudowano _site/ — $(find "$OUT" -type f | wc -l) plików, wersja $COMMIT_SHORT"
