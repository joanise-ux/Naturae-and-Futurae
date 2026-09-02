/* ==========================================================================
   Nature & Future — styleguide.js
   Obsługa dwóch przełączników na pasku i wypełnianie próbek koloru oraz
   rozmiarów typografii realnymi wartościami z CSS.

   Nic tu nie stylizuje komponentów — plik wyłącznie przełącza atrybuty
   i klasy, których komponenty i tak używają na produkcji.
   ========================================================================== */

(function () {

  /* --- 1. Skórka: data-brand na <body> (6.3) ---------------------------
     Przefarbowanie całej strony robi CSS (styleguide.css, 400ms). Tutaj
     zmienia się wyłącznie atrybut i stan przycisków.
     -------------------------------------------------------------------- */

  var brandButtons = document.querySelectorAll('[data-brand-value]');

  Array.prototype.forEach.call(brandButtons, function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-brand-value');
      document.body.setAttribute('data-brand', value);

      Array.prototype.forEach.call(brandButtons, function (other) {
        other.setAttribute('aria-pressed', String(other === btn));
      });

      /* Kolumny palety mają własne data-brand i się nie zmieniają, ale hex
         w kolumnach zależy od tego, co przeglądarka policzy — odświeżamy. */
      paintSwatches();
      readTypeSizes();
    });
  });


  /* --- 2. Wariant sekcji: ciemna sekcja / jasna wyspa (rozdz. 1) --------
     Dodaje .section--light do wszystkich pól przykładów i podmienia szkło
     na .glass--light, bo to dwie różne warstwy tej samej decyzji: deep
     bierze .glass, jasna wyspa .glass--light (rozdz. 3).
     -------------------------------------------------------------------- */

  var canvases = document.querySelectorAll('.sg-canvas');
  var glassy = document.querySelectorAll('[data-sg-glass]');
  var variantButtons = document.querySelectorAll('[data-variant]');

  function setVariant(variant) {
    var light = variant === 'light';

    Array.prototype.forEach.call(canvases, function (el) {
      el.classList.toggle('section--light', light);
      el.classList.toggle('section--deeper', variant === 'deeper');
    });
    /* Szkło ma tylko dwa warianty: Deep+ zostaje przy .glass, bo to nadal
       ciemna sekcja — zmienia się tło pod szkłem, nie samo szkło (rozdz. 3). */
    Array.prototype.forEach.call(glassy, function (el) {
      el.classList.toggle('glass', !light);
      el.classList.toggle('glass--light', light);
    });
    Array.prototype.forEach.call(variantButtons, function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-variant') === variant));
    });
  }

  Array.prototype.forEach.call(variantButtons, function (btn) {
    btn.addEventListener('click', function () {
      setVariant(btn.getAttribute('data-variant'));
    });
  });


  /* --- 3. Próbki koloru -------------------------------------------------
     Hex czytamy z getComputedStyle, więc próbka nigdy nie rozjedzie się
     z tokenem. Gradienty nie mają wartości hex — pokazujemy sam pasek.
     -------------------------------------------------------------------- */

  var BRAND_TOKENS = [
    '--brand-900', '--brand-800', '--brand-700', '--brand-600',
    '--brand-500', '--brand-300', '--brand-100',
    '--paper', '--glass-bg', '--instrument', '--instrument-dim',
    '--grad-deep', '--grad-light'
  ];

  var SHARED_TOKENS = [
    '--accent', '--accent-strong', '--accent-soft', '--accent-ink',
    '--paper', '--paper-warm', '--ink', '--ink-muted',
    '--ok', '--warn', '--error',
    '--brass', '--brass-dim', '--brass-glow'
  ];

  /* rgb(...) → #rrggbb. Wartości z alfa i rgba zostawiamy jak są —
     przezroczystość szkła to informacja, nie szum. */
  function toHex(value) {
    var m = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!m) return value;
    return '#' + [m[1], m[2], m[3]].map(function (n) {
      return ('0' + parseInt(n, 10).toString(16)).slice(-2).toUpperCase();
    }).join('');
  }

  function buildSwatch(host, token) {
    var raw = getComputedStyle(host).getPropertyValue(token).trim();
    var isGradient = raw.indexOf('gradient') !== -1;

    var row = document.createElement('p');
    row.className = 'sg-swatch';

    var chip = document.createElement('i');
    chip.style.background = raw || 'transparent';

    var name = document.createElement('b');
    name.textContent = token;

    var value = document.createElement('var');
    value.textContent = isGradient ? 'gradient' : (raw ? toHex(raw) : '—');

    row.appendChild(chip);
    row.appendChild(name);
    row.appendChild(value);
    return row;
  }

  function paintSwatches() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-swatches]'), function (box) {
      var tokens = box.getAttribute('data-swatches') === 'shared' ? SHARED_TOKENS : BRAND_TOKENS;
      /* Kolumna palety ma własne data-brand na rodzicu — czytamy z niego,
         żeby trzy skórki dały trzy różne zestawy wartości naraz. */
      var host = box.closest('[data-brand]') || document.body;
      box.textContent = '';
      tokens.forEach(function (token) { box.appendChild(buildSwatch(host, token)); });
    });
  }


  /* --- 4. Rozmiary w skali typograficznej -------------------------------
     Display XL i H1 są w clamp(), więc realny rozmiar zależy od szerokości
     okna. Podpis pokazuje wartość policzoną teraz, plus deklarację z tokenu.
     -------------------------------------------------------------------- */

  var TYPE_TOKEN = {
    '.display-xl': '--type-display-xl',
    '.h1': '--type-h1',
    '.h2': '--type-h2',
    '.h3': '--type-h3',
    '.lead': '--type-body-l',
    'p': '--type-body',
    '.small': '--type-small',
    '.latin': '--type-latin'
  };

  function readTypeSizes() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-size-of]'), function (label) {
      var selector = label.getAttribute('data-size-of');
      var row = label.closest('.sg-type__row');
      var sample = row && row.querySelector(selector);
      if (!sample) return;

      var px = getComputedStyle(sample).fontSize;
      var token = TYPE_TOKEN[selector];
      var declared = token ? getComputedStyle(document.body).getPropertyValue(token).trim() : '';

      label.textContent = declared && declared.indexOf('clamp') === 0
        ? px + ' teraz · ' + declared
        : px + (declared ? ' · ' + declared : '');
    });
  }

  paintSwatches();
  readTypeSizes();
  window.addEventListener('resize', readTypeSizes, { passive: true });
})();
