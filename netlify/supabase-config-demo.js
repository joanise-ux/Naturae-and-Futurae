/* ==========================================================================
   Nature & Future — supabase-config.js dla PODGLĄDU (netlify/)
   Kopiowany przez netlify/build.sh do _site/supabase-config.js, czyli pod tę
   samą nazwę, którą wczytują strony panelu. Dzięki temu żadna strona nie
   wymaga zmiany, a podgląd nie dostaje ani adresu, ani klucza produkcyjnej
   bazy — tych danych po prostu nie ma w opublikowanym katalogu.

   Po co: zespół ma obejrzeć wnętrze panelu bez zakładania konta i bez
   dotykania prawdziwych zamówień. Ten plik udaje klienta Supabase i podaje
   zestaw danych przykładowych.

   Wszystkie osoby, adresy i zamówienia poniżej są zmyślone.

   NA PRODUKCJI TEGO PLIKU NIE MA. Deploy na OVH wyklucza cały katalog
   netlify/ (.github/workflows/deploy.yml), a strony wczytują wtedy prawdziwy
   supabase-config.js z katalogu głównego.
   ========================================================================== */

(function () {
  'use strict';

  var UID = 'demo-0000-0000-0000-000000000001';

  var DANE = {
    profiles: [{
      id: UID,
      full_name: 'Anna Przykładowa',
      phone: '600 100 200',
      email: 'anna@przyklad.test',
      /* Ranga personelu, żeby na podglądzie widać było też skróty
         administracyjne w kolumnie panelu. Klient ma tu 9. */
      rank: 11
    }],

    orders: [
      { id: 'NF-0156', user_id: UID, total: 189, status: 'Wysłane',
        created_at: '2026-08-18T10:00:00Z',
        tracking_number: '600123456789', carrier: 'InPost',
        delivery_method: 'Paczkomat', payment_method: 'Przelew', payment: 'Opłacone',
        address_snapshot: { full_name: 'Anna Przykładowa', street: 'Świdnicka 12', postal: '50-068', city: 'Wrocław' } },

      { id: 'NF-0151', user_id: UID, total: 64, status: 'Dostarczone',
        created_at: '2026-07-02T10:00:00Z',
        tracking_number: '600987654321', carrier: 'InPost',
        delivery_method: 'Kurier', payment_method: 'Przelew', payment: 'Opłacone',
        address_snapshot: { full_name: 'Anna Przykładowa', street: 'Świdnicka 12', postal: '50-068', city: 'Wrocław' } },

      { id: 'NF-0149', user_id: UID, total: 240, status: 'Nowe',
        created_at: '2026-06-11T10:00:00Z',
        tracking_number: null, carrier: null,
        delivery_method: 'Paczkomat', payment_method: 'Przelew', payment: 'Nieopłacone',
        address_snapshot: null },

      { id: 'NF-0143', user_id: UID, total: 96, status: 'Anulowane',
        created_at: '2026-05-04T10:00:00Z',
        tracking_number: null, carrier: null,
        delivery_method: 'Kurier', payment_method: 'Przelew', payment: 'Nieopłacone',
        address_snapshot: null }
    ],

    order_items: [
      { order_id: 'NF-0156', product_id: 'anubias', name: 'Anubias nana', latin: 'Anubias barteri var. nana', qty: 3, price: 22, image: 'assets/anubias.jpg' },
      { order_id: 'NF-0156', product_id: 'krypto', name: 'Kryptokoryna Wendta', latin: 'Cryptocoryne wendtii', qty: 2, price: 28, image: 'assets/sp-flasks.jpg' },
      { order_id: 'NF-0151', product_id: 'anubias', name: 'Anubias nana', latin: 'Anubias barteri var. nana', qty: 1, price: 22, image: 'assets/anubias.jpg' },
      { order_id: 'NF-0149', product_id: 'mech-jaw', name: 'Chrismas Moss', latin: 'Vesicularia montagnei', qty: 4, price: 26, image: 'assets/sp-desk-bottles.jpg' },
      { order_id: 'NF-0143', product_id: 'eleocharis', name: 'Eleocharis mini', latin: 'Eleocharis pusilla', qty: 3, price: 24, image: 'assets/sp-flasks.jpg' }
    ],

    addresses: [
      { id: 'demo-adres-1', user_id: UID, label: 'Dom', full_name: 'Anna Przykładowa',
        street: 'Świdnicka 12/4', postal: '50-068', city: 'Wrocław', phone: '600 100 200',
        is_default: true, created_at: '2026-01-10T10:00:00Z' },
      { id: 'demo-adres-2', user_id: UID, label: 'Praca', full_name: 'Anna Przykładowa',
        street: 'Legnicka 55', postal: '54-203', city: 'Wrocław', phone: '',
        is_default: false, created_at: '2026-03-02T10:00:00Z' }
    ],

    watched_products: [
      { id: 'demo-obs-1', user_id: UID, product_id: 'anubias', created_at: '2026-08-01T10:00:00Z',
        products: { id: 'anubias', name: 'Anubias nana', latin: 'Anubias barteri var. nana',
          image: 'assets/anubias.jpg', price: 22, unit: 'szt. · kubek 5×5', stock: 20, tag: 'łatwa' } },
      { id: 'demo-obs-2', user_id: UID, product_id: 'krypto', created_at: '2026-07-20T10:00:00Z',
        products: { id: 'krypto', name: 'Kryptokoryna Wendta', latin: 'Cryptocoryne wendtii',
          image: 'assets/sp-flasks.jpg', price: 28, unit: 'szt. · kubek 5×5', stock: 2, tag: 'średnia' } },
      { id: 'demo-obs-3', user_id: UID, product_id: 'mech-jaw', created_at: '2026-07-10T10:00:00Z',
        products: { id: 'mech-jaw', name: 'Chrismas Moss', latin: 'Vesicularia montagnei',
          image: 'assets/sp-desk-bottles.jpg', price: 26, unit: 'szt. · kubek 5×5', stock: 0, tag: 'trudna' } }
    ],

    /* Jedna pozycja, żeby na podglądzie widać było licznik przy koszyku. */
    cart_items: [
      { id: 'demo-koszyk-1', user_id: UID, product_id: 'anubias', qty: 2, created_at: '2026-09-01T10:00:00Z' }
    ]
  };

  /* Zmiany trzymamy tylko w pamięci karty: recenzent może dodać adres albo
     usunąć obserwowaną roślinę i zobaczyć, co się dzieje, a odświeżenie
     przywraca zestaw wyjściowy. Nic nie jest nigdzie zapisywane. */

  function nowyId() {
    return 'demo-' + Math.random().toString(36).slice(2, 10);
  }

  function zapytanie(tabela) {
    var filtry = [];
    var sortowanie = [];

    function wybrane() {
      var out = (DANE[tabela] || []).filter(function (r) {
        return filtry.every(function (f) { return f(r); });
      });
      sortowanie.slice().reverse().forEach(function (s) {
        out.sort(function (a, b) {
          var x = a[s.pole], y = b[s.pole];
          if (x === y) return 0;
          var wynik = x > y ? 1 : -1;
          return s.rosnaco ? wynik : -wynik;
        });
      });
      return out;
    }

    var api = {
      select: function () { return api; },

      eq: function (k, v) {
        filtry.push(function (r) { return String(r[k]) === String(v); });
        return api;
      },
      in: function (k, vs) {
        filtry.push(function (r) { return vs.indexOf(r[k]) !== -1; });
        return api;
      },
      order: function (pole, opcje) {
        sortowanie.push({ pole: pole, rosnaco: !opcje || opcje.ascending !== false });
        return api;
      },

      then: function (ok, err) {
        return Promise.resolve({ data: wybrane(), error: null }).then(ok, err);
      },
      catch: function (f) {
        return Promise.resolve({ data: wybrane(), error: null }).catch(f);
      },
      maybeSingle: function () {
        var out = wybrane();
        return Promise.resolve({ data: out[0] || null, error: null });
      },
      single: function () { return api.maybeSingle(); },

      insert: function (wiersz) {
        var r = Object.assign({ id: nowyId(), created_at: new Date().toISOString() }, wiersz);
        (DANE[tabela] = DANE[tabela] || []).push(r);
        return Promise.resolve({ data: [r], error: null });
      },

      update: function (zmiany) {
        var podApi = {
          eq: function (k, v) {
            (DANE[tabela] || []).forEach(function (r) {
              if (String(r[k]) === String(v) && filtry.every(function (f) { return f(r); })) {
                Object.assign(r, zmiany);
              }
            });
            filtry.push(function (r) { return String(r[k]) === String(v); });
            return podApi;
          },
          then: function (ok) { return Promise.resolve({ error: null }).then(ok); }
        };
        return podApi;
      },

      delete: function () {
        var podApi = {
          eq: function (k, v) {
            filtry.push(function (r) { return String(r[k]) === String(v); });
            DANE[tabela] = (DANE[tabela] || []).filter(function (r) {
              return !filtry.every(function (f) { return f(r); });
            });
            return podApi;
          },
          then: function (ok) { return Promise.resolve({ error: null }).then(ok); }
        };
        return podApi;
      }
    };

    return api;
  }

  /* Ekran logowania ma zostać oglądalny, więc tam udajemy wylogowanego.
     Wszędzie indziej sesja jest od razu — o to chodzi w podglądzie: zespół
     wchodzi w panel bez zakładania konta.

     Rozszerzenie jest opcjonalne, bo i Netlify, i lokalne `serve` podają
     ten sam plik pod /konto-logowanie-nf i /konto-logowanie-nf.html. Bez
     tego ekran logowania przeskakiwał od razu do panelu. */
  function naEkranieLogowania() {
    return /\/konto-logowanie-nf(\.html)?$|\/konto\/logowanie\/?$/.test(location.pathname);
  }

  var SESJA = {
    user: { id: UID, email: DANE.profiles[0].email },
    access_token: 'demo'
  };

  window.supabaseClient = {
    from: zapytanie,

    auth: {
      getSession: function () {
        return Promise.resolve({
          data: { session: naEkranieLogowania() ? null : SESJA },
          error: null
        });
      },
      onAuthStateChange: function () {
        return { data: { subscription: { unsubscribe: function () {} } } };
      },
      /* Dowolne dane wpuszczają dalej — na podglądzie nie ma czego chronić. */
      signInWithPassword: function () {
        return Promise.resolve({ data: { session: SESJA, user: SESJA.user }, error: null });
      },
      signInWithOAuth: function () {
        location.href = 'konto-nf.html';
        return Promise.resolve({ data: {}, error: null });
      },
      signOut: function () { return Promise.resolve({ error: null }); },
      updateUser: function () { return Promise.resolve({ data: {}, error: null }); },
      resetPasswordForEmail: function () { return Promise.resolve({ data: {}, error: null }); }
    }
  };

  /* Pasek informujący, że dane są zmyślone. Bez niego recenzent mógłby wziąć
     „Anna Przykładowa” za prawdziwe konto i zgłosić błąd danych. */
  document.addEventListener('DOMContentLoaded', function () {
    var pasek = document.createElement('p');
    pasek.textContent = 'Podgląd: dane przykładowe, nie prawdziwe konto. Zmiany znikają po odświeżeniu.';
    pasek.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483646',
      'margin:0', 'padding:8px 16px', 'text-align:center',
      'font:500 12px/1.4 Inter, system-ui, sans-serif', 'letter-spacing:.02em',
      'color:#0B1F0E', 'background:#FFBE5C',
      'box-shadow:0 -2px 12px rgba(0,0,0,.28)'
    ].join(';');
    document.body.appendChild(pasek);
  });
})();
