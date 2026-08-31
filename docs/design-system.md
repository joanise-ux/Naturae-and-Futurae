# Nature & Future — Design System

Wersja 1.0 · dokument źródłowy dla strony `nfplantbiotech.com` i wszystkich podstron  
Zakres: Nature & Future (marka parasolowa) + Kamino BioLabs + PomonaLab

---

## 0. Jak czytać ten dokument

Jeden system, trzy skórki. Struktura, siatka, komponenty, typografia i efekt szkła są **wspólne**. Zmienia się wyłącznie warstwa kolorów, przełączana atrybutem `data-brand` na `<body>`.

```html
<body data-brand="nf">        <!-- zieleń, domyślnie -->
<body data-brand="kamino">    <!-- błękity space-tech -->
<body data-brand="pomona">    <!-- miody, oliwka, sad -->
```

Różowy `#C47B90` jest **wspólnym mianownikiem wszystkich trzech palet** — to jedyny kolor, który występuje w każdej z nich. Dlatego staje się kolorem akcji (CTA) w całym serwisie i wizualnie spina rodzinę marek. Nigdzie indziej się go nie używa.

---

## 1. Fundament: ciemna baza, jasne wyspy

**Cały serwis jest ciemny.** Głęboka zieleń jest domyślnym tłem strony głównej, podstron, sklepu, karty produktu i paneli — nie ma trybu jasnego dla „storytellingu" i ciemnego dla sklepu.

Rytm robi się **na poziomie sekcji, nie strony** — tak jak na seed.com, gdzie strona przewija się przez naprzemienne pasma i co kilka ekranów wchodzi zupełnie inna temperatura. U nas jest to odwrócone: baza ciemna, a jasne pasma są rzadkim wyjątkiem, który dostaje uwagę właśnie dlatego, że jest rzadki.

| Wariant sekcji | Tło | Tekst | Szkło | Ile na stronę |
|---|---|---|---|---|
| **Deep** (domyślny) | `--grad-deep` | `--brand-100` | `.glass` (czerń 28–40%) | większość |
| **Deep+** (najciemniejszy) | `--brand-900` płaski | `--brand-300` | `.glass` | 1, na akcent |
| **Light island** | `--paper` / `--brand-100` | `--ink` | `.glass--light` | 1–2, nie więcej |

Reguły rytmu:

1. Dwa jasne pasma **nigdy nie stoją obok siebie**. Między nimi zawsze minimum dwie ciemne sekcje.
2. Jasne pasmo dostaje ta treść, która wymaga skupienia i czytania dłuższego niż dwa zdania: sekcja edukacyjna „jak rośnie w słoiku", przekrój produktu, dłuższy tekst blogowy. Ciemne pasma to obraz, produkt, emocja.
3. Jasne pasmo jest **pełnej szerokości i ma własne, wyraźne krawędzie** — nie jest to jasna karta na ciemnym tle, tylko realna zmiana tła. Przejście: 96–144px marginesu wewnętrznego, bez gradientowego rozmycia na styku.
4. Header i footer nie zmieniają się nigdy — footer zawsze `--brand-900`, nawigacja zawsze ciemne szkło.
5. Jasne kolory z palety (`--brand-300`, `--brand-100`, biel) są w trybie ciemnym **materiałem kontrastu**: nagłówki, cienkie linie, wykresy, ilustracje na wynos. Im ciemniejsza sekcja, tym jaśniejszy i cieńszy rysunek na niej.

Gradient tła zawsze ma ten sam typ ruchu — jaśniejszy lewy-górny róg, ciemniejszy prawy-dolny, bez ostrych krawędzi.

---

## 2. Kolor

### 2.1 Tokeny wspólne

```css
:root {
  /* Akcent akcji — wspólny dla całej rodziny marek */
  --accent:          #C47B90;   /* dekoracja, duże napisy, obramowania */
  --accent-strong:   #A85A72;   /* tło przycisków z białym tekstem (AA 4.8:1) */
  --accent-soft:     #E7C7D1;   /* hover na ciemnym, podświetlenia */
  --accent-ink:      #FFFFFF;

  /* Neutralne */
  --paper:           #F7F8F2;
  --paper-warm:      #FFFBFC;
  --ink:             #1A1D18;
  --ink-muted:       #5A6157;

  /* Stany */
  --ok:              #139A43;
  --warn:            #FFBE5C;
  --error:           #B4453F;
}
```

**Uwaga o kontraście — ważne.** `#C47B90` na bieli daje 3.2:1. To za mało na tekst i za mało na przycisk z białym napisem. Dlatego przyciski używają `--accent-strong` `#A85A72` (4.8:1, AA), a `#C47B90` zostaje do dekoracji, obramowań, dużych liczb i tekstu 24px+. Na ciemnym tle `#C47B90` działa świetnie i można go użyć bezpośrednio.

### 2.2 Nature & Future — `data-brand="nf"`

```css
[data-brand="nf"] {
  --brand-900: #053B06;
  --brand-800: #084C12;
  --brand-700: #0B5D1E;
  --brand-600: #0F7C31;
  --brand-500: #139A43;
  --brand-300: #76CB9A;
  --brand-100: #D9FCF0;

  --grad-light: radial-gradient(120% 90% at 12% 0%, #D9FCF0 0%, #F7F8F2 55%, #F7F8F2 100%);
  --grad-deep:  linear-gradient(150deg, #0B5D1E 0%, #084C12 45%, #053B06 100%);
}
```

Rola: marka parasolowa. Styl **czysty i przejrzysty**, najmniej ozdobny z trzech. NF spina i sprzedaje — to jej sklep i jej strona główna.

### 2.3 Kamino BioLabs — `data-brand="kamino"`

```css
[data-brand="kamino"] {
  --brand-900: #004E64;
  --brand-800: #007A9A;
  --brand-700: #00A5CF;
  --brand-500: #5BC3D9;
  --brand-300: #B5E1E3;
  --brand-100: #F4F7F3;
  --paper:     #FFFBFC;

  --grad-light: radial-gradient(120% 90% at 88% 0%, #B5E1E3 0%, #F4F7F3 60%, #FFFBFC 100%);
  --grad-deep:  linear-gradient(150deg, #007A9A 0%, #004E64 60%, #00303E 100%);
}
```

Rola: technologia, bank roślin, sekcja kosmiczna. Styl futurystyczny, sterylny, dużo powietrza, cieńsze linie niż w NF, więcej danych i wskaźników.

### 2.4 PomonaLab — `data-brand="pomona"`

```css
[data-brand="pomona"] {
  --brand-900: #373D20;
  --brand-800: #717744;
  --brand-700: #B89B50;
  --brand-500: #FFBE5C;
  --brand-300: #F1D398;
  --brand-100: #F7F8F2;

  --grad-light: radial-gradient(120% 90% at 50% 0%, #F1D398 0%, #F7F8F2 58%, #F7F8F2 100%);
  --grad-deep:  linear-gradient(150deg, #717744 0%, #373D20 65%, #232813 100%);
}
```

Rola: stare odmiany, sad, archiwum, konserwacja. To tu zostaje „bankowy" / botaniczny styl z pierwszej wersji N&F — antykwa, tabele odmian, etykiety jak z zielnika.

---

## 3. Szkło (glassmorfizm)

Efekt z Leafory, rozpisany na dwa tryby. Zasada: **szkło jest materiałem, nie ozdobą.** Kładziemy je tam, gdzie warstwa unosi się nad tłem (karta, nawigacja, modal, panel filtrów) — nigdy na płaskiej sekcji tekstowej.

```css
/* Deep — domyślne, na ciemnych sekcjach */
.glass {
  background: rgba(8, 40, 16, 0.34);
  backdrop-filter: blur(18px) saturate(130%);
  -webkit-backdrop-filter: blur(18px) saturate(130%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

/* Light — wyłącznie wewnątrz jasnych wysp */
.glass--light {
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 6px 24px rgba(11, 93, 30, 0.10);
}

/* Warstwa nawigacji — cieńsze szkło, mocniejszy blur */
.glass--nav {
  backdrop-filter: blur(24px) saturate(140%);
  border-radius: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
```

Reguły:

1. **Maksymalnie dwie warstwy szkła jedna na drugiej.** Trzecia robi się mętna.
2. Pod szkłem musi coś być — zdjęcie, gradient, roślina. Szkło na jednolitym tle to zwykły szary prostokąt.
3. Wewnętrzny biały highlight (`inset 0 1px 0`) jest obowiązkowy — to on daje wrażenie krawędzi szyby.
4. Fallback: `@supports not (backdrop-filter: blur(1px))` → nieprzezroczyste tło `--brand-800` / `--paper`.
5. Nie animuj `backdrop-filter`. Animuj `opacity` i `transform`.

---

## 3A. Warstwa steampunkowa — mosiądz i mechanika

Steampunk z obecnej strony NF zostaje, ale schodzi z poziomu stylu na poziom **detalu**. Szkło i ciemna zieleń są materiałem głównym, mosiądz jest okuciem. Zasada: kolejna wersja strony ma wyglądać, jakby ten sam mechanizm został schowany pod nowocześniejszą obudową i widać go tylko na krawędziach.

Logo NF nie zmienia się w ogóle — i to ono ustala grubość wszystkich mosiężnych linii w serwisie (1–1.5px). Jeśli detal jest grubszy niż kreska w logo, jest za ciężki.

### 3A.1 Token

```css
:root {
  --brass:      #B89B50;   /* pierścienie, cienkie linie, wskazówki */
  --brass-dim:  #8A7538;   /* nieaktywne, cień okucia */
  --brass-glow: rgba(184, 155, 80, 0.28);  /* poświata pod pierścieniem */
}
```

Mosiądz jest świadomie wzięty z palety PomonaLab (`#B89B50`) — dzięki temu warstwa mechaniczna i marka sadownicza mówią tym samym kolorem, a nie dwoma podobnymi żółciami.

**Mosiądz nigdy nie jest wypełnieniem.** Występuje wyłącznie jako linia, pierścień, wskazówka, narożnik ramki albo cienki separator. Zero mosiężnych przycisków, zero mosiężnych tł. Różowy zostaje jedynym kolorem akcji — mosiądz nie może z nim konkurować, bo od razu zrobi się z tego jarmark.

Limit: **maksymalnie dwa mosiężne elementy w jednym widoku ekranu.**

### 3A.2 Wskaźnik liczbowy (gauge)

Element z obecnej strony, który warto przenieść bez zmian — działa i jest rozpoznawalny.

```
   ╭───────────────────────────────────────────╮
   │   ╭───╮                  ╭───╮            │
   │   │ ╱ │  100+       │    │ ╲ │  12        │
   │   ╰───╯  lat historii│    ╰───╯  odmian   │
   ╰───────────────────────────────────────────╯
     ↑ pierścień 1.5px --brass, wnętrze --brand-900
       wskazówka 1px --brass, kąt = wartość
```

- Tarcza 56px, pierścień 1.5px `--brass`, wnętrze prawie czarne z ledwo widoczną ziarnistością.
- Wskazówka odchyla się proporcjonalnie do wartości — jeśli liczba nie ma skali, wskazówka jest ozdobą i wtedy lepiej użyć zwykłej liczby bez tarczy.
- Separator między wskaźnikami: pionowa kreska 1px `--brass-dim`, wysokość 60% wysokości bloku.
- Cały blok siedzi na `.glass`.

Podpis pod liczbą: kapitaliki antykwy, `--brand-300`, **maksymalnie trzy słowa w jednej linii**. Na obecnej stronie podpis „100% W…" jest ucięty — to nie jest kwestia CSS do naprawy, tylko limitu w treści. Jeśli podpis się nie mieści, zmienia się podpis, nie szerokość tarczy.

### 3A.3 Pozostałe dopuszczone motywy

| Motyw | Gdzie | Uwaga |
|---|---|---|
| Narożniki ramki (4 krótkie kreski `--brass` w rogach) | zdjęcie hero, karta odmiany | zamiast pełnego obramowania |
| Separator sekcji: linia 1px z okrągłym „nitem" na środku | między pasmami | max 2 na stronę |
| Pierścień ładowania — obraca się jak tarcza przyrządu | loader, stan „przetwarzanie" | jedyna pętla animacji w serwisie |
| Skala kreskowa (podziałka) na osi wykresu | dashboard, dane laboratoryjne | tylko przy realnych danych |

Czego **nie** robimy: zębatek, nitów jako tekstury tła, brązowych papierów, czcionek „western", mosiężnych ikon, obracających się kół w tle.

### 3A.4 Natężenie wg marki

| Marka | Poziom | Charakter |
|---|---|---|
| **PomonaLab** | mocny | Tu steampunk jest widoczny: tarcze, ramki z narożnikami, antykwa w kapitalikach, podziałki. Sad i stare odmiany uzasadniają mechanikę. |
| **Nature & Future** | subtelny | 1–2 detale na stronę: wskaźniki w pasku faktów i separator sekcji. Reszta czysta. |
| **Kamino BioLabs** | przyrządowy | Mosiądz **zamieniamy** na `--brand-300` (`#B5E1E3`). Ten sam gauge, ale jako sterylny przyrząd pomiarowy, nie mechanizm zegarowy. |

### 3A.5 Typografia sekcji Pomona

Antykwa w kapitalikach z pierwotnego sklepu wraca — ale tylko jako **nagłówki i nazwy odmian w kontekście Pomony**:

```
Malus domestica 'Kosztela'          ← antykwa italic, --brass, 14px
KOSZTELA                            ← antykwa, kapitaliki, --brand-100, 28px
odmiana z XVIII w., Dolny Śląsk     ← grotesk, --ink-muted na jasnym / --brand-300
```

Cyfry w sekcji Pomona: **wersaliki cyfrowe** (`font-variant-numeric: lining-nums tabular-nums`) — mają stać w kolumnie jak w rejestrze odmian.

Poza sekcją Pomony obowiązuje skala z rozdziału 4 bez zmian. Układ, siatka, komponenty i rytm sekcji są wszędzie nowe — steampunk nie odzyskuje layoutu, tylko detal i literę.

### 3A.6 Ruch

Wskazówka gauge'a animuje się **raz**, gdy blok wejdzie w widok: od 0 do wartości docelowej, 700ms `cubic-bezier(0.2, 0, 0, 1)`. Nie w pętli, nie przy scrollu w obie strony. Pierścień ładowania to jedyny element obracający się stale, i tylko wtedy, gdy coś faktycznie się ładuje.

```css
@media (prefers-reduced-motion: reduce) {
  .gauge__needle { transition: none; transform: rotate(var(--angle)); }
}
```

---

## 4. Typografia

Dwie rodziny, jasny podział ról. Antykwa niesie „bio/naukowy/archiwalny" charakter, grotesk niesie interfejs.

```css
--font-display: "Fraunces", "Playfair Display", Georgia, serif;
--font-ui:      "Inter", "Satoshi", system-ui, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, monospace;
```

`--font-mono` **tylko** w Kamino i tylko dla realnych danych pomiarowych (temperatura, lux, ID partii, kod genotypu). Nie jako ozdobna etykietka.

### Skala (major third, 1.25)

| Rola | Rozmiar | Waga | Interlinia | Litery |
|---|---|---|---|---|
| Display XL (hero) | `clamp(2.75rem, 6vw, 4.75rem)` | 400 display | 1.02 | -0.02em |
| H1 | `clamp(2.25rem, 4vw, 3.25rem)` | 400 display | 1.08 | -0.015em |
| H2 | `2rem` | 500 display | 1.15 | -0.01em |
| H3 | `1.5rem` | 600 ui | 1.25 | 0 |
| Body L | `1.125rem` | 400 ui | 1.65 | 0 |
| Body | `1rem` | 400 ui | 1.6 | 0 |
| Small | `0.875rem` | 400 ui | 1.5 | 0 |
| Nazwa łacińska | `0.875rem` | 400 display *italic* | 1.4 | 0 |

Dwie decyzje typograficzne specyficzne dla tego projektu:

- **Nazwa gatunkowa zawsze kursywą antykwy**, nad nazwą polską. To poprawna konwencja botaniczna i od razu robi z Was laboratorium, a nie sklep ogrodniczy. `Hemianthus callitrichoides` / **Hemianthus**.
- **Bez wersalikowych etykietek nad nagłówkami.** Jeśli sekcja potrzebuje podpisu, jest nim zdanie, nie tracking na 0.2em.

Długość wiersza: max 68 znaków dla groteska, 74 dla antykwy.

---

## 5. Siatka i przestrzeń

```css
--space-2xs: 4px;   --space-xs: 8px;   --space-s: 16px;
--space-m:  24px;   --space-l:  40px;  --space-xl: 64px;
--space-2xl: 96px;  --space-3xl: 144px;

--container: 1280px;
--gutter:    clamp(20px, 4vw, 48px);
--radius-s:  10px;  --radius-m: 20px;  --radius-l: 32px;
```

12 kolumn na desktopie, 6 na tablecie, 4 na mobile. Odstęp między sekcjami: `--space-3xl` na stronach storytellingowych (Seed oddycha właśnie tym), `--space-xl` w sklepie i panelach, gdzie liczy się gęstość.

Promienie: `--radius-m` dla kart, `--radius-l` dla dużych kafli hero/kategorii, `--radius-s` dla inputów i tagów. **Nie jeden promień na wszystko** — hierarchia ma być czytelna także w kształcie.

---

## 6. Komponenty

### 6.1 Przycisk

```
Primary     tło --accent-strong, tekst biały, radius pill (999px), 14px/28px
            hover: --accent (jaśniej), translateY(-1px)
Secondary   przezroczysty, border 1px --brand-500, tekst --brand-700/--brand-300
Ghost       sam tekst + podkreślenie na hover
```

Primary (różowy) występuje **raz na ekran**. To „Zamów", „Do koszyka", „Napisz do nas", „Wyślij zapytanie". Jeśli na widoku są dwa różowe przyciski, jeden z nich jest źle zaklasyfikowany.

Copy przycisków: czasownik + efekt. „Dodaj do koszyka", nie „Więcej". „Wyślij zapytanie", nie „Submit". Nazwa akcji nie zmienia się w trakcie flow — przycisk „Zamów" prowadzi do potwierdzenia „Zamówiono".

### 6.2 Karta produktu (układ jak w obecnym sklepie)

```
┌──────────────────────────────────┐
│ ●tag trudności          ♡        │  ← tag: szkło, 12px; serce: koło 36px
│                                  │
│        [ zdjęcie 4:3 ]           │
│                                  │
│ ● 20 dostępne                    │  ← wskaźnik stanu, lewy dolny róg
├──────────────────────────────────┤
│ Cryptocoryne wendtii             │  ← antykwa italic, --brand-300
│ KRYPTOKORYNA WENDTA              │  ← display, kapitaliki
│ Średnia, brązowo-zielona.        │  ← 2 linie max, opis użytkowy
│ ──────────────────────────────── │
│ 18 PLN            [Do koszyka +] │
│ szt. · kubek 5×5                 │
└──────────────────────────────────┘
```

Karta = `.glass`. Grid 3 kolumny (desktop) / 2 (tablet) / 1 (mobile), `gap: var(--space-m)`.

Kropka przed stanem magazynowym: `--brand-500` gdy dostępne, `--warn` gdy ≤3 szt., `--ink-muted` gdy 0. Kolor nigdy nie niesie informacji sam — obok zawsze jest liczba.

### 6.3 Nawigacja

Sticky, wysokość 72px. Lewa strona: logo NF. Środek: Sklep · Technologia · Historia · Blog · Kontakt. Prawa strona — **para przycisków w układzie z Seed**:

```
[ logo NF ]   Sklep  Technologia  Historia  Blog        Zaloguj  ( Zamów rośliny )
                                                          ↑ tekst    ↑ pill, biały
                                                                       border 1px
```

- **Zaloguj** — ghost, sam tekst, `--brand-100`.
- **Zamów rośliny** — pill 999px, przezroczyste tło, border 1px `rgba(255,255,255,.7)`, tekst biały. Hover: wypełnienie białe, tekst `--brand-900`. **Prowadzi prosto do sklepu**, nie do strony pośredniej.

Ten przycisk celowo **nie jest różowy**. Różowy zostaje dla akcji na konkretnym produkcie („Dodaj do koszyka", „Zamów", „Napisz do nas"). Gdyby był w nawigacji na każdym ekranie, przestałby cokolwiek znaczyć. Biały outline na ciemnym tle jest równie widoczny, a nie zjada akcentu.

Ikony szukania i koszyka z licznikiem siedzą między „Zaloguj" a przyciskiem — na mobile zostają tylko one plus hamburger.

**Zachowanie nad hero:** nawigacja startuje jako przezroczysta, położona na zdjęciu (bez tła, bez obramowania). Po przescrollowaniu wysokości hero zamienia się w `.glass--nav` i zwęża się do pigułki wyśrodkowanej z marginesem 16px od góry — dokładnie ten ruch, który Seed robi przy scrollu. Przejście 250ms.

**Pasek zapowiedzi** (opcjonalny, nad nawigacją): jedna linia 40px, tło `--brand-300`, tekst `--brand-900`, jedno zdanie z linkiem. Używać tylko przy realnej informacji (nowa dostawa, nowa odmiana), nie na stałe.

**Przełącznik sub-marek** siedzi w nawigacji sklepu jako segmentowany kontrolek (dokładnie jak Twoje „Rośliny akwariowe / Drzewa owocowe"), tylko rozszerzony:

```
[ ● Rośliny akwariowe /in vitro ] [ ● Drzewa owocowe /PomonaLab ] [ ● Technologia /Kamino ]
```

Aktywny segment: ciemniejsze szkło + kropka w kolorze marki. Kliknięcie zmienia `data-brand` i **przefarbowuje całą stronę** płynnym `transition: 400ms` na zmiennych CSS. To jest sygnaturowy moment tego serwisu — jedna rzecz, na którą wydajemy całą odwagę.

```
[ ● Rośliny akwariowe /in vitro ] [ ● Drzewa owocowe /PomonaLab ] [ ● Technologia /Kamino ]
```

Aktywny segment: ciemniejsze szkło + kropka w kolorze marki. Kliknięcie zmienia `data-brand` i **przefarbowuje całą stronę** płynnym `transition: 400ms` na zmiennych CSS. To jest sygnaturowy moment tego serwisu — jedna rzecz, na którą wydajemy całą odwagę.

### 6.4 Adnotacja produktowa (z Group_1)

Pływająca etykietka ze szkła połączona cienką linią i kropką z punktem na zdjęciu:

```
                    ╭──────────────────────╮
        ●───────────│ 100% czysty klon     │
                    │ z kultury in vitro   │
                    ╰──────────────────────╯
```

Kropka 8px `--accent`, linia 1px `rgba(255,255,255,.35)`, etykieta `.glass`. Używać na hero i na karcie produktu — max 3 na obraz. Treść to zawsze konkret: liczba, parametr, fakt. Nie hasło marketingowe.

### 6.5 Pole formularza

Input: szkło, `--radius-s`, border 1px `rgba(255,255,255,.18)` (deep) / `rgba(11,93,30,.18)` (light). Focus: border `--accent`, `outline: 2px solid var(--accent-soft)`, `outline-offset: 2px`. Focus musi być widoczny w obu wariantach sekcji.

Błędy mówią co się stało i co zrobić: „Podaj adres e-mail z @", nie „Nieprawidłowa wartość". Bez przepraszania.

---

## 7. Układ strony głównej (hero wg Seed + reszta wg Group_1)

```
┌─────────────────────────────────────────────────────────────┐
│ [ pasek zapowiedzi — opcjonalny, --brand-300 ]              │
│ NAV przezroczysta, położona na materiale                    │
│                                                             │
│        ███  HERO: wideo/zdjęcie na całą szerokość  ███      │
│        ███  słoiki in vitro pod lampą, ujęcie 16:9  ███     │
│                                                             │
│   Rośliny hodowane                                          │
│   od pojedynczej komórki          ← headline dolny-lewy róg │
│                                                             │
│   ╰── dolne rogi zaokrąglone --radius-l, hero nie dotyka    │
│       krawędzi ekranu (margines 0 po bokach, 0 u góry)      │
├─────────────────────────────────────────────────────────────┤
│  BLOK BESTSELLERA — asymetryczny, 2 kolumny (wg Seed)       │
│  ┌────────────────────────────────────┐ ┌────────────────┐ │
│  │ [Bestseller]                       │ │  zdjęcie       │ │
│  │  ╭──────╮   Anubias nana           │ │  z laboratorium│ │
│  │  │słoik │   Anubias barteri        │ │                │ │
│  │  ╰──────╯   2 zdania opisu         │ │ ╭────────────╮ │ │
│  │             22 PLN                 │ │ │Nie wiesz,  │ │ │
│  │             [Zobacz] Do koszyka    │ │ │od czego    │ │ │
│  └────────────────────────────────────┘ │ │zacząć?     │ │ │
│                                          │ ╰────────────╯ │ │
│                                          └────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  DWIE KARTY W RZĘDZIE — nowość + zestaw (jasna wyspa)       │
│  ┌────────────────────┐ ┌────────────────────┐              │
│  │[Nowość]  Kryptoko- │ │  Zestaw startowy   │              │
│  │ ╭────╮   ryna      │ │  ╭────╮ 3 gatunki  │              │
│  │ │słoik│  18 PLN    │ │  │słoiki│ -20%     │              │
│  │ ╰────╯  [Zobacz]   │ │  ╰────╯ 48 PLN     │              │
│  └────────────────────┘ └────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│  PASEK FAKTÓW — 3 wskaźniki mosiężne (3A.2) w rzędzie       │
│  ◔ 48h wysyłka  │  ◔ 100% klonów  │  ◔ 14 dni zwrotu        │
├─────────────────────────────────────────────────────────────┤
│  DWA KAFLE SUB-MAREK (wysokie, zdjęciowe, radius-l)         │
│  ┌───────────────────────┐ ┌───────────────────────┐        │
│  │ Kamino BioLabs        │ │ PomonaLab             │        │
│  │ Technologia i bank    │ │ KOSZTELA · antykwa    │        │
│  │ przyrządowy, błękit   │ │ ramka z narożnikami   │        │
│  │ [ Poznaj ]            │ │ [ Poznaj ]            │        │
│  └───────────────────────┘ └───────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  PASMO EDUKACYJNE — „Jak rośnie w słoiku"                   │
│  Przekrój: pożywka / eksplantat / sterylna atmosfera        │
│  6 pływających adnotacji dookoła (jak w Group_1)            │
├─────────────────────────────────────────────────────────────┤
│  Z NASZEGO LABORATORIUM — 3 wpisy blogowe                   │
├─────────────────────────────────────────────────────────────┤
│  OPINIE — zdjęcie w organicznym kształcie + cytat           │
├─────────────────────────────────────────────────────────────┤
│  FOOTER (--brand-900) + newsletter                          │
└─────────────────────────────────────────────────────────────┘
```

### 7.1 Hero

Pełna szerokość, wysokość ~72vh, materiał wideo w pętli bez dźwięku (`muted autoplay playsinline loop`, plakat jako `poster`, wersja statyczna przy `prefers-reduced-motion`). Nawigacja leży **na** materiale, bez własnego tła.

- Nagłówek: display XL, biały, wyrównany do lewej, dolna trzecia część kadru. Dwie linie, bez podtytułu, bez przycisku w środku hero — przycisk „Zamów rośliny" jest w nawigacji i to on przejmuje rolę CTA.
- Gradient czytelności: `linear-gradient(to top, rgba(5,59,6,.72) 0%, transparent 55%)` na całym materiale. Bez tego biały tekst rozsypie się na jasnych klatkach.
- Dolne rogi hero zaokrąglone `--radius-l`, żeby sekcja pod spodem „wchodziła" pod niego — u Seeda to jest to, co robi wrażenie warstwowości.
- Materiał musi mieć spokojny, wolny ruch. Szybki montaż w hero zabija czytelność nagłówka.

### 7.2 Blok bestsellera

Prosto z Seeda i warto go wziąć, bo **dobrze wygląda przy małej liczbie produktów** — a Wy na starcie macie kilka pozycji. Zamiast siatki, która świeci pustkami, dostajemy jeden duży, „ważny" produkt plus wąska kolumna obok.

Duża karta: 2/3 szerokości, produkt po lewej, treść po prawej, badge „Bestseller" w lewym górnym rogu. Wąska kolumna: 1/3, zdjęcie z laboratorium z kartą szkła na dole i pytaniem prowadzącym („Nie wiesz, od czego zacząć? → Sprawdź poziomy trudności").

Pod spodem rząd dwóch kart — tu Seed przełącza się na jasne tło i my robimy tak samo: to jedna z dwóch dozwolonych jasnych wysp na stronie głównej (patrz 1). Kontrast ciemny → jasny jest sam w sobie sygnałem „to inna kategoria produktów".

Zasada przycisków w tych blokach, też z Seeda: **dwa poziomy obok siebie** — wypełniony „Zobacz" (biały na ciemnym / ciemny na jasnym) i podkreślony tekstowy „Do koszyka". Różowy pojawia się dopiero na karcie produktu.

Zmiana wobec Group_1: sekcja „dwa kafle" w oryginale to dwie kategorie roślin. U Was to **dwie sub-marki** — i to jedyne miejsce na stronie głównej, gdzie Kamino i Pomona pojawiają się jako osobne byty. Reszta strony mówi głosem NF.

---

## 8. Układ sklepu (Seed + Plantified + obecny grid)

Sklep jest ciemny w całości. Oddech bierzemy przez przestrzeń, nie przez kolor tła.

```
┌─────────────────────────────────────────────────────────────┐
│ NAV                                                         │
├─────────────────────────────────────────────────────────────┤
│  [ ● Rośliny akwariowe ] [ ● Drzewa owocowe ]   SORTUJ: ... │  ← szkło
├─────────────────────────────────────────────────────────────┤
│  HERO KATEGORII (pełna szerokość, tylko na wejściu)         │
│  Duża antykwa: nazwa kolekcji jako element graficzny        │
│  Lewa: 3 zdania + tabelka Rodzina / Kategoria / Pielęgnacja │
│  Prawa: duże zdjęcie rośliny z adnotacjami (6.4)            │
├─────────────────────────────────────────────────────────────┤
│  BLOK WYRÓŻNIONY (2/3 + 1/3) — jak na stronie głównej       │
├─────────────────────────────────────────────────────────────┤
│  GRID kart produktu (6.2) — liczba kolumn zależna od        │
│  liczby produktów w kategorii, patrz 8.1                    │
│  Filtry w lewej kolumnie na desktopie, sheet ze szkła na    │
│  mobile                                                     │
└─────────────────────────────────────────────────────────────┘
```

### 8.1 Siatka, która działa przy małej liczbie produktów

To jest właśnie mechanizm z Seeda: siatka nie ma stałej liczby kolumn, tylko **dopasowuje rozmiar karty do liczby produktów**, więc kategoria z trzema pozycjami wygląda tak samo celowo jak ta z dwudziestoma.

| Produktów w kategorii | Układ |
|---|---|
| 1 | jedna karta pełnej szerokości, produkt po lewej, treść po prawej (jak blok bestsellera) |
| 2–3 | blok wyróżniony 2/3 + 1/3, pod nim rząd pozostałych w dwóch kolumnach |
| 4–6 | dwie kolumny, karty wysokie, duże zdjęcia |
| 7+ | trzy kolumny — dotychczasowa siatka |

Zasada nadrzędna: **nigdy nie zostawiamy niepełnego rzędu w siatce trzykolumnowej.** Dwie karty w rzędzie na trzy miejsca wyglądają jak błąd wczytywania. Jeśli ostatni rząd byłby niepełny, zmniejsz liczbę kolumn dla całej kategorii.

Z Plantified zostaje nazwa kolekcji jako duży element typograficzny i tabelka parametrów w trzech kolumnach pod opisem. Z obecnego sklepu: tagi trudności, wskaźnik dostępności, cena po lewej i CTA po prawej w stopce karty.

### 8.2 Karta produktu (podstrona) — wg Seed

```
┌───────────────────────────────────┬─────────────────────────┐
│                                   │ Anubias nana            │
│   ╔═══════════════════════════╗   │ ★★★★★  38 opinii        │
│   ║                           ║   │                         │
│   ║   zdjęcie główne 4:3      ║   │ 2–3 zdania, konkret     │
│   ║   ciemne, --brand-900     ║   │                         │
│   ║                           ║   │ [Zestaw −20%] ← badge   │
│   ╚═══════════════════════════╝   │ 22 PLN                  │
│                                   │ kubek 5×5 · ok. 15 szt. │
│   ┌───────────┐ ┌───────────┐     │                         │
│   │ zdjęcie 2 │ │ zdjęcie 3 │     │ [ Dodaj do koszyka ]    │  ← różowy
│   └───────────┘ └───────────┘     │ Wysyłka w 48h           │
│   ┌───────────┐ ┌───────────┐     │ ─────────────────────── │
│   │ wideo z   │ │ etykieta/ │     │ ○ Światło: słabe–średnie│
│   │ laborat.  │ │ parametry │     │ ○ CO₂: niewymagane      │
│   └───────────┘ └───────────┘     │ ○ Tempo: wolne          │
│                                   │ ○ Trudność: łatwa       │
│                                   │ Zobacz protokół →       │
│                                   │ ─────────────────────── │
│                                   │ ╭─────────────────────╮ │
│                                   │ │ ▣ Dobierz podłoże   │ │
│                                   │ │   +18 PLN    [Dodaj]│ │
│                                   │ ╰─────────────────────╯ │
└───────────────────────────────────┴─────────────────────────┘
        ↑ galeria kafelkowa, przewija się     ↑ kolumna sticky
```

Kluczowe elementy przeniesione z Seeda:

- **Galeria jako siatka kafelków, nie karuzela.** Duże zdjęcie u góry, pod nim cztery mniejsze w dwóch kolumnach. Wszystko widoczne od razu, bez klikania w strzałki. Ostatni kafelek to zawsze „etykieta" — parametry wypisane jak skład na opakowaniu.
- **Prawa kolumna przyklejona** (`position: sticky; top: 88px`) i przewija się razem z galerią. Na mobile ląduje pod pierwszym zdjęciem, a przycisk zakupu przykleja się do dołu ekranu jako pasek ze szkła.
- **Karta dosprzedaży na dole kolumny** — miniatura + jedno zdanie + cena + mały przycisk „Dodaj". U Seeda to zestaw, u Was: podłoże, nawóz albo drugi gatunek do kompletu. To jest najmniej nachalny upsell, jaki widziałam, i warto go skopiować dokładnie.
- **Linia parametrów z ikonami** (4 pozycje z Leafory) siedzi pod przyciskiem, nie nad — najpierw decyzja, potem szczegóły.
- Pod złożeniem: „Zobacz protokół" prowadzi do rozwijanych sekcji „Jak rozpakować", „Aklimatyzacja", „Skład pożywki".

Różowy przycisk „Dodaj do koszyka" jest tu jedynym różowym elementem na całym widoku. Mały „Dodaj" przy dosprzedaży jest outline'owy — inaczej dwie akcje zaczną ze sobą konkurować.

---

## 9. Ruch

Jeden orkiestrowany moment na stronę, reszta reaguje na użytkownika.

- **Strona główna:** wideo w hero rusza od razu, nagłówek wchodzi raz — 900ms, opóźnienie 200ms. Nawigacja zwija się w pigułkę po przescrollowaniu hero (250ms). Nic więcej.
- **Sklep:** przefarbowanie palety przy zmianie sub-marki (400ms na zmiennych CSS).
- Wszystko inne: hover 150ms, otwarcia 200ms `cubic-bezier(0.2, 0, 0, 1)`.
- Bez fade-in-up na każdej sekcji przy scrollu. To jest ten jeden efekt, po którym poznaje się szablon.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

---

## 10. Dostępność — minimum, które musi przejść

- Tekst 4.5:1, tekst 24px+ i elementy UI 3:1.
- Różowy `#C47B90` nigdy jako tekst poniżej 24px na jasnym tle. Do tego jest `--accent-strong`.
- Widoczny focus na obu trybach, `outline-offset: 2px`.
- Szkło z fallbackiem — bez `backdrop-filter` tekst nadal musi być czytelny.
- Informacja nigdy tylko kolorem (stan magazynowy ma liczbę, nie samą kropkę).
- Nazwy łacińskie: `<i lang="la">`.

---

## 11. Głos i copy

Piszemy jak laboratorium, które lubi tłumaczyć. Zdania oznajmujące, konkrety, liczby. Zero „innowacyjnych rozwiązań" i „pasji do natury".

| Zamiast | Piszemy |
|---|---|
| „Odkryj magię natury" | „Rośliny hodowane od pojedynczej komórki" |
| „Najwyższej jakości produkty" | „Bez glonów, ślimaków i pasożytów — kultura sterylna" |
| „Dowiedz się więcej" | „Zobacz, jak rośnie w słoiku" |
| „Skontaktuj się z nami" | „Napisz do nas" |

Pusty koszyk: „Koszyk jest pusty. Zacznij od Anubiasa — wybacza początkującym." Zaproszenie, nie komunikat.

---

## 12. Kolejność wdrożenia

1. Tokeny + trzy skórki + warianty sekcji (deep / deep+ / light island) — nic wizualnego, sam fundament
2. Nawigacja, footer, przycisk, input, karta, wskaźnik mosiężny — biblioteka komponentów na jednej stronie `/styleguide`
3. Strona główna
4. Sklep: listing + karta produktu
5. Podstrony sub-marek (Kamino, Pomona)
6. Panel klienta i admin — dziedziczą ciemną bazę i komponenty, prawie bez nowego designu

Krok 2 jest nieoczywisty i najważniejszy: strona `/styleguide` z wszystkimi komponentami w trzech skórkach obok siebie oszczędza późniejsze poprawki na sześciu podstronach naraz.
