/* Nature & Future — jednolite, płynne przejścia między (pod)stronami.
 *
 * Dlaczego: wszystkie strony renderują treść przez framework (React z CDN),
 * a część dodatkowo czeka na dane z Supabase. Natywne View Transitions nie
 * potrafią poczekać na tę treść, więc niektóre przejścia wyglądały „sztywno"
 * (odsłaniała się pusta strona). Tutaj sterujemy przejściem sami:
 *   1. od pierwszej klatki strona jest przykryta jednolitą zieloną zasłoną,
 *   2. zasłona znika (cross-fade) dopiero gdy treść jest faktycznie wyrenderowana,
 *   3. przy kliknięciu w wewnętrzny link zasłona wraca, a potem następuje nawigacja.
 * Dzięki temu każde przejście — w przód i w tył — wygląda tak samo.
 */
(function () {
  try { if (window.top !== window.self) return; } catch (e) { /* cross-origin: kontynuuj */ }

  var d = document;
  var root = d.documentElement;
  var COVER = '#0D1F1F'; // tło zgodne z motywem strony

  // --- 1. Zasłona (pseudo-element na <html>, działa od pierwszej klatki) ---
  var style = d.createElement('style');
  style.textContent =
    'html.nf-cover::before{content:"";position:fixed;inset:0;background:' + COVER + ';' +
    'z-index:2147483646;pointer-events:none;opacity:1;transition:opacity .42s ease}' +
    'html.nf-cover.nf-ready::before{opacity:0}' +
    'html.nf-cover.nf-leaving::before{opacity:1;transition-duration:.28s}' +
    '@media (prefers-reduced-motion:reduce){html.nf-cover::before{transition:none}}';
  (d.head || root).appendChild(style);
  root.classList.add('nf-cover');

  // Przyspiesz pierwsze załadowanie frameworka (React ładowany z unpkg).
  try {
    var pc = d.createElement('link');
    pc.rel = 'preconnect'; pc.href = 'https://unpkg.com'; pc.crossOrigin = 'anonymous';
    (d.head || root).appendChild(pc);
  } catch (e) {}

  // --- 2. Odsłonięcie po wyrenderowaniu treści ---
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.remove('nf-leaving');
    root.classList.add('nf-ready');
  }

  function contentReady() {
    var host = d.getElementById('dc-root'); // kontener renderowany przez framework
    if (host && host.getBoundingClientRect().height > 60) return true;
    // strona bez frameworka: wystarczy, że <body> ma realną treść
    if (!d.querySelector('x-dc') && d.body && d.body.getBoundingClientRect().height > 120) return true;
    return false;
  }

  function watch() {
    if (revealed) return;
    if (contentReady()) {
      // dwie klatki zapasu, żeby treść zdążyła się ułożyć przed cross-fade
      requestAnimationFrame(function () { requestAnimationFrame(reveal); });
      return;
    }
    requestAnimationFrame(watch);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', watch);
  else watch();

  // Bezpieczniki — strona nigdy nie zostanie pod zasłoną na stałe.
  window.addEventListener('load', function () { setTimeout(reveal, 250); });
  setTimeout(reveal, 3500);

  // --- 3. Wygaszenie przy wyjściu (wewnętrzne linki) ---
  function reduceMotion() {
    try { return matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) { return false; }
  }

  d.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;

    var url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    // link w obrębie tej samej strony (kotwica) — zostaw domyślne przewijanie
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;

    e.preventDefault();
    root.classList.remove('nf-ready');
    root.classList.add('nf-leaving');
    var dest = a.href;
    setTimeout(function () { location.href = dest; }, reduceMotion() ? 0 : 290);
  }, true);

  // Powrót z bfcache (przyciski wstecz/dalej) — pokaż natychmiast, bez migotania.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      revealed = true;
      root.classList.remove('nf-leaving');
      root.classList.add('nf-ready');
    }
  });
})();
