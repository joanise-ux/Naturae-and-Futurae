/* ==========================================================================
   Nature & Future — nf-shop.js
   Silnik listingu produktów (rozdz. 8). Jeden plik obsługuje trzy strony:
   sklep NF, podstronę PomonaLab i podstronę Kamino BioLabs.

   Marki nie przełącza się tutaj. Stronę farbuje atrybut data-brand
   wpisany na <body> w znaczniku (6.3, tokens.css) i on też decyduje,
   którą gałąź katalogu wziąć z nf-catalogue.js. Sklep jest wyłącznie NF.

   Sedno pliku to planLayout(): siatka z 8.1. Liczba kolumn wynika
   z liczby produktów w kategorii, a nie ze sztywnego grida w CSS.
   Zasada nadrzędna: nigdy niepełny rząd w układzie trzykolumnowym.

   Renderowanie składa wyłącznie znaczniki komponentów, które już istnieją
   w nf-components.css i nf-home.css.
   ========================================================================== */

(function () {

  var PRODUCTS   = window.NF_CATALOGUE.products;
  var CATEGORIES = window.NF_CATALOGUE.categories;


  /* ======================================================================
     3. SIATKA (rozdz. 8.1) — sedno.

        | produktów | układ                                               |
        | 1         | jedna karta pełnej szerokości                       |
        | 2–3       | blok wyróżniony 2/3 + 1/3, reszta w dwóch kolumnach  |
        | 4–6       | dwie kolumny, karty wysokie                          |
        | 7+        | trzy kolumny                                         |

        Zasada nadrzędna: nigdy niepełny rząd w układzie trzykolumnowym.
        „Jeśli ostatni rząd byłby niepełny, zmniejsz liczbę kolumn dla całej
        kategorii” — a gdy i to nie domyka, jeden produkt awansuje do bloku
        wyróżnionego i siatka dostaje resztę, która dzieli się równo.
        Dwa wyjścia awaryjne, oba nazwane w dokumencie. Żadnej sieroty.
     ====================================================================== */

  /* Największa liczba kolumn ≤ max, przy której nie zostaje niepełny rząd. */
  function fit(count, max) {
    for (var c = max; c > 1; c--) { if (count % c === 0) return c; }
    return 1;
  }

  function planLayout(n) {
    if (n <= 0)  return { featured: false, aside: false, cols: 0 };

    /* 1 → jedna karta pełnej szerokości, bez sąsiada w slocie 1/3. */
    if (n === 1) return { featured: true, aside: false, cols: 0 };

    /* 2–3 → blok wyróżniony 2/3 + 1/3, pod nim reszta. */
    if (n <= 3) return { featured: true, aside: true, cols: fit(n - 1, 2) };

    /* 4–6 → dwie kolumny. Nieparzysta piątka zostawiłaby sierotę,
       więc jeden produkt awansuje do bloku wyróżnionego. */
    if (n <= 6) {
      if (n % 2 === 0) return { featured: false, aside: false, cols: 2 };
      return { featured: true, aside: true, cols: 2 };
    }

    /* 7+ → trzy kolumny, o ile ostatni rząd się domyka. */
    if (n % 3 === 0)       return { featured: false, aside: false, cols: 3 };
    if ((n - 1) % 3 === 0) return { featured: true,  aside: true,  cols: 3 };
    if (n % 2 === 0)       return { featured: false, aside: false, cols: 2 };
    return { featured: true, aside: true, cols: 2 };   /* n nieparzyste → n-1 parzyste */
  }


  /* ======================================================================
     4. Znaczniki. Wyłącznie komponenty z nf-components.css / nf-home.css.
     ====================================================================== */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Nazwa gatunkowa: kursywa antykwy nad nazwą polską (rozdz. 4). */
  function nameBlock(p) {
    return '<p>' +
      (p.latin ? '<i class="latin" lang="la">' + esc(p.latin) + '</i>' : '') +
      '<span class="specimen-name">' + esc(p.name) + '</span></p>';
  }

  /* Wskaźnik stanu (6.2): kolor nigdy nie niesie informacji sam —
     obok kropki zawsze stoi liczba. */
  function stockBlock(p) {
    if (p.stock === 0) return '<span class="stock stock--out">0 dostępnych</span>';
    if (p.stock <= 3)  return '<span class="stock stock--low">' + p.stock +
                              (p.stock === 1 ? ' sztuka' : ' sztuki') + '</span>';
    return '<span class="stock">' + p.stock + ' dostępne</span>';
  }

  function priceBlock(p) {
    return '<p><span class="price">' + p.price + ' PLN</span><br>' +
           '<span class="price-note muted">' + esc(p.unit) + '</span></p>';
  }

  function cartButton(p) {
    return p.stock === 0
      ? '<button class="btn btn--primary btn--small" type="button" disabled>Wyprzedane</button>'
      : '<button class="btn btn--primary btn--small" type="button">Do koszyka</button>';
  }

  /* Karta produktu w siatce (6.2). */
  function cardHTML(p, glass) {
    return '' +
      '<article class="card ' + (glass || 'glass') + '">' +
        '<div class="card__photo">' +
          '<span class="tag">' + esc(p.level) + '</span>' +
          '<button class="card__fav" type="button" aria-pressed="false" ' +
            'aria-label="Dodaj ' + esc(p.name) + ' do ulubionych">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 19.5 4.7 12.2a4.7 4.7 0 0 1 6.5-6.5l.8.8.8-.8a4.7 4.7 0 0 1 6.5 6.5Z"/>' +
            '</svg>' +
          '</button>' +
          '<img src="' + p.img + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
          stockBlock(p) +
        '</div>' +
        '<div class="card__body">' + nameBlock(p) +
          '<p class="muted small">' + esc(p.desc) + '</p>' +
        '</div>' +
        '<div class="card__foot">' + priceBlock(p) + cartButton(p) + '</div>' +
      '</article>';
  }

  /* Blok wyróżniony / karta pełnej szerokości — .feature z rozdz. 7.2.
     Rozdz. 8.1: „jedna karta pełnej szerokości, produkt po lewej,
     treść po prawej (jak blok bestsellera)”. */
  function featureHTML(p, badge) {
    return '' +
      /* Blok stoi w jasnej wyspie razem z siatką, więc bierze szkło jasne.
         .glass na papierze znika (rozdz. 3). */
      '<article class="feature glass--light">' +
        (badge ? '<span class="badge">' + esc(badge) + '</span>' : '') +
        '<div class="feature__photo">' +
          '<img src="' + p.img + '" alt="' + esc(p.alt) + '" decoding="async">' +
        '</div>' +
        '<div class="feature__body">' + nameBlock(p) +
          '<p class="muted">' + esc(p.desc) + '</p>' +
          '<p class="price">' + p.price + ' PLN</p>' +
          '<p class="small muted">' + esc(p.unit) + ' · wysyłka w 48 h</p>' +
          stockBlock(p) +
          '<div class="btn-pair">' +
            '<a class="btn btn--secondary btn--small" href="produkt.html">Zobacz</a>' +
            '<a class="btn btn--primary btn--small" href="produkt.html">Do koszyka</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* Slot 1/3 obok bloku wyróżnionego — .aside-photo, dokładnie jak na
     stronie głównej (7.2). Zdjęcie kategorii + karta ze szkła. */
  function asideHTML(cat, items) {
    /* Slot 1/3 stoi tuż obok bloku wyróżnionego. Gdyby wziął to samo
       zdjęcie, co produkt w bloku, w jednym widoku stałyby dwie kopie
       tego samego kadru — wtedy bierzemy zdjęcie ostatniej pozycji. */
    var img = cat.img;
    if (items.length && img === items[0].img) { img = items[items.length - 1].img; }

    return '' +
      '<aside class="aside-photo">' +
        '<img src="' + img + '" alt="" loading="lazy" decoding="async">' +
        '<div class="aside-photo__card glass">' +
          '<p class="lead">' + esc(cat.title) + '</p>' +
          '<a href="#listing">Zobacz opis kolekcji <span aria-hidden="true">&rarr;</span></a>' +
        '</div>' +
      '</aside>';
  }

  function heroHTML(cat) {
    var spec = cat.spec.map(function (row) {
      return '<div><dt class="small muted">' + esc(row[0]) + '</dt>' +
             '<dd class="small">' + esc(row[1]) + '</dd></div>';
    }).join('');

    /* Max trzy adnotacje na obraz (6.4). */
    var annos = cat.annos.slice(0, 3).map(function (text) {
      return '<p class="anno anno--right glass">' + text + '</p>';
    }).join('');

    return '' +
      '<div class="cat-hero">' +
        '<div class="cat-hero__body">' +
          /* Nad listingiem stoi hero strony i to on niesie <h1>. Nazwa
             kolekcji schodzi na <h2>, żeby na stronie był jeden nagłówek
             pierwszego stopnia; klasa i wygląd zostają bez zmian (rozdz. 8). */
          '<h2 class="display-xl" id="catHeroTitle">' + esc(cat.title) + '</h2>' +
          '<p class="lead">' + esc(cat.lead) + '</p>' +
          '<dl class="spec">' + spec + '</dl>' +
        '</div>' +
        '<div class="cat-hero__media">' +
          '<img src="' + cat.img + '" alt="' + esc(cat.alt) + '" decoding="async">' +
          '<div class="cat-hero__anno">' + annos + '</div>' +
        '</div>' +
      '</div>';
  }


  /* ======================================================================
     5. Stan i render.
     ====================================================================== */

  /* Marka jest własnością strony, nie kontrolki. Bierzemy ją raz,
     z data-brand na <body>, i już się nie zmienia. */
  var brand = document.body.getAttribute('data-brand') || 'nf';
  var state = { category: CATEGORIES[brand][0].id, sort: 'polecane' };

  var elCatSeg   = document.getElementById('shopCategories');
  var elHero     = document.getElementById('catHero');
  /* Listing rozkłada się na dwie sekcje o różnym tle (rozdz. 1):
     blok wyróżniony zostaje na ciemnym, siatka kart schodzi na jasną
     wyspę. Stąd dwa kontenery zamiast jednego. */
  var elFeatured = document.getElementById('shopFeatured');
  var elGrid     = document.getElementById('shopGrid');
  var elGridSec  = document.getElementById('shopGridSection');
  var elCount    = document.getElementById('shopCount');
  var elPlan     = document.getElementById('shopPlan');
  var elSort     = document.getElementById('shopSort');

  function currentCategory() {
    var list = CATEGORIES[brand];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === state.category) return list[i];
    }
    return list[0];
  }

  function currentProducts(cat) {
    var all = PRODUCTS[brand];
    var out = cat.filter
      ? all.filter(function (p) { return p.tags.indexOf(cat.filter) > -1; })
      : all.slice();

    /* Wyprzedane spadają na koniec — nigdy nie trafiają do bloku
       wyróżnionego, bo blok wyróżniony bierze pierwszą pozycję. */
    out.sort(function (a, b) { return (a.stock === 0) - (b.stock === 0); });

    if (state.sort === 'cena-rosnaco')  out.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'cena-malejaco') out.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'nazwa')         out.sort(function (a, b) { return a.name.localeCompare(b.name, 'pl'); });
    if (state.sort === 'dostepnosc')    out.sort(function (a, b) { return b.stock - a.stock; });
    return out;
  }

  function renderCategories() {
    elCatSeg.innerHTML = CATEGORIES[brand].map(function (c) {
      return '<button type="button" data-category="' + c.id + '" aria-pressed="' +
             (c.id === state.category) + '">' + esc(c.label) + '</button>';
    }).join('');
  }

  function render() {
    var cat = currentCategory();
    var items = currentProducts(cat);
    var n = items.length;
    var plan = planLayout(n);

    /* Hero kategorii jest opcjonalne. Sklep NF je ma, bo tam kategoria
       jest tematem strony. Podstrony sub-marek go nie mają — tam tematem
       jest marka i to ona trzyma <h1>, więc drugi hero tylko powtarzałby
       tę samą tabelkę parametrów. */
    if (elHero) { elHero.innerHTML = heroHTML(cat); }

    var dark = '';
    var light = '';
    var rest = items;

    if (plan.featured) {
      rest = items.slice(1);
      dark = plan.aside
        ? '<div class="bestseller">' + featureHTML(items[0], 'Wyróżnione') + asideHTML(cat, items) + '</div>'
        : featureHTML(items[0], null);
    }

    /* Karty w jasnej wyspie biorą .glass--light — na ciemnym robiłyby
       mleczną plamę, a .glass na papierze znika (rozdz. 3). */
    if (rest.length && plan.cols > 0) {
      light = '<div class="listing" style="--listing-cols:' + plan.cols + '">' +
              rest.map(function (p) { return cardHTML(p, 'glass--light'); }).join('') + '</div>';
    }

    if (!n) {
      dark = '<p class="lead muted">W tej kategorii nic teraz nie rośnie. ' +
             'Zajrzyj za dwa tygodnie — partie wychodzą z hodowli w cyklu ośmiotygodniowym.</p>';
    }

    elFeatured.innerHTML = dark;
    elGrid.innerHTML = light;

    /* Wyspa niesie teraz także pasek kategorii i nagłówek listingu, więc
       nie chowa się przy pustej siatce — bez niej nie dałoby się przejść
       do innej kategorii. Chowa się sam pusty blok, żeby nie zostawiał
       odstępu po sobie. */
    elFeatured.hidden = !dark;
    elGrid.hidden = !light;

    /* Wyspa domyka stronę, więc stopka podjeżdża pod jej dolne rogi —
       wycinają się wtedy w --brand-900, a nie w jaśniejszy fragment tła
       (nf-shop.css). */
    elGridSec.parentNode.classList.add('shop-page--light-end');

    elCount.textContent = n + ' ' + plural(n, 'produkt', 'produkty', 'produktów');
    elPlan.textContent = describePlan(n, plan);
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    var t = n % 10, h = n % 100;
    return (t >= 2 && t <= 4 && (h < 12 || h > 14)) ? few : many;
  }

  /* Podpis diagnostyczny — mówi, którą regułę z 8.1 wybrała logika.
     W produkcji ten wiersz można usunąć; tu jest dowodem działania. */
  function describePlan(n, plan) {
    if (!n) return 'brak produktów w tej kategorii';
    if (plan.featured && !plan.aside) return '8.1 → 1 produkt: karta pełnej szerokości';
    if (plan.featured) {
      return '8.1 → blok wyróżniony 2/3 + 1/3, pod nim ' + (n - 1) +
             ' w ' + plan.cols + ' kol. · ' + rows((n - 1) / plan.cols);
    }
    return '8.1 → ' + plan.cols + ' kolumny · ' + rows(n / plan.cols);
  }

  function rows(r) {
    return r + ' ' + plural(r, 'pełny rząd', 'pełne rzędy', 'pełnych rzędów');
  }


  /* ======================================================================
     6. Kontrolki. Zostały dwie: kategoria i sortowanie.

        Przełącznika sub-marek z 6.3 tu nie ma i nie ma go być. Sklep jest
        wyłącznie Nature & Future; PomonaLab i Kamino BioLabs mają własne
        podstrony, a każda niesie swoją skórkę w data-brand na <body>.
        Segmentowany kontrolek (.seg) zostaje — obsługuje kategorie.
     ====================================================================== */

  elCatSeg.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-category]');
    if (!btn) return;
    state.category = btn.getAttribute('data-category');
    renderCategories();
    render();
  });

  elSort.addEventListener('change', function () {
    state.sort = elSort.value;
    render();
  });

  renderCategories();
  render();

  /* Wystawione na zewnątrz, żeby regułę 8.1 dało się sprawdzić bez klikania. */
  window.NFShop = { planLayout: planLayout, fit: fit };
})();
