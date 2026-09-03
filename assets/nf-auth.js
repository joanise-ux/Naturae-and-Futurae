/* ==========================================================================
   Nature & Future — nf-auth.js
   Logika ekranu logowania (konto-logowanie-nf.html).

   Czego ten plik NIE robi: nie zakłada kont, nie zmienia i nie resetuje
   haseł. Te operacje mają działający mechanizm w konto.html i ekran
   logowania tylko do niego kieruje — drugi tor uwierzytelniania to drugi
   tor błędów.

   Zasady: żadne hasło ani adres nie trafia do konsoli, komunikat błędu
   jest po polsku i nie powtarza treści odpowiedzi serwera.

   Zależy od: supabase-js 2 + supabase-config.js (window.supabaseClient).
   ========================================================================== */

(function () {
  'use strict';

  var sb = null;

  /* Adres powrotu — ta sama whitelista co w panel-klienta.html. Przyjmujemy
     wyłącznie nazwę pliku panelu klienta albo panelu personelu, więc
     parametrem nie da się przekierować użytkownika na obcy serwis. */
  var DOZWOLONE = /^(konto|admin)(-[a-z]+)?-nf\.html(\?[A-Za-z0-9_=&%.\-]*)?$/;

  function cel() {
    var p = new URLSearchParams(location.search).get('powrot');
    return p && DOZWOLONE.test(p) ? p : 'konto-nf.html';
  }

  /* --- Komunikaty ---------------------------------------------------------
     Odpowiedzi Supabase są po angielsku i bywają techniczne. Tłumaczymy je
     na zdania, które mówią, co zrobić. Nieznany błąd nie pokazuje surowej
     treści — ta potrafi nieść szczegóły konta. */
  function komunikat(msg) {
    var m = (msg || '').toLowerCase();
    if (m.indexOf('invalid login credentials') !== -1 || m.indexOf('invalid credentials') !== -1) {
      return 'Nieprawidłowy e-mail lub hasło.';
    }
    if (m.indexOf('email not confirmed') !== -1) {
      return 'Adres e-mail nie został jeszcze potwierdzony. Sprawdź skrzynkę pocztową.';
    }
    if (m.indexOf('rate limit') !== -1 || m.indexOf('too many') !== -1) {
      return 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.';
    }
    if (m.indexOf('network') !== -1 || m.indexOf('fetch') !== -1) {
      return 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.';
    }
    return 'Nie udało się zalogować. Spróbuj ponownie za chwilę.';
  }

  /* --- Błędy przy polach --------------------------------------------------- */

  function pokazBlad(input, idErr, tekst) {
    var err = document.getElementById(idErr);
    input.classList.add('input--error');
    input.setAttribute('aria-invalid', 'true');
    if (err) { err.textContent = tekst; err.hidden = false; }
  }

  function wyczyscBlad(input, idErr) {
    var err = document.getElementById(idErr);
    input.classList.remove('input--error');
    input.removeAttribute('aria-invalid');
    if (err) { err.hidden = true; err.textContent = ''; }
  }

  function pokazBladOgolny(tekst) {
    var box = document.getElementById('bladLogowania');
    box.textContent = tekst;
    box.hidden = false;
  }

  function schowajBladOgolny() {
    var box = document.getElementById('bladLogowania');
    box.hidden = true;
    box.textContent = '';
  }

  /* --- Podgląd hasła -------------------------------------------------------
     aria-pressed niesie stan, a aria-label mówi, co przycisk zrobi po
     naciśnięciu — sama ikona oka nie mówi, czy hasło jest teraz widoczne. */
  function podgladHasla() {
    var btn = document.getElementById('pokazHaslo');
    var pole = document.getElementById('haslo');
    if (!btn || !pole) return;

    btn.addEventListener('click', function () {
      var widoczne = pole.type === 'text';
      pole.type = widoczne ? 'password' : 'text';
      btn.setAttribute('aria-pressed', String(!widoczne));
      btn.setAttribute('aria-label', widoczne ? 'Pokaż hasło' : 'Ukryj hasło');
      pole.focus();
    });
  }

  /* --- Logowanie hasłem ----------------------------------------------------- */

  function formularz() {
    var form = document.getElementById('formLogowanie');
    var email = document.getElementById('email');
    var haslo = document.getElementById('haslo');
    var przycisk = document.getElementById('zaloguj');
    if (!form) return;

    email.addEventListener('input', function () { wyczyscBlad(email, 'emailErr'); schowajBladOgolny(); });
    haslo.addEventListener('input', function () { wyczyscBlad(haslo, 'hasloErr'); schowajBladOgolny(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      schowajBladOgolny();
      wyczyscBlad(email, 'emailErr');
      wyczyscBlad(haslo, 'hasloErr');

      var adres = email.value.trim();
      var pierwsze = null;

      /* Walidacja mówi, czego brakuje, zanim wyśle cokolwiek na serwer. */
      if (!adres) {
        pokazBlad(email, 'emailErr', 'Podaj adres e-mail.');
        pierwsze = email;
      } else if (adres.indexOf('@') === -1) {
        pokazBlad(email, 'emailErr', 'Podaj adres e-mail z @.');
        pierwsze = email;
      }
      if (!haslo.value) {
        pokazBlad(haslo, 'hasloErr', 'Podaj hasło.');
        if (!pierwsze) pierwsze = haslo;
      }
      if (pierwsze) { pierwsze.focus(); return; }

      przycisk.disabled = true;
      przycisk.textContent = 'Logowanie…';

      sb.auth.signInWithPassword({ email: adres, password: haslo.value })
        .then(function (r) {
          if (r.error) {
            pokazBladOgolny(komunikat(r.error.message));
            przycisk.disabled = false;
            przycisk.textContent = 'Zaloguj się';
            haslo.focus();
            return;
          }
          location.replace(cel());
        })
        .catch(function () {
          pokazBladOgolny('Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.');
          przycisk.disabled = false;
          przycisk.textContent = 'Zaloguj się';
        });
    });
  }

  /* --- Logowanie przez Google ----------------------------------------------
     Po powrocie z Google przeglądarka ląduje pod tym samym adresem z
     parametrem powrotu w komplecie, więc dalej działa ta sama ścieżka
     co przy logowaniu hasłem. */
  function google() {
    var btn = document.getElementById('zalogujGoogle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      btn.disabled = true;
      sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: location.origin + location.pathname + '?powrot=' + encodeURIComponent(cel())
        }
      }).then(function (r) {
        if (r && r.error) {
          pokazBladOgolny('Nie udało się połączyć z Google. Spróbuj ponownie.');
          btn.disabled = false;
        }
      }).catch(function () {
        pokazBladOgolny('Nie udało się połączyć z Google. Spróbuj ponownie.');
        btn.disabled = false;
      });
    });
  }

  /* --- „Zapamiętaj mnie” ----------------------------------------------------
     Supabase trzyma sesję w localStorage i odnawia ją sam — to jest
     „zapamiętaj mnie” włączone. Odznaczenie ma dać sesję na czas okna,
     więc po zalogowaniu przenosimy token do sessionStorage i czyścimy
     trwały ślad. Zapis odczytuje ta sama biblioteka, nie nasz kod. */
  function ulotnaSesja() {
    try {
      var klucze = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) klucze.push(k);
      }
      klucze.forEach(function (k) {
        sessionStorage.setItem(k, localStorage.getItem(k));
        localStorage.removeItem(k);
      });
    } catch (e) {
      /* Prywatne okno potrafi zablokować oba magazyny. Sesja zostaje
         wtedy taka, jaką dała biblioteka — logowanie i tak działa. */
    }
  }

  /* --- Start ----------------------------------------------------------------- */

  function start() {
    sb = window.supabaseClient;
    if (!sb) { setTimeout(start, 60); return; }

    /* Zalogowany nie ma po co oglądać formularza — od razu do panelu. */
    sb.auth.getSession().then(function (r) {
      if (r && r.data && r.data.session) location.replace(cel());
    });

    sb.auth.onAuthStateChange(function (event, session) {
      if (event !== 'SIGNED_IN' || !session) return;
      var pamietaj = document.getElementById('zapamietaj');
      if (pamietaj && !pamietaj.checked) ulotnaSesja();
      location.replace(cel());
    });

    tlo();
    podgladHasla();
    formularz();
    google();
  }

  /* Zdjęcie w tle waży tyle, że na wolnym łączu potrafi dojść po formularzu.
     Zamiast wskakiwać w kadr, wchodzi płynnie — a do tego czasu widać
     gradient marki. */
  function tlo() {
    var img = document.querySelector('.auth__media');
    if (!img) return;
    if (img.complete) return;

    img.classList.add('is-loading');
    var zdejmij = function () { img.classList.remove('is-loading'); };
    img.addEventListener('load', zdejmij, { once: true });
    img.addEventListener('error', zdejmij, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
