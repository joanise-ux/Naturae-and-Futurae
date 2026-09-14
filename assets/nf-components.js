/* ==========================================================================
   Nature & Future — nf-components.js
   Zachowanie komponentów, które go potrzebują. Każdy blok sam sprawdza, czy
   jego elementy są na stronie, więc plik można wczytać wszędzie.

     6.3   nawigacja — zwija się w pigułkę po przescrollowaniu hero
     6.3   menu mobilne
     3A.2  wskaźnik — wskazówka odchyla się raz, przy wejściu w widok

   Żadnych fade-in-up przy scrollu i żadnych animacji hover na kartach
   (rozdz. 9: jeden orkiestrowany moment na stronę).
   ========================================================================== */

(function () {

  /* --- Nawigacja: zwija się po przescrollowaniu wysokości hero ---------- */
  var navInner = document.getElementById('navInner');
  var hero = document.querySelector('.hero');

  if (navInner) {
    /* Nawigacja zachowuje się tak samo na każdej stronie: na górze leży
       rozciągnięta i bez tła, po przewinięciu zwija się w pigułkę ze szkła.
       Wcześniej próg brał się z wysokości hero, a strony bez hero (sklep,
       podstrony sub-marek przed przebudową) dostawały pigułkę od razu —
       stąd cztery różne nawigacje na czterech stronach.

       Bez hero próg jest stały: 120px, czyli mniej więcej tyle, ile trzeba
       przewinąć, żeby nawigacja zaczęła nachodzić na treść. */
    var PIN_FALLBACK = 120;

    var updateNav = function () {
      var threshold = hero ? hero.offsetHeight - 72 : PIN_FALLBACK;
      navInner.classList.toggle('is-pinned', window.scrollY > threshold);
    };

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { updateNav(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', updateNav, { passive: true });
    updateNav();
  }

  /* --- Menu mobilne ---------------------------------------------------- */
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('navMenu');

  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setMenu(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1040 && !menu.hidden) { setMenu(false); }
    }, { passive: true });
  }

  /* --- Wskaźniki: wskazówka odchyla się raz, przy wejściu w widok -------
     Kąt bierze się z data-angle. Funkcja jest wystawiona jako
     NF.liveGauges(), żeby styleguide mógł ją wywołać ponownie po
     przemalowaniu strony na inną skórkę.
     -------------------------------------------------------------------- */

  function liveGauge(el) {
    el.style.setProperty('--angle', el.getAttribute('data-angle'));
    el.classList.add('is-live');
  }

  function observeGauges(root) {
    var gauges = (root || document).querySelectorAll('.gauge:not(.is-live)');
    if (!gauges.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(gauges, liveGauge);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        liveGauge(entry.target);
        io.unobserve(entry.target);   /* raz, nie przy scrollu w obie strony */
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(gauges, function (g) { io.observe(g); });
  }

  observeGauges(document);

  window.NF = window.NF || {};
  window.NF.liveGauges = observeGauges;
})();
