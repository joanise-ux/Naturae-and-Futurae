/* ==========================================================================
   Nature & Future — animacje wejscia
   --------------------------------------------------------------------------
   Zastepuje biblioteke `motion`, ktorej uzywal prototyp Figma Make. Projekt
   nie ma builda i doladowuje React z CDN — dolozenie kolejnej paczki wydluza
   start strony, a caly uzytek z biblioteki sprowadzal sie do trzech wzorcow:

     <motion.div initial animate> / FadeUp  ->  IntersectionObserver + klasa
     useCounter                             ->  petla na requestAnimationFrame
     AnimatePresence (menu mobilne)         ->  przelaczanie klasy

   Sam wyglad przejscia (czasy, krzywa, dystans) siedzi w assets/nf-ui.css
   pod .nf-fade — tutaj jest wylacznie moment zalaczenia.

   Wazne: strony renderuja sie dynamicznie przez support.js, wiec elementow
   nie ma jeszcze w DOM w chwili uruchomienia skryptu. Dlatego, podobnie jak
   content-editor.js, czekamy na MutationObserver zamiast na DOMContentLoaded.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------
  // 1. Wejscia przy przewijaniu
  // ---------------------------------------------------------------------
  // Swiadomie BEZ IntersectionObserver, choc to on bylby tu naturalny.
  // Powod: tresc startuje z opacity 0 i bez sygnalu od obserwatora nigdy sie
  // nie pokaze — a IO milczy, dopoki przegladarka nie komponuje klatek (karta
  // w tle, ukryty panel podgladu, czesc trybow zrzutow ekranu). Pomiar
  // pozycji przez getBoundingClientRect jest deterministyczny i od tego
  // niezalezny. Przy 29 elementach koszt jest zaden.
  //
  // Element raz pokazany musi zostac pokazany. support.js, konczac render,
  // podmienia wezly i przywraca atrybut class z szablonu — a wraz z nim
  // kasuje dolozone przez nas 'is-in'. Element wracal wtedy do opacity 0.
  // Dlatego zapamietujemy fakt pokazania na wezle i przy kazdym przebiegu
  // przywracamy klase, jesli zniknela.
  var shown = 'nfShown';

  // Odpowiednik rootMargin -80px z prototypu: element rusza, gdy wejdzie
  // w kadr na dobre, a nie w chwili musniecia dolnej krawedzi.
  var MARGIN = 80;

  function reveal(el) {
    el[shown] = true;
    el.classList.add('is-in');
    if (el.hasAttribute('data-nf-count')) startCounter(el);
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    // Element o zerowej wysokosci (jeszcze nierozlozony) pomijamy —
    // wroci przy kolejnym przebiegu.
    if (!r.height && !r.width) return false;
    // Warunek celowo jednostronny: liczy sie tylko gorna krawedz. Element,
    // ktory jest juz NAD kadrem, tez sie kwalifikuje — inaczej tresc
    // przeskoczona (klikniecie kotwicy #kontakt, przywrocona pozycja
    // przewijania po odswiezeniu, skok klawiszem End) zostawalaby
    // niewidoczna na zawsze, bo nigdy nie przeszla przez kadr.
    return r.top < (window.innerHeight || 0) - MARGIN;
  }

  function scan() {
    var els = document.querySelectorAll('.nf-fade, [data-nf-count]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];

      // Naprawa po ponownym renderze — patrz komentarz przy `shown`.
      if (el[shown]) {
        if (!el.classList.contains('is-in')) el.classList.add('is-in');
        continue;
      }

      if (reduce) {
        // Przy wylaczonym ruchu tresc ma byc na miejscu od razu.
        el[shown] = true;
        el.classList.add('is-in');
        if (el.hasAttribute('data-nf-count')) finishCounter(el);
        continue;
      }

      if (inView(el)) reveal(el);
    }
  }

  // ---------------------------------------------------------------------
  // 2. Liczniki
  // ---------------------------------------------------------------------
  // Prototyp uzywal setInterval co 16 ms przez 60 krokow. requestAnimationFrame
  // daje ten sam ~1 s, ale trzyma sie odswiezania ekranu i nie liczy w tle.
  // Format zapisujemy z atrybutow, zeby "100+" i "100%" nie wymagaly kodu.
  function startCounter(el) {
    var target = parseFloat(el.getAttribute('data-nf-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-nf-suffix') || '';
    var dur = 1000;
    var t0 = null;

    function frame(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / dur, 1);
      // easeOutCubic — koncowka wyhamowuje, tak jak w prototypie.
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(frame);
  }

  function finishCounter(el) {
    var target = el.getAttribute('data-nf-count');
    if (target !== null) el.textContent = target + (el.getAttribute('data-nf-suffix') || '');
  }

  // ---------------------------------------------------------------------
  // 3. Menu mobilne
  // ---------------------------------------------------------------------
  // Wszystko przez delegacje na dokumencie i wyszukiwanie elementow dopiero
  // w momencie kliknięcia. Uchwyty zlapane raz przy starcie wskazywalyby na
  // wezly, ktore support.js podmienia konczac render <x-dc>: przycisk
  // reagowal, ale przelaczal klase na oderwanym juz panelu i menu nie
  // otwieralo sie wcale.
  function setOpen(open) {
    var menu = document.querySelector('.nf-mobile-menu');
    var burger = document.querySelector('.nf-burger');
    if (menu) menu.classList.toggle('is-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function bindMenu() {
    if (document.nfMenuBound) return;
    document.nfMenuBound = true;

    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;

      if (e.target.closest('.nf-burger')) {
        var burger = document.querySelector('.nf-burger');
        setOpen(burger.getAttribute('aria-expanded') !== 'true');
        return;
      }

      // Klikniecie linku zamyka panel — inaczej po przejsciu na kotwice
      // menu zostaje rozwiniete i zaslania tresc.
      if (e.target.closest('.nf-mobile-menu a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    // Po powrocie na szeroki ekran panel musi zniknac, bo .nf-burger
    // chowa sie w media query i nie da sie go juz zamknac.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  // ---------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------
  function tick() { scan(); bindMenu(); }

  // Dlawik na przewijaniu i zmianie rozmiaru — bez niego scan() odpalalby
  // kilkadziesiat razy na jeden gest.
  //
  // Swiadomie setTimeout, a nie requestAnimationFrame: rAF jest wstrzymywany,
  // gdy strona sie nie renderuje (karta w tle, ukryty panel podgladu). Przy
  // rAF tresc potrafila zostac niewidoczna, bo dlawik nigdy nie zwalnial.
  var queued = false;
  function onFrame() {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; tick(); }, 16);
  }

  tick();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick);
  }
  window.addEventListener('load', tick);
  window.addEventListener('scroll', onFrame, { passive: true });
  window.addEventListener('resize', onFrame);

  // support.js renderuje tresc po starcie skryptu — bez tego elementy,
  // ktore pojawia sie dopiero wtedy, nigdy by nie zostaly zmierzone.
  if ('MutationObserver' in window) {
    new MutationObserver(onFrame).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Bezpiecznik. Gdyby pomiar zawiodl z powodu, ktorego tu nie przewidziano,
  // strona ma sie pokazac mimo wszystko — niewidoczna tresc jest gorsza niz
  // brak animacji.
  setTimeout(function () {
    var els = document.querySelectorAll('.nf-fade:not(.is-in)');
    for (var i = 0; i < els.length; i++) {
      if (!inView(els[i])) continue;
      els[i][shown] = true;
      els[i].classList.add('is-in');
    }
  }, 2500);
})();
