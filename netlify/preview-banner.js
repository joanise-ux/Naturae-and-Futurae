/* =============================================================================
   Baner podglądu roboczego + zgłaszanie uwag na Discorda.

   Wstrzykiwany przez netlify/build.sh WYŁĄCZNIE do kopii stron w _site/.
   W źródłach repozytorium go nie ma i nie powinno być — przy przenoszeniu
   nowego frontu na OVH nie ma wtedy czego usuwać.

   Cały interfejs żyje w shadow DOM. Powód jest praktyczny: strony -nf mają
   własne, dość agresywne style globalne (reset, typografia na button/input),
   a baner ma wyglądać tak samo na każdej z nich i nie zaburzać żadnej.
   Shadow DOM załatwia oba kierunki naraz.
   ========================================================================== */

(function () {
  'use strict';

  var script = document.currentScript ||
               document.querySelector('script[src*="preview-banner"]');
  var COMMIT   = (script && script.dataset.commit) || 'nieznana';
  var CONTEXT  = (script && script.dataset.context) || 'local';
  var ENDPOINT = '/.netlify/functions/uwaga';

  var LS_NAME     = 'nf-preview-imie';
  var LS_COLLAPSE = 'nf-preview-zwiniety';

  /* localStorage potrafi rzucić wyjątkiem w trybie prywatnym. */
  function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* --------------------------------------------------------------------------
     Kontekst uwagi.

     Najbardziej uciążliwa część zgłaszania uwag to opisanie, o które miejsce
     chodzi. Bierzemy więc nagłówek sekcji aktualnie widocznej na ekranie:
     ostatni h1-h3, którego górna krawędź jest powyżej środka okna.
     -------------------------------------------------------------------------- */
  function biezacaSekcja() {
    var naglowki = document.querySelectorAll('h1, h2, h3');
    var srodek = window.innerHeight / 2;
    var wynik = null;
    for (var i = 0; i < naglowki.length; i++) {
      var el = naglowki[i];
      /* innerText, nie textContent: nagłówki mają w środku <br>, a textContent
         skleiłby wersy bez spacji — „Z naturyku przyszłości.". */
      var tekst = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
      if (!tekst) continue;
      var gora = el.getBoundingClientRect().top;
      if (gora <= srodek) {
        wynik = tekst.length > 80 ? tekst.slice(0, 80) + '…' : tekst;
      } else if (wynik) {
        break;
      }
    }
    return wynik || '(góra strony)';
  }

  function kontekst() {
    return {
      strona:     document.title || location.pathname,
      sciezka:    location.pathname + location.search,
      sekcja:     biezacaSekcja(),
      scroll:     Math.round(window.scrollY),
      szerokosc:  window.innerWidth,
      wysokosc:   window.innerHeight,
      wersja:     COMMIT,
      srodowisko: CONTEXT
    };
  }

  /* -------------------------------------------------------------------------- */

  var host = document.createElement('div');
  host.id = 'nf-preview-banner';
  var root = host.attachShadow({ mode: 'open' });

  var STYLE = [
    ':host { all: initial; }',
    '* { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }',

    '.pasek {',
    '  position: fixed; z-index: 2147483000;',
    '  left: 50%; bottom: 16px; transform: translateX(-50%);',
    '  display: flex; align-items: center; gap: 12px;',
    '  max-width: calc(100vw - 24px);',
    '  padding: 8px 10px 8px 16px;',
    '  border-radius: 999px;',
    '  background: rgba(5, 59, 6, 0.93);',
    '  border: 1px solid rgba(184, 155, 80, 0.45);',
    '  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.28);',
    '  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);',
    '  color: #F7F8F2; font-size: 12px; line-height: 1;',
    '}',
    '.etykieta { letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; white-space: nowrap; }',
    '.wersja { font-family: "JetBrains Mono", ui-monospace, monospace; opacity: 0.7; white-space: nowrap; }',
    '@media (max-width: 560px) { .wersja { display: none; } }',

    '.btn {',
    '  appearance: none; -webkit-appearance: none; border: 0; cursor: pointer;',
    '  font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap;',
    '  padding: 9px 14px; border-radius: 999px;',
    '  background: #B89B50; color: #1A1D18;',
    '  transition: background 150ms ease;',
    '}',
    '.btn:hover { background: #CBB06A; }',
    '.btn:focus-visible { outline: 2px solid #F7F8F2; outline-offset: 2px; }',
    '.btn[disabled] { opacity: 0.55; cursor: default; }',
    '.btn--ikona { background: transparent; color: #F7F8F2; opacity: 0.6; padding: 7px 9px; font-size: 14px; }',
    '.btn--ikona:hover { background: rgba(255, 255, 255, 0.14); opacity: 1; }',
    '.btn--cichy { background: transparent; color: #5A6157; padding: 9px 10px; }',
    '.btn--cichy:hover { background: rgba(0, 0, 0, 0.06); }',

    '.panel {',
    '  position: fixed; z-index: 2147483000;',
    '  right: 16px; bottom: 74px;',
    '  width: min(380px, calc(100vw - 32px));',
    '  padding: 18px;',
    '  border-radius: 14px;',
    '  background: #F7F8F2;',
    '  border: 1px solid rgba(184, 155, 80, 0.5);',
    '  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);',
    '  color: #1A1D18;',
    '}',
    '@media (max-width: 480px) { .panel { right: 12px; left: 12px; width: auto; } }',

    '.panel h2 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }',
    '.panel__sekcja { margin: 0 0 14px; font-size: 12px; color: #5A6157; line-height: 1.5; }',
    '.panel__sekcja b { color: #0B5D1E; font-weight: 600; }',

    'label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em;',
    '  text-transform: uppercase; color: #5A6157; margin: 0 0 5px; }',
    'input[type="text"], textarea, select {',
    '  display: block; width: 100%; font-size: 13px; line-height: 1.45; color: #1A1D18;',
    '  padding: 8px 10px; margin: 0 0 12px;',
    '  border: 1px solid #C9CFC4; border-radius: 8px; background: #FFF;',
    '}',
    'input[type="text"]:focus, textarea:focus, select:focus {',
    '  outline: 2px solid #0F7C31; outline-offset: -1px; border-color: #0F7C31; }',
    'textarea { min-height: 92px; resize: vertical; }',

    '.pulapka { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }',

    '.stopka { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
    '.status { font-size: 12px; line-height: 1.4; flex: 1 1 100%; min-height: 1em; }',
    '.status--ok { color: #0F7C31; font-weight: 600; }',
    '.status--err { color: #B4453F; font-weight: 600; }',
    '[hidden] { display: none !important; }'
  ].join('\n');

  var MARKUP = [
    '<div class="pasek" id="pasek">',
    '  <span class="etykieta">Podgląd roboczy</span>',
    '  <span class="wersja" id="wersja"></span>',
    '  <button class="btn" id="otworz" type="button">Zgłoś uwagę</button>',
    '  <button class="btn btn--ikona" id="zwin" type="button" aria-label="Zwiń pasek" title="Zwiń pasek">&times;</button>',
    '</div>',

    '<div class="pasek" id="pasekZwiniety" hidden>',
    '  <button class="btn" id="rozwin" type="button">Podgląd &middot; zgłoś uwagę</button>',
    '</div>',

    '<div class="panel" id="panel" role="dialog" aria-label="Zgłoś uwagę" hidden>',
    '  <h2>Zgłoś uwagę</h2>',
    '  <p class="panel__sekcja">Trafi na Discorda razem z adresem strony i sekcją: <b id="sekcja"></b></p>',
    '  <form id="form" novalidate>',
    '    <label for="imie">Kto zgłasza</label>',
    '    <input type="text" id="imie" maxlength="60" autocomplete="name">',

    '    <label for="waga">Waga</label>',
    '    <select id="waga">',
    '      <option value="drobiazg">Drobiazg</option>',
    '      <option value="do poprawy" selected>Do poprawy</option>',
    '      <option value="blokuje">Blokuje</option>',
    '    </select>',

    '    <label for="tresc">Uwaga</label>',
    '    <textarea id="tresc" maxlength="2000"></textarea>',

    '    <input class="pulapka" type="text" id="strona-www" tabindex="-1" autocomplete="off" aria-hidden="true">',

    '    <div class="stopka">',
    '      <button class="btn" id="wyslij" type="submit">Wyślij</button>',
    '      <button class="btn btn--cichy" id="zamknij" type="button">Anuluj</button>',
    '      <span class="status" id="status" role="status"></span>',
    '    </div>',
    '  </form>',
    '</div>'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = STYLE;
  root.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = MARKUP;
  while (wrap.firstChild) root.appendChild(wrap.firstChild);

  var pasek         = root.getElementById('pasek');
  var pasekZwiniety = root.getElementById('pasekZwiniety');
  var panel         = root.getElementById('panel');
  var form          = root.getElementById('form');
  var status        = root.getElementById('status');
  var imie          = root.getElementById('imie');
  var tresc         = root.getElementById('tresc');
  var waga          = root.getElementById('waga');
  var pulapka       = root.getElementById('strona-www');
  var wyslij        = root.getElementById('wyslij');

  root.getElementById('wersja').textContent = COMMIT;
  imie.value = lsGet(LS_NAME) || '';

  function pokazPanel() {
    panel.hidden = false;
    root.getElementById('sekcja').textContent = biezacaSekcja();
    status.textContent = '';
    status.className = 'status';
    (imie.value ? tresc : imie).focus();
  }

  function ukryjPanel() { panel.hidden = true; }

  /* Zwijanie nie chowa banera do końca — zostaje mały przycisk, bo inaczej
     recenzent traci jedyną drogę zgłoszenia uwagi i musi czyścić localStorage. */
  function ustawZwiniecie(czy) {
    pasek.hidden = czy;
    pasekZwiniety.hidden = !czy;
    lsSet(LS_COLLAPSE, czy ? '1' : '0');
  }

  root.getElementById('otworz').addEventListener('click', function () {
    if (panel.hidden) { pokazPanel(); } else { ukryjPanel(); }
  });
  root.getElementById('zamknij').addEventListener('click', ukryjPanel);
  root.getElementById('zwin').addEventListener('click', function () {
    ukryjPanel();
    ustawZwiniecie(true);
  });
  root.getElementById('rozwin').addEventListener('click', function () {
    ustawZwiniecie(false);
    pokazPanel();
  });

  if (lsGet(LS_COLLAPSE) === '1') ustawZwiniecie(true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) ukryjPanel();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!imie.value.trim() || !tresc.value.trim()) {
      status.textContent = 'Uzupełnij imię i treść uwagi.';
      status.className = 'status status--err';
      return;
    }

    lsSet(LS_NAME, imie.value.trim());
    wyslij.disabled = true;
    status.textContent = 'Wysyłam…';
    status.className = 'status';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imie:  imie.value.trim(),
        tresc: tresc.value.trim(),
        waga:  waga.value,
        /* Pole-pułapka: człowiek go nie widzi, więc zostaje puste. */
        strona: pulapka.value,
        kontekst: kontekst()
      })
    })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
        }
        status.textContent = 'Wysłane. Dzięki!';
        status.className = 'status status--ok';
        tresc.value = '';
        setTimeout(ukryjPanel, 1600);
      })
      .catch(function (err) {
        status.textContent = 'Nie poszło: ' + String(err && err.message || err).slice(0, 140);
        status.className = 'status status--err';
      })
      .then(function () { wyslij.disabled = false; });
  });

  function zamontuj() { document.body.appendChild(host); }
  if (document.body) { zamontuj(); }
  else { document.addEventListener('DOMContentLoaded', zamontuj); }
})();
