/* Nature & Future / Kamino BioLabs — zachowanie strony wizytówki.
   Dwa niezależne bloki; każdy sam sprawdza, czy jego elementy są na stronie. */
(function () {
  'use strict';

  /* --- 1. Boczny wskaźnik sekcji (strona NF) ----------------------------- */
  var railLinks = document.querySelectorAll('.nf-rail a');
  if (railLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    railLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        railLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    document.querySelectorAll('[data-rail]').forEach(function (s) { observer.observe(s); });
  }

  /* --- 2. Formularz kontaktowy (strona Kamino) --------------------------- */
  var form = document.getElementById('contactForm');
  if (!form) return;

  var status = document.getElementById('formStatus');
  var button = form.querySelector('button[type="submit"]');
  var MAIL = 'kontakt@nfplantbiotech.com';

  var MESSAGES = {
    missing_fields: 'Uzupełnij imię i nazwisko, adres e-mail i treść wiadomości.',
    bad_email: 'Adres e-mail wygląda na niepełny. Sprawdź go i wyślij ponownie.',
    too_long: 'Wiadomość jest za długa. Skróć ją do 5000 znaków.',
    rate_limited: 'Z tego adresu przyszło już kilka wiadomości. Spróbuj ponownie za godzinę albo napisz na ' + MAIL + '.'
  };

  function showStatus(kind, text) {
    status.className = 'form__status form__status--' + kind;
    status.textContent = text;
    status.hidden = false;
    status.focus();
  }

  function markInvalid() {
    var first = null;
    ['name', 'email', 'message'].forEach(function (name) {
      var field = form.elements[name];
      var bad = !field.value.trim() || (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()));
      if (bad) { field.setAttribute('aria-invalid', 'true'); first = first || field; }
      else field.removeAttribute('aria-invalid');
    });
    return first;
  }

  form.addEventListener('input', function (e) {
    if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
  });

  /* Wersja bez JS wraca tutaj z ?wyslano=1 albo ?blad=kod. */
  var params = new URLSearchParams(location.search);
  if (params.get('wyslano')) showStatus('ok', 'Wiadomość wysłana. Odpiszemy na podany adres e-mail.');
  else if (params.get('blad')) showStatus('error', MESSAGES[params.get('blad')] || 'Nie udało się wysłać wiadomości. Napisz na ' + MAIL + '.');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstInvalid = markInvalid();
    if (firstInvalid) {
      var emailOnly = firstInvalid.name === 'email' && firstInvalid.value.trim();
      showStatus('error', emailOnly ? MESSAGES.bad_email : MESSAGES.missing_fields);
      firstInvalid.focus();
      return;
    }

    button.disabled = true;
    button.textContent = 'Wysyłanie…';

    fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          form.reset();
          showStatus('ok', 'Wiadomość wysłana. Odpiszemy na podany adres e-mail.');
        } else {
          showStatus('error', MESSAGES[result.data.error] || 'Nie udało się wysłać wiadomości. Napisz na ' + MAIL + '.');
        }
      })
      .catch(function () {
        showStatus('error', 'Nie udało się wysłać wiadomości. Napisz na ' + MAIL + '.');
      })
      .then(function () {
        button.disabled = false;
        button.textContent = 'Wyślij wiadomość';
      });
  });
})();
