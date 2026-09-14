# Podgląd redesignu na Netlify

Adres w internecie, pod którym zespół ogląda nowy front i zgłasza uwagi, zanim
cokolwiek trafi na produkcję. Produkcja (`nfplantbiotech.com`, OVH, FTP) jest od
tego całkowicie odseparowana.

## Co jest publikowane

Gałąź **`preview`** → `netlify/build.sh` → katalog `_site/`.

W `_site/` ląduje **tylko** to, co skrypt wymienia z nazwy: strony `-nf`,
`styleguide.html` i katalog `assets/`. To whitelista, nie blacklista — gdyby
było odwrotnie, każdy nowy plik starego frontu wyciekałby na podgląd domyślnie,
a podgląd nie ma hasła.

Czego tam **nie ma i nie będzie**: `support.js`, `supabase-config.js`,
`content-editor.js`, `konto.html`, `panel-klienta.html`, `backups/`, `docs/`.
Dzięki temu przeglądarka recenzenta nie ma jak dotknąć produkcyjnej bazy.

Strony bez odpowiednika w redesignie (konto, panel klienta, produkt, historia)
pokazują `poza-podgladem.html` zamiast 404 — adres w pasku zostaje, więc widać,
który link tam prowadził.

## Jednorazowa konfiguracja w panelu Netlify

1. **Add new site → Import an existing project → GitHub →**
   `joanise-ux/Naturae-and-Futurae`
2. **Production branch:** `preview`
   Komendę budowania i katalog publikacji Netlify weźmie z `netlify.toml` —
   nie wpisuj ich ręcznie.
3. **Site configuration → Environment variables → Add:**
   `DISCORD_WEBHOOK_URL` = adres webhooka kanału na Discordzie
   (Ustawienia kanału → Integracje → Webhooki → Kopiuj adres URL).
   Bez tej zmiennej formularz uwag odpowie „nie jest jeszcze skonfigurowane".
4. **Site configuration → Notifications → Deploy succeeded → Slack**, a jako
   adres podaj webhook Discorda **z dopiskiem `/slack` na końcu**. Discord
   rozumie format Slacka na tym adresie i wrzuci na kanał informację o nowej
   wersji.
5. **Domain management:** zmień nazwę na czytelną, np.
   `nf-redesign-preview.netlify.app`. **Nie** podpinaj własnej domeny.
6. **Deploy Previews** zostaw włączone — każdy PR dostanie własny adres, więc
   da się pokazać zespołowi wariant bez ruszania głównego podglądu.

## Praca na co dzień

Nowe zmiany na podglądzie: scal je do `preview` i wypchnij. Netlify zbuduje
sam, a Discord dostanie powiadomienie.

```bash
git checkout preview && git merge <gałąź-z-pracą> && git push
```

Sprawdzenie buildu lokalnie, zanim cokolwiek pójdzie na serwer:

```bash
bash netlify/build.sh && npx serve _site
```

Formularz uwag lokalnie nie zadziała (nie ma funkcji Netlify), reszta tak.

## Co chroni produkcję

- `.github/workflows/deploy.yml` wyklucza z FTP `*-nf.html`, `styleguide.html`,
  `assets/styleguide.*`, `docs/**`, `netlify.toml`, `netlify/**`, `_site/**`.
  **Uwaga:** ten `exclude` to literalny blok YAML — każda linia w nim jest
  wzorcem, także taka zaczynająca się od `#`. Wyjaśnienia trzymamy nad kluczem.
- Nagłówek `X-Robots-Tag: noindex, nofollow, noarchive` z `netlify/_headers`
  plus `robots.txt` trzymają podgląd poza wyszukiwarkami. Blokada jest
  nagłówkiem, a nie tagiem `<meta>` w źródłach — przy przenoszeniu frontu na
  OVH nie ma więc czego wycofywać.
- Baner podglądu wstrzykuje `build.sh` do **kopii** stron w `_site/`.
  W źródłach repozytorium go nie ma. To samo dotyczy przekierowań zaślepki.

## Gdy podgląd przestanie być potrzebny

Usuń site w Netlify i skasuj webhook w Discordzie. W repozytorium do usunięcia
zostają `netlify.toml`, `netlify/`, wpis `_site/` w `.gitignore` i trzy linie
w `exclude` w `deploy.yml`. Strony `-nf` nie wymagają żadnej zmiany — nigdy nie
zawierały niczego związanego z podglądem.
