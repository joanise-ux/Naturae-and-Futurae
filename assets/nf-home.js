/* ==========================================================================
   Nature & Future — nf-home.js
   Wyłącznie hero strony głównej: animacja i jej wersja statyczna przy
   prefers-reduced-motion (rozdz. 7.1, 9). Reszta ruchu na stronie —
   nawigacja i wskaźniki — siedzi w assets/nf-components.js.
   ========================================================================== */

(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var anim = document.getElementById('heroAnim');

  if (!anim) return;

  var motion = anim.getAttribute('src');
  var still = anim.getAttribute('data-still');
  var loopMs = parseInt(anim.getAttribute('data-loop-ms'), 10) || 0;
  var loops = parseInt(anim.getAttribute('data-loops'), 10) || 1;
  var timer = null;
  var frozen = false;

  if (!still) return;

  /* Ostatnia klatka musi być w cache, zanim podmienimy src — inaczej między
     końcem animacji a wczytaniem stopklatki mignęłoby puste tło. */
  var pre = new Image();
  pre.src = still;

  function freeze() {
    frozen = true;
    if (anim.getAttribute('src') !== still) { anim.setAttribute('src', still); }
  }

  /* GIF startuje przy dekodowaniu, nie przy uruchomieniu skryptu — odliczamy
     od zdarzenia load, żeby trzy pętle wypadły tam, gdzie powinny. */
  function startCountdown() {
    if (frozen || !loopMs) return;
    if (timer) { clearTimeout(timer); }
    timer = window.setTimeout(freeze, loopMs * loops);
  }

  function applyMotionPreference() {
    if (reduce.matches) {
      if (timer) { clearTimeout(timer); timer = null; }
      freeze();
    } else if (!frozen) {
      if (anim.getAttribute('src') !== motion) { anim.setAttribute('src', motion); }
      if (anim.complete) { startCountdown(); }
    }
  }

  anim.addEventListener('load', function () {
    if (anim.getAttribute('src') === motion) { startCountdown(); }
  });

  applyMotionPreference();
  if (reduce.addEventListener) { reduce.addEventListener('change', applyMotionPreference); }
})();
