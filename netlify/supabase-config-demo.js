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

  /* Daty liczone względem dnia otwarcia podglądu. Gdyby były wpisane
     na sztywno, analiza sklepu po kilku tygodniach pokazywałaby pusty
     wykres — a to wyglądałoby jak błąd, nie jak zmyślone dane. */
  function nDniTemu(n) {
    return new Date(Date.now() - n * 86400000).toISOString();
  }

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

    /* Dwie pozycje, żeby na podglądzie widać było licznik przy koszyku
       i licznik ilości: anubias ma zapas, kryptokoryna jedną sztukę, więc
       przy niej plus jest wyłączony stanem magazynowym. */
    cart_items: [
      { id: 'demo-koszyk-1', user_id: UID, product_id: 'anubias', qty: 2,
        created_at: '2026-09-01T10:00:00Z',
        products: { id: 'anubias', name: 'Anubias nana', latin: 'Anubias barteri var. nana',
          image: 'assets/anubias.jpg', price: 22, unit: 'szt. · kubek 5×5', stock: 20 } },
      { id: 'demo-koszyk-2', user_id: UID, product_id: 'krypto', qty: 1,
        created_at: '2026-09-01T11:00:00Z',
        products: { id: 'krypto', name: 'Kryptokoryna Wendta', latin: 'Cryptocoryne wendtii',
          image: 'assets/sp-flasks.jpg', price: 28, unit: 'szt. · kubek 5×5', stock: 1 } }
    ],

    /* --- Poniżej: zestaw dla panelu personelu (admin-*-nf.html) ----------
       Panel klienta czyta tylko wiersze konta demo, więc te dane go nie
       dotyczą. Panel personelu czyta wszystko i bez nich pokazywałby same
       stany puste — a to akurat nie jest to, co zespół ma ocenić.

       Wszystkie osoby, zamówienia i wiadomości poniżej są zmyślone. */

    products: [
      { id: 'anubias', name: 'Anubias nana', latin: 'Anubias barteri var. nana',
        category: 'akwariowe', price: 22, cost: 8, stock: 20, unit: 'szt. · kubek 5×5',
        image: 'assets/anubias.jpg', tag: 'łatwa',
        description: 'Wolno rosnąca, wybacza błędy. Kłącze zostaje nad podłożem.' },
      { id: 'krypto', name: 'Kryptokoryna Wendta', latin: 'Cryptocoryne wendtii',
        category: 'akwariowe', price: 28, cost: 11, stock: 6, unit: 'szt. · kubek 5×5',
        image: 'assets/Kryptokoryna wendta.jpg', tag: 'średnia',
        description: 'Po przesadzeniu zrzuca liście i odbija — to normalne.' },
      { id: 'mech-jaw', name: 'Mech jawajski', latin: 'Vesicularia montagnei',
        category: 'akwariowe', price: 26, cost: 9, stock: 0, unit: 'porcja · kubek 5×5',
        image: 'assets/sp-desk-bottles.jpg', tag: 'łatwa',
        description: 'Do przywiązania na korzeniu albo kamieniu.' },
      { id: 'eleocharis', name: 'Eleocharis mini', latin: 'Eleocharis pusilla',
        category: 'akwariowe', price: 24, cost: 10, stock: 14, unit: 'porcja · kubek 5×5',
        image: 'assets/sp-flasks.jpg', tag: 'średnia',
        description: 'Trawnik. Potrzebuje światła i cierpliwości.' },
      { id: 'jablon-glog', name: 'Jabłoń Charłamówka', latin: 'Malus domestica',
        category: 'sadownicze', price: 84, cost: 38, stock: 5, unit: 'szt. · sadzonka',
        image: 'assets/pomona.jpg', tag: 'stara odmiana',
        description: 'Odmiana z archiwum PomonaLab, owocuje we wrześniu.' },
      { id: 'grusza-bera', name: 'Grusza Bera Hardy', latin: 'Pyrus communis',
        category: 'sadownicze', price: 92, cost: 41, stock: 0, unit: 'szt. · sadzonka',
        image: 'assets/capsule-forest.jpg', tag: 'stara odmiana',
        description: 'Wymaga zapylacza. Wysyłka jesienią.' }
    ],

    guests: [
      { id: 'demo-gosc-1', full_name: 'Marek Bez Konta', email: 'marek@przyklad.test',
        phone: '600 300 400' }
    ],

    sales_targets: [
      { period: String(new Date().getFullYear()), amount: 4000, updated_by: UID }
    ],

    staff_audit: [],

    emails: [
      { id: 'demo-mail-1', folder: 'inbox', read: false,
        from_name: 'Marek Bez Konta', from_address: 'marek@przyklad.test',
        to_addresses: [{ email: 'kontakt@nfplantbiotech.com' }],
        subject: 'Pytanie o wysyłkę mchu',
        received_at: '2026-09-01T08:20:00Z',
        body_text: 'Dzień dobry,\n\nczy mech jawajski wróci do sprzedaży przed końcem miesiąca? Chciałbym zamówić razem z anubiasem.\n\nPozdrawiam\nMarek' },
      { id: 'demo-mail-2', folder: 'inbox', read: true,
        from_name: 'Anna Przykładowa', from_address: 'anna@przyklad.test',
        to_addresses: [{ email: 'kontakt@nfplantbiotech.com' }],
        subject: 'Kryptokoryna zrzuciła liście',
        received_at: '2026-08-24T16:05:00Z',
        body_text: 'Dzień dobry, roślina po tygodniu zrzuciła wszystkie liście. Czy to normalne?' },
      { id: 'demo-mail-3', folder: 'sent', read: true,
        from_name: 'Nature & Future', from_address: 'kontakt@nfplantbiotech.com',
        to_addresses: [{ email: 'anna@przyklad.test' }],
        subject: 'Re: Kryptokoryna zrzuciła liście',
        received_at: '2026-08-24T17:40:00Z',
        body_text: 'To normalne — kryptokoryna przechodzi z kultury in vitro na warunki akwariowe i odbija po dwóch tygodniach.' }
    ]
  };

  /* Zamówienia innych osób. Doklejone po deklaracji, bo część korzysta
     z identyfikatorów produktów zdefiniowanych wyżej. */
  DANE.orders = DANE.orders.concat([
    { id: 'NF-0160', user_id: null, total: 84, status: 'Nowe',
      created_at: nDniTemu(3), payment: 'Nieopłacone',
      channel: 'online', location: 'online',
      guest_name: 'Marek Bez Konta', guest_email: 'marek@przyklad.test',
      address_snapshot: { full_name: 'Marek Bez Konta', street: 'Polna 3', postal: '58-300', city: 'Wałbrzych' } },

    { id: 'NF-0159', user_id: UID, total: 176, status: 'W realizacji',
      created_at: nDniTemu(9), payment: 'Opłacone',
      channel: 'hurtownia', location: 'walim',
      address_snapshot: { full_name: 'Anna Przykładowa', street: 'Świdnicka 12', postal: '50-068', city: 'Wrocław' } },

    { id: 'NF-0158', user_id: UID, total: 268, status: 'Dostarczone',
      created_at: nDniTemu(26), payment: 'Opłacone',
      channel: 'online', location: 'wroclaw',
      address_snapshot: { full_name: 'Anna Przykładowa', street: 'Świdnicka 12', postal: '50-068', city: 'Wrocław' } },

    { id: 'NF-0157', user_id: null, total: 92, status: 'Anulowane',
      created_at: nDniTemu(48), payment: 'Nieopłacone',
      channel: 'marketplace', location: '',
      guest_name: 'Marek Bez Konta', guest_email: 'marek@przyklad.test',
      address_snapshot: null }
  ]);

  DANE.order_items = DANE.order_items.concat([
    { order_id: 'NF-0160', product_id: 'jablon-glog', name: 'Jabłoń Charłamówka', qty: 1, price: 84, image: 'assets/pomona.jpg' },
    { order_id: 'NF-0159', product_id: 'anubias', name: 'Anubias nana', qty: 4, price: 22, image: 'assets/anubias.jpg' },
    { order_id: 'NF-0159', product_id: 'eleocharis', name: 'Eleocharis mini', qty: 2, price: 24, image: 'assets/sp-flasks.jpg' },
    { order_id: 'NF-0158', product_id: 'krypto', name: 'Kryptokoryna Wendta', qty: 5, price: 28, image: 'assets/Kryptokoryna wendta.jpg' },
    { order_id: 'NF-0158', product_id: 'grusza-bera', name: 'Grusza Bera Hardy', qty: 1, price: 92, image: 'assets/capsule-forest.jpg' },
    { order_id: 'NF-0157', product_id: 'grusza-bera', name: 'Grusza Bera Hardy', qty: 1, price: 92, image: 'assets/capsule-forest.jpg' }
  ]);

  /* Więcej kont, żeby lista użytkowników i skala rang miały co pokazać. */
  DANE.profiles = DANE.profiles.concat([
    { id: 'demo-0000-0000-0000-000000000002', full_name: 'Piotr Moderator',
      email: 'piotr@przyklad.test', phone: '600 200 300', rank: 10 },
    { id: 'demo-0000-0000-0000-000000000003', full_name: 'Kasia Klientka',
      email: 'kasia@przyklad.test', phone: '600 400 500', rank: 9 },
    { id: 'demo-0000-0000-0000-000000000004', full_name: 'Tomasz Klient',
      email: 'tomasz@przyklad.test', phone: '', rank: 9 }
  ]);

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

      limit: function () { return api; },

      /* upsert wystarczy w wersji „po kluczu głównym albo po polu z opcji”.
         Panel personelu używa go do celów sprzedaży i do przywracania kopii;
         w obu przypadkach klucz jest jeden. */
      upsert: function (wiersze, opcje) {
        var klucz = (opcje && opcje.onConflict) || 'id';
        var lista = Array.isArray(wiersze) ? wiersze : [wiersze];
        DANE[tabela] = DANE[tabela] || [];
        lista.forEach(function (w) {
          var istnieje = DANE[tabela].filter(function (r) {
            return String(r[klucz]) === String(w[klucz]);
          })[0];
          if (istnieje) Object.assign(istnieje, w);
          else DANE[tabela].push(Object.assign({ id: nowyId() }, w));
        });
        return Promise.resolve({ data: lista, error: null });
      },

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

  /* Wgrywanie zdjęć produktu. Na podglądzie plik zostaje w pamięci karty
     jako blob: — recenzent widzi efekt, a nic nie leci na żaden serwer. */
  var PLIKI = {};

  function magazyn() {
    return {
      upload: function (sciezka, plik) {
        PLIKI[sciezka] = URL.createObjectURL(plik);
        return Promise.resolve({ data: { path: sciezka }, error: null });
      },
      getPublicUrl: function (sciezka) {
        return { data: { publicUrl: PLIKI[sciezka] || '' } };
      }
    };
  }

  window.supabaseClient = {
    from: zapytanie,
    storage: { from: magazyn },

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
