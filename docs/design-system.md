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

## 0.1 Architektura plików

Ten rozdział istnieje po to, żeby nowa podstrona ruszała bez poprawiania rzeczy, które są już rozwiązane.

### Co wczytuje każda strona

Zawsze te trzy, zawsze w tej kolejności, a potem arkusz tej konkretnej strony:

```html
<link rel="stylesheet" href="assets/tokens.css">          <!-- 1. zmienne -->
<link rel="stylesheet" href="assets/nf-base.css">         <!-- 2. fundament -->
<link rel="stylesheet" href="assets/nf-components.css">   <!-- 3. komponenty -->
<link rel="stylesheet" href="assets/nf-panel.css">        <!-- 4. tylko ta strona -->

<script src="assets/nf-components.js"></script>           <!-- zachowanie komponentów -->
```

Kolejność nie jest kosmetyczna. Wszystkie warstwy operują na selektorach klasowych o tej samej specyficzności, więc o wyniku decyduje kolejność wczytania: arkusz strony wygrywa z komponentem, komponent z fundamentem.

### Co gdzie mieszka

| Plik | Zawiera | Kiedy tu dopisujesz |
|---|---|---|
| `tokens.css` | zmienne: kolor, typografia, przestrzeń, promienie, ruch; trzy skórki `data-brand` | nowa wartość, która ma się zmieniać między markami |
| `nf-base.css` | reset, warianty sekcji, skala typograficzna, szkło, focus | rzecz dotycząca wszystkiego, nie konkretnego komponentu |
| `nf-components.css` | rozdz. 6 i 3A: przyciski, nawigacja, karta, wskaźnik, adnotacja, pola, kroki, hero, stopka | **komponent używany na więcej niż jednej stronie** |
| `nf-<strona>.css` | wyłącznie kompozycja tej jednej strony | układ, który nigdzie indziej się nie powtórzy |

`nf-components.js` obsługuje nawigację, menu mobilne i wskaźniki. Każdy blok sam sprawdza, czy jego elementy są na stronie, więc plik wczytuje się wszędzie bez warunków.

### Reguła, która pilnuje porządku

> **Komponent użyty na drugiej stronie przenosi się do `nf-components.css`. Nie dopina się arkusza jednej strony do drugiej.**

Do 2026-09-02 stopka, newsletter, pasmo edukacyjne i `.section__head` siedziały w `nf-home.css`. Skutki były dokładnie takie, jakich ta reguła ma zapobiegać:

- `/kamino`, `/pomona` i `/sklep` wczytywały arkusz strony głównej tylko po to, żeby mieć stopkę — razem z blokiem bestsellera i opiniami, których nie używają;
- `/technologia` tego nie robiła i **renderowała stopkę bez tła, bez paddingu i bez siatki kolumn** — nikt tego nie zauważył, bo błąd nie rzuca wyjątku, tylko cicho psuje wygląd jednej sekcji.

Po przeniesieniu każda strona wczytuje trzy wspólne pliki plus swój własny i nic poza tym.

### Sprawdzenie przed dodaniem strony

Nowa podstrona jest gotowa, kiedy: wczytuje cztery arkusze w podanej kolejności, ma `data-brand` na `<body>`, a każda użyta klasa ma definicję w którymś z wczytanych plików. Ostatnie sprawdza się najszybciej porównując `class="..."` w HTML z selektorami w arkuszach — klasa bez definicji nie zgłasza błędu, tylko cicho wygląda źle.

`styleguide.html` pokazuje wszystkie komponenty w trzech skórkach i w każdym wariancie sekcji. Jeśli komponent wygląda tam inaczej niż na stronie, błąd jest w arkuszu strony, nie w komponencie.

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

**Deep+ to `.section--deeper` i ma konkretne zadanie.** Ciemna baza jest jednym gradientem przypiętym do okna (`background-attachment: fixed`), więc dwie sąsiadujące sekcje Deep nie mają między sobą żadnej krawędzi — styk zostaje pustką, a wstawiony w nią separator z nitem czyta się jak kreska w środku niczego, nie jak przejście. Deep+ daje realną zmianę tonu tam, gdzie strona zmienia temat, i robi to bez sięgania po drugą jasną wyspę (reguła 1). Płaskie `--brand-900`, tekst `--brand-300`, nagłówki zostają w `--brand-100`, rogi `--radius-l` jak jasna wyspa, krawędź ostra.

Kolejność, w jakiej sięgamy po przejście między dwiema ciemnymi sekcjami:

1. **Sama przestrzeń** — domyślnie i najczęściej. Dwie sekcje Deep pod sobą są w porządku, dopóki różnią się rytmem treści.
2. **Deep+** — kiedy zmienia się temat i sam odstęp przestaje wystarczać. Jeden na stronę.
3. **Separator z nitem** (3A.3) — tylko jako detal wewnątrz sekcji albo na styku, który już ma zmianę tonu. Nigdy jako jedyna rzecz w 250px pustki.

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

> **Status: wycofany z obecnych stron.** Tarcze zostały zdjęte ze strony głównej, `/kamino` i `/pomona` — pasek faktów niesie tam samą liczbę z podpisem. Komponent zostaje w systemie jako rezerwa i wraca **wyłącznie przy realnych danych pomiarowych**: dashboard laboratoryjny, panel odczytów z komory, widok partii. Nie wracać z nim do stron marketingowych, gdzie liczba nie ma skali.

Element z obecnej strony, opisany na wypadek powrotu — działa i jest rozpoznawalny.

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
- Cały blok siedzi na `.glass` — i **musi mieć pod sobą materiał**. Pasek faktów na stronie głównej stał przez chwilę jako osobna sekcja na płaskiej zieleni i wyglądał dokładnie tak, jak rozdz. 3 ostrzega: szare pudełko z trzema monetami. Naprawa nie polegała na dosypaniu koloru, tylko na przeniesieniu paska tam, gdzie coś pod nim jest — do jasnej wyspy z kartami, na `.glass--light`. Drugie dopuszczalne miejsce to zdjęcie.
- Na jasnej wyspie zmieniają się trzy rzeczy: wartość bierze `--ink`, podpis `--ink-muted`, a separator `--instrument-strong` (bo `--instrument-dim` jest w Kaminie prawie niewidoczny na papierze). Tarcza dostaje delikatny cień, inaczej biel 82% na papierze zostawia sam pierścień wiszący w powietrzu.

Podpis pod liczbą: kapitaliki antykwy, `--brand-300` na ciemnej sekcji i `--ink-muted` na jasnej wyspie, **maksymalnie trzy słowa w jednej linii**. Na obecnej stronie podpis „100% W…" jest ucięty — to nie jest kwestia CSS do naprawy, tylko limitu w treści. Jeśli podpis się nie mieści, zmienia się podpis, nie szerokość tarczy.

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
| **Nature & Future** | subtelny | 1–2 detale na stronę: wskaźniki w pasku faktów i separator sekcji. Reszta czysta. Jedyny wyjątek: podziałka postępu na `/technologia` (patrz 9.1). |
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

12 kolumn na desktopie, 6 na tablecie, 4 na mobile.

### Odstęp między sekcjami

```css
.section { padding-block: clamp(var(--space-xl), 5.5vw, var(--space-2xl)); }
```

Czyli 64 px na wąskim ekranie, 96 px na szerokim, płynnie pomiędzy. Jedna reguła dla wszystkich stron — sklep i panele nie mają już własnej gęstości, bo różnica robiła się sama z liczby elementów w sekcji, a nie z paddingu.

Pierwotnie było tu `--space-3xl` (144 px), za Seed. W praktyce dawało to **288 px pustki między pasmami** i strona wyglądała na niedokończoną, a nie na oddychającą — Seed wypełnia te odległości materiałem, którego my w tych miejscach nie mamy. Zmienione 2026-09-02.

Wartości powyżej `--space-xl` nadal są w skali i mają swoje zastosowania (`--space-2xl` na padding stopki, `--space-3xl` w rezerwie na pojedyncze pasma, które mają celowo stać osobno) — ale nie jako domyślny rytm strony.

**Odstępy wewnątrz sekcji** trzymają się tej samej zasady „ciaśniej, niż podpowiada intuicja": nagłówek sekcji `--space-l` od treści, nagłówek pasma edukacyjnego `--space-xl`, kolumny adnotacji `--space-l` między sobą, blok opinii i stopka `--space-xl`.

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

Primary (różowy) to **jedna akcja pierwszego poziomu na ekran**. To „Zamów", „Do koszyka", „Napisz do nas", „Wyślij zapytanie". Jeśli na widoku stoją obok siebie dwa różowe przyciski prowadzące do **różnych** rzeczy, jeden z nich jest źle zaklasyfikowany.

Rząd identycznych kart produktu jest wyjątkiem, który tę regułę potwierdza: każda karta powtarza tę samą akcję, więc nic ze sobą nie konkuruje. Odbieranie różu drugiej karcie tylko po to, żeby na ekranie był jeden, robi z dwóch równorzędnych produktów jeden ważniejszy — a nie o to chodzi.

Para przycisków w karcie produktu to **primary + secondary**: różowe „Do koszyka" i obwiedzione „Zobacz". Przez pierwsze wersje było odwrotnie — wypełniony „Zobacz" i „Do koszyka" jako podkreślony tekst — przez co najważniejsza akcja w sklepie wyglądała na przypis pod ceną. Warianty `--fill` i `--underline` zostają dla par, w których nie ma zakupu: kafle sub-marek, bloki treściowe, pasek powrotu.

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

**Zachowanie jest identyczne na każdej stronie, niezależnie od tego, co leży pod nawigacją.** Na górze strony nawigacja jest przezroczysta i rozciągnięta na pełną szerokość — bez tła i bez obramowania. Po przewinięciu zamienia się w szkło zwężone do pigułki wyśrodkowanej z marginesem 16px od góry — dokładnie ten ruch, który Seed robi przy scrollu. Przejście 250ms.

Próg przewinięcia zależy od zawartości, ale sam ruch nigdy: strona z hero przełącza się po jego wysokości, strona bez hero po 120px. Wcześniej próg brał się wyłącznie z wysokości hero, więc strony bez niego (sklep, podstrony sub-marek) dostawały pigułkę od razu, przy zerowym scrollu — i serwis miał cztery różne nawigacje na czterech stronach.

**Welon czytelności.** Przezroczysta nawigacja leży wprost na materiale, a materiał nie zawsze jest ciemny — kadr komory w Kaminie jest u góry niemal biały i biały logotyp na nim znika. Pod nierozwiniętą nawigacją leży więc pasmo `--scrim` schodzące do zera na wysokości 128px: ten sam zabieg co gradient czytelności hero (7.1). Na jednolitym tle jest niewidoczne, na zdjęciu ratuje logotyp i linki. Gaśnie w momencie zwinięcia w pigułkę — dalej czytelność bierze na siebie szkło (rozdz. 1, reguła 4).

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

Input: szkło, `--radius-s`, border 1px `rgba(255,255,255,.18)` (deep) / `rgba(11,93,30,.18)` (light).

**Focus jest w kolorze skórki, nie różowy.** Każda paleta wystawia własną parę tokenów — `--focus` na ciemnej sekcji, `--focus-strong` na jasnej wyspie:

```css
[data-brand="nf"]     { --focus: var(--brand-300); --focus-strong: var(--brand-700); }  /* zieleń */
[data-brand="kamino"] { --focus: var(--brand-300); --focus-strong: var(--brand-800); }  /* błękit */
[data-brand="pomona"] { --focus: var(--brand-300); --focus-strong: var(--brand-800); }  /* miód / oliwka */

:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
.section--light :focus-visible { outline-color: var(--focus-strong); }

/* pole formularza dokłada obramowanie w tym samym kolorze */
.input:focus-visible { border-color: var(--focus); }
```

Pierwotnie focus był różowy (`--accent-soft` / `--accent-strong`). Róż jest kolorem akcji i na pierścieniu czytał się jak ostrzeżenie — zamiast wskazywać „tu jesteś", wyglądał jak „coś jest nie tak". Kolor skórki robi to samo, a wygląda jak część projektu. To zarazem jedyne miejsce, gdzie róż **nie** obowiązuje mimo bycia kolorem interfejsu.

Trzy zasady, od których nie ma odstępstw:

1. **`:focus-visible`, nie `:focus`** — pierścień pokazuje się przy nawigacji klawiaturą, a nie po kliknięciu myszką.
2. **2px, nie cieniej.** Przy 1px pierścień ginie na zdjęciu pod szkłem. Jeśli wygląda zbyt krzykliwie, zmienia się kolor, nie grubość.
3. **Nigdy `outline: none` bez zamiennika.** Bez widocznego focusu serwisu nie da się obsłużyć klawiaturą i wypada z WCAG 2.4.7 (poziom AA).

Kontrast pierścienia względem tła sekcji: NF 6.6:1 (deep) / 7.7:1 (light), Kamino 7:1 / 4.4:1, Pomona 6.8:1 / 4.3:1. Minimum dla elementu nietekstowego to 3:1.

Błędy mówią co się stało i co zrobić: „Podaj adres e-mail z @", nie „Nieprawidłowa wartość". Bez przepraszania.

Pole wieloliniowe to ten sam `.input` z modyfikatorem `.input--area`: minimalna wysokość 150px i `resize: vertical`. Poziomo nie, bo rozciągnięte pole wychodzi poza siatkę formularza. Formularze dłuższe niż dwa pola układa `.field-grid` — dwie kolumny, `.field--wide` zajmuje obie, poniżej 760px wszystko wraca do jednej.

### 6.6 Kroki procesu

3–4 kroki w poziomie, połączone cienką linią z kropkami. Ten komponent jest sednem obu podstron sub-marek (7A, pkt 4 i 5) i dlatego siedzi w systemie, a nie na żadnej z nich lokalnie.

```html
<div class="steps">
  <div class="step">
    <p class="step__no">01</p>
    <h3 class="step__title">Eksplantat</h3>
    <p class="muted">Jedno zdanie opisu.</p>
  </div>
  ...
</div>
```

Kropka i linia biorą `--instrument`, więc w NF i Pomonie są mosiężne, a w Kaminie przyrządowo błękitne — przełącznik skórki wystarcza, żeby zmienić temperaturę całego schematu. Kropka jest obrysem 1.5px z poświatą `--instrument-glow`, **nigdy wypełnieniem** (3A). Ostatni krok nie prowadzi linii dalej.

Nagłówek kroku dziedziczy krój po skórce: antykwa w NF, grotesk z ciasnym trackingiem w Kaminie, antykwa w kapitalikach w Pomonie (7A). Numer kroku ma `lining-nums tabular-nums` — przy czterech krokach cyfry muszą stać w kolumnie.

Na jasnej wyspie kropka i linia schodzą na `--instrument-strong`, a numer na `--ink-muted`. Powód jest ten sam co przy wskazówce wskaźnika (3A.2): `--instrument` w Kaminie to `#B5E1E3`, co na papierze daje 1.2:1 i schemat po prostu znika.

Poniżej 760px siatka prostuje się w kolumnę, a linia staje pionowo po lewej stronie kroków. To ten sam schemat obrócony, a nie cztery karty bez związku.
Kroki stoją zawsze w jednym rzędzie — tyle kolumn, ile kroków (`grid-auto-flow: column`). Zawijanie czwartego kroku do drugiego rzędu jest zabronione z tego samego powodu co niepełny rząd w siatce sklepu (8.1): linia od trzeciej kropki prowadzi wtedy donikąd i schemat przestaje być schematem. Poniżej 760px rząd prostuje się w kolumnę i linia staje pionowo.

### 6.7 Pasek powrotu do Nature & Future

Zamyka każdą podstronę sub-marki (7A, pkt 7). Jedno zdanie po lewej, jeden link po prawej, całość na szkle:

```html
<div class="backbar glass">
  <p>Kamino BioLabs jest częścią Nature &amp; Future.</p>
  <a class="btn btn--secondary btn--small" href="sklep-nf.html">Zobacz rośliny w sklepie</a>
</div>
```

Nigdy różowy — róż jest zarezerwowany dla jedynego CTA na stronie, a tym CTA nie jest wyjście z niej. Sub-marka nie ma własnej nawigacji, więc ten pasek jest jedynym powrotem w górę i musi stać na każdej podstronie.

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
- Gradient czytelności: `linear-gradient(to top, var(--scrim) 0%, transparent 55%)` na całym materiale. Bez tego biały tekst rozsypie się na jasnych klatkach. `--scrim` jest tokenem skórki (zieleń w NF, granat w Kaminie, oliwka w Pomonie) — wpisany na sztywno dawał na Kaminie zielony welon na błękicie.
- Dolne rogi hero zaokrąglone `--radius-l`, żeby sekcja pod spodem „wchodziła" pod niego — u Seeda to jest to, co robi wrażenie warstwowości.
- Materiał musi mieć spokojny, wolny ruch. Szybki montaż w hero zabija czytelność nagłówka.

### 7.2 Blok bestsellera

Prosto z Seeda i warto go wziąć, bo **dobrze wygląda przy małej liczbie produktów** — a Wy na starcie macie kilka pozycji. Zamiast siatki, która świeci pustkami, dostajemy jeden duży, „ważny" produkt plus wąska kolumna obok.

Duża karta: 2/3 szerokości, produkt po lewej, treść po prawej, badge „Bestseller" w lewym górnym rogu. Wąska kolumna: 1/3, zdjęcie z laboratorium z kartą szkła na dole i pytaniem prowadzącym („Nie wiesz, od czego zacząć? → Sprawdź poziomy trudności").

Pod spodem rząd dwóch kart — tu Seed przełącza się na jasne tło i my robimy tak samo: to jedna z dwóch dozwolonych jasnych wysp na stronie głównej (patrz 1). Kontrast ciemny → jasny jest sam w sobie sygnałem „to inna kategoria produktów".

Zasada przycisków w tych blokach: **dwa poziomy obok siebie** — różowe „Do koszyka" (primary) i obwiedzione „Zobacz" (secondary). Karta produktu niesie akcję zakupu wszędzie, gdzie się pojawia, także na stronie głównej; nie ma powodu, żeby jedyne miejsce z widocznym „Do koszyka" było dwa kliknięcia dalej.

Zmiana wobec Group_1: sekcja „dwa kafle" w oryginale to dwie kategorie roślin. U Was to **dwie sub-marki** — i to jedyne miejsce na stronie głównej, gdzie Kamino i Pomona pojawiają się jako osobne byty. Reszta strony mówi głosem NF.

---

## 7A. Podstrony sub-marek — `/kamino` i `/pomona`

Obie strony dziedziczą wszystko: siatkę, komponenty, szkło, rytm ciemnych sekcji, nawigację i stopkę Nature & Future. Zmienia się `data-brand` i trzy rzeczy poniżej. Nie są to osobne serwisy i nie mają własnych nawigacji — użytkownik ma czuć, że wciąż jest u N&F, tylko wszedł głębiej.

|  | **Kamino BioLabs** | **PomonaLab** |
|---|---|---|
| `data-brand` | `kamino` | `pomona` |
| Cel strony | wiarygodność technologiczna → kontakt B2B / partnerski | opowieść o odmianach → zapis na przedsprzedaż |
| Kto czyta | inwestor, partner naukowy, klient instytucjonalny | osoba prywatna, sadownik, ogród botaniczny |
| Warstwa 3A | przyrządowa — mosiądz zamieniony na `--brand-300` | mechaniczna — mosiądz w pełni, poziom „mocny" |
| Krój nagłówków | grotesk, ciasny tracking | antykwa w kapitalikach |
| Dane | liczby pomiarowe, `--font-mono`, podziałki | daty, wiek odmiany, region, cyfry tabelaryczne |
| Zdjęcia | sprzęt, komora, sterylność, mało światła | sad, owoc, kora, faktura, światło późnego dnia |
| CTA | „Napisz do nas" — różowy, raz, na dole | „Zapisz się na przedsprzedaż" — różowy, raz |

Wspólny szkielet obu stron (ta sama kolejność, inna treść):

1. **Hero** — węższy niż na stronie głównej, ~52vh, zdjęcie + jedno zdanie.
2. **Trzy wskaźniki** (3A.2) — dla Kamino przyrządowe, dla Pomony mosiężne.
3. **Czym to jest** — jasna wyspa, dwie kolumny tekstu, jedna ilustracja.
4. **Sedno strony** — jedyna sekcja, która różni się strukturalnie:
   - Kamino: schemat systemu / etapy procesu, 3–4 kroki w poziomie
   - Pomona: katalog odmian, karty z nazwą łacińską i datą
5. **Dowód** — dla Kamino: partnerzy, program, publikacje; dla Pomony: skąd pochodzi materiał, jak wygląda odtwarzanie odmiany.
6. **CTA** — pojedyncza sekcja, formularz albo jeden różowy przycisk.
7. **Powrót do N&F** — pasek „To część Nature & Future" z linkiem do sklepu.

Zasada, która trzyma to razem: **sub-marka nie ma prawa mieć własnego komponentu.** Jeśli coś na `/pomona` wymaga elementu, którego nie ma w `/styleguide`, dodaje się go do systemu w trzech skórkach, a nie tworzy lokalnie.

Szkielet z 7A wymusił trzy takie dopisy do systemu, wszystkie zrobione w trzech skórkach i widoczne w `/styleguide`: `.hero--sub` (6.6 / 7.1 — hero podstrony, ~52vh), `.steps` (6.6 — kroki procesu, punkt 4 i 5 szkieletu) oraz `.backbar` (6.7 — pasek powrotu, punkt 7). Do tego doszedł token `--scrim` i modyfikator `.input--area` przy polach formularza.

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

## 8A. Interfejsy zalogowane — panel klienta i admin

Panel to narzędzie, nie opowieść. Ta sama paleta, te same tokeny i to samo szkło, ale inne proporcje: mniej powietrza, więcej informacji na ekran, zero dekoracji, która nie niesie treści.

### Co zmienia się względem stron marketingowych

| | Strony | Panel |
|---|---|---|
| Odstęp między sekcjami | `clamp(--space-xl, 5.5vw, --space-2xl)` | `--space-l` |
| Nagłówki | antykwa, Display XL | grotesk, maks. H2 |
| Wysokość wiersza tabeli | — | 52px, `--space-s` w pionie |
| Mosiądz | 2 elementy na ekran | **0 — panel jest bez mosiądzu** |
| Zdjęcia | duże, kadrowane | miniatury 64px |
| Róż | 1 na ekran | akcje zapisujące, dodające i nieodwracalne |
| Tło bloku treści | jasna wyspa co drugie pasmo | **jasna karta `.section--light`** na ciemnej bazie |

### Zasady, które obowiązują tylko tutaj

1. **Stan pusty jest zaprojektowany, nie domyślny.** Każda lista ma wersję bez danych: jedno zdanie, co się tu pojawi, i jedno wyjście (link do sklepu). Bez ilustracji i bez żartów.

2. **Stan ładowania to szkielet, nie spinner.** Kształt zawartości w `--brand-800`, bez animowanego połysku.

3. **Każdy status ma słowo, nie tylko kolor.** *W realizacji*, *Wysłane*, *Dostarczone*, *Anulowane* — kropka koloru jest dodatkiem do etykiety, nigdy zamiast niej.

4. **Nic nie znika bez potwierdzenia.** Usunięcie adresu, anulowanie zamówienia — modal z nazwą tego, co ginie, i przyciskiem opisującym skutek („Usuń adres"), nie „OK".

5. **Dane liczbowe w `--font-mono` z `tabular-nums`:** numery zamówień, kwoty, daty, ilości. Mają stać w kolumnie.

6. **Tabela na mobile zamienia się w listę kart** — nie w poziomy scroll.

7. **Formularze zapisują się jawnie.** Przycisk „Zapisz zmiany" jest nieaktywny, dopóki nic się nie zmieniło, a po zapisie pojawia się potwierdzenie tekstowe przy formularzu, nie znikający toast w rogu.

### Nawigacja panelu

Lewa kolumna 240px, `.glass`, przyklejona. Na mobile chowa się pod przycisk i wysuwa jako panel ze szkła. Nagłówek serwisu zostaje ten sam co wszędzie — użytkownik ma jednym kliknięciem wrócić do sklepu.

### Stan wdrożenia

Wszystkie osiem komponentów stoi w `nf-components.css` i jest pokazane w `styleguide.html` (sekcja „Panel klienta"). Panel klienta korzysta z nich w pięciu widokach: `konto-nf.html`, `konto-zamowienia-nf.html`, `konto-zamowienie-nf.html`, `konto-dane-nf.html`, `konto-ulubione-nf.html` — kompozycja tych stron mieszka w `nf-panel.css`, wspólna logika w `nf-panel.js`.

| Komponent | Odpowiada zasadzie |
|---|---|
| `.panel` — układ z lewą kolumną 240px | Nawigacja panelu |
| `.panel-nav` — przyklejona kolumna `.glass` + wysuwka na mobile | Nawigacja panelu |
| `.table` — wiersz 52px, wariant kartowy poniżej 760px | 6 |
| `.status` — kropka + etykieta słowna | 3 |
| `.empty` — stan pusty z jednym zdaniem i jednym wyjściem | 1 |
| `.skeleton` — bloki `--brand-800`, bez połysku | 2 |
| `.modal` — potwierdzenie z nazwą i czasownikiem skutku | 4 |
| `.num` — `--font-mono` + `lining-nums tabular-nums` | 5 |
| `.progress` — postęp realizacji zamówienia, ptaszek/kropka/pusto | 3, 10 |

**Zmiana z 2026-09-02.** Pierwsza wersja rozdziału mówiła „ciemna baza, bez jasnych wysp”. W praktyce panel stanął na jednym ciemnozielonym gradiencie, a szkło różniło się od niego o kilka procent jasności — bloki zlewały się w jedną płaszczyznę i nie było widać, gdzie kończy się jeden, a zaczyna drugi. Bloki treści dostały więc `.section--light`: ciemna baza zostaje tłem strony i nawigacji, jasna karta niesie treść. Karta produktu idzie tak samo — jasna, z różowym „Do koszyka” jak w sklepie; ciemne zostają tylko tag i wskaźnik stanu leżące na zdjęciu.

Ta sama decyzja poluzowała róż: w narzędziu prowadzą akcje, a obrysowany przycisk na ciemnej zieleni ginie. Różowe są „Zapisz zmiany”, „Dodaj adres”, „Wyloguj” i potwierdzenie w modalu.

Istniejące komponenty wchodzą do panelu bez zmian: `.btn` (6.1), `.field` / `.input` (6.5), `.glass` (3), `.nav` (6.3), `.card` i `.listing` (6.2 / 8.1 — widok „Zapisane rośliny”). Panel **nie** używa: `.gauge` i `.rule-rivet` (mosiądz), `.anno`, `.hero`, `.card--split`.

Jeden wyjątek od „bez zmian”: w panelu przycisk na karcie produktu jest `.btn--secondary`, nie `.btn--primary`. Kilka kart na ekranie dałoby kilka różów, a tabela wyżej dopuszcza jeden — i rezerwuje go dla akcji nieodwracalnej, czyli dla modala usunięcia.

Słownik statusów w bazie ma pięć wartości, bo tyle ma panel staffa: `Nowe`, `W realizacji`, `Wysłane`, `Dostarczone`, `Anulowane` (pilnuje ich `orders_status_check`). Klient widzi cztery — `Nowe` i `W realizacji` to dla niego ten sam etap. Mapowanie robi `nf-panel.js`, w jednym miejscu.

Odstęp sekcji nadpisuje się raz, na kontenerze panelu, a nie na każdej sekcji z osobna:

```css
.panel .section { padding-block: var(--space-l); }
```

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

### 9.1 Wyjątek: `/technologia`

Jedna strona w całym serwisie łamie regułę „jeden moment na stronę" — i robi to świadomie, bo tam ruch jest treścią, nie ozdobą. `/technologia` prowadzi przez etapy hodowli in vitro sterowane scrollem: użytkownik przewija, roślina przechodzi kolejne fazy.

Warunki, na jakich ten wyjątek obowiązuje:

1. **Tylko jedna scena.** Jeden przyklejony wizual, przez który przechodzą wszystkie etapy. Nie kilka niezależnych animacji rozrzuconych po stronie.
2. **Scroll steruje postępem, nie wyzwala odtwarzania.** Przewinięcie w górę cofa etap. Jeśli animacja odpala się raz i nie da się jej cofnąć, jest zrobiona źle.
3. **Reszta strony bez ruchu.** Poza sceną obowiązuje rozdział 9 bez zmian.
4. **Bez `scroll-jacking`.** Nie przechwytujemy scrolla, nie wymuszamy przeskoków między sekcjami, nie blokujemy przewijania. Strona ma się dać przewinąć normalnie i szybko.
5. **Wersja bez animacji jest pełnoprawna.** Przy `prefers-reduced-motion` i przy wyłączonym JS scena rozkłada się na statyczną listę etapów z tą samą treścią. Nic nie znika.
6. **Animujemy wyłącznie `transform` i `opacity`.** Zero animacji `height`, `top`, `filter` i `backdrop-filter`.

Ta strona jest też jedynym miejscem, gdzie mosiądz może wystąpić w większej liczbie niż dwa elementy na ekran — jako podziałka postępu przy scenie (patrz 3A.4).

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
