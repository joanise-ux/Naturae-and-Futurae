/* ==========================================================================
   Nature & Future — nf-admin.js
   Wspólny runtime siedmiu widoków panelu administratora
   (docs/design-system.md, rozdz. 8A). Jeden plik dla wszystkich stron;
   widok wybiera się atrybutem data-view na <body>.

   Zastępuje dashboard, który mieszkał wewnątrz sklep.html jako tryb
   `dashboardMode` jednej wielkiej strony. Tamten trzymał wygląd w atrybutach
   style, a stan w polach komponentu; ten trzyma wygląd w arkuszach systemu,
   a stan w adresie strony — każdy widok ma własny adres, więc da się go
   otworzyć w nowej karcie, wysłać komuś i cofnąć przyciskiem przeglądarki.

   Zasady, które ten plik egzekwuje:
   · wszystko za autoryzacją — niezalogowany trafia na logowanie i wraca tu;
   · ranga < 10 nie ma tu czego szukać i ląduje w panelu klienta;
   · ranga < 11 nie widzi analizy, kopii i poczty;
   · żadne dane osobowe nie idą do konsoli;
   · treść z bazy wchodzi do DOM przez textContent, nigdy przez innerHTML;
   · nic nieodwracalnego bez potwierdzenia w <dialog>;
   · stan ładowania to szkielet z HTML-a, podmieniany po nadejściu danych.

   Ukrycie pozycji menu jest wyłącznie porządkiem w interfejsie. O tym, kto
   co przeczyta i zapisze, decydują polityki RLS w bazie.

   Zależy od: supabase-js 2 + supabase-config.js (window.supabaseClient).
   ========================================================================== */

(function () {
  'use strict';

  var sb = null;
  var user = null;
  var mojaRanga = 0;

  var RANGA_PERSONELU = 10;
  var RANGA_ADMINA = 11;

  /* --- Rangi --------------------------------------------------------------
     Skala 1–11, gdzie 11 jest najwyższa. Nazwane są cztery ostatnie stopnie;
     1–7 zostają wolne na role, których jeszcze nie ma. */
  var RANGI = {
    11: 'Administrator',
    10: 'Moderator',
    9:  'Klient',
    8:  'Gość'
  };

  function nazwaRangi(r) {
    return RANGI[r] || ('Ranga ' + r);
  }

  /* Kolor stopnia — cztery odrębne barwy, jak w starym dashboardzie.
     Drabina samych zieleni (pierwsze podejście) była wewnętrznie spójna,
     ale w tabeli dwa sąsiednie stopnie różniły się od siebie o odcień
     i nie dało się ich rozpoznać kątem oka. Rangi nie są zresztą skalą
     natężenia, tylko czterema różnymi rolami.

     Mosiądz przy administratorze jest świadomym wyjątkiem od „panel bez
     mosiądzu" (8A.1): to jedyne miejsce w panelu, gdzie się pojawia.
     Kolor zostaje dodatkiem — stopień zawsze niesie też nazwę (rozdz. 10). */
  var KOLOR_RANGI = {
    11: 'var(--brass)',
    10: 'var(--rank-blue)',
    9:  'var(--brand-500)',
    8:  'var(--ink-muted)'
  };

  function kolorRangi(r) {
    return KOLOR_RANGI[r] || 'var(--ink-muted)';
  }

  /* --- Statusy (8A, zasada 3) ---------------------------------------------
     Personel widzi pięć wartości, bo tyle trzyma baza (orders_status_check).
     Klient widzi cztery — mapowanie robi nf-panel.js, w swoim miejscu. */
  var STATUSY = ['Nowe', 'W realizacji', 'Wysłane', 'Dostarczone', 'Anulowane'];

  var KLASA_STATUSU = {
    'Nowe':         'status--new',
    'W realizacji': 'status--progress',
    'Wysłane':      'status--sent',
    'Dostarczone':  'status--delivered',
    'Anulowane':    'status--cancelled'
  };

  /* Paleta wykresów jest szersza niż kropki statusów: wycinki donuta muszą
     się od siebie różnić, inaczej rysunek nic nie mówi. Legenda zawsze
     podaje słowo i liczbę, więc kolor jest dodatkiem (rozdz. 10). */
  var KOLOR_STATUSU = {
    'Nowe':         '#0B5D1E',
    'W realizacji': '#FFBE5C',
    'Wysłane':      '#76CB9A',
    'Dostarczone':  '#139A43',
    'Anulowane':    '#5A6157'
  };

  var ZIELEN = '#139A43';
  var MIOD = '#FFBE5C';

  var PLATNOSCI = ['Nieopłacone', 'Opłacone'];

  var KANALY = { online: 'Sklep online', hurtownia: 'Hurtownia', marketplace: 'Marketplace' };
  var PUNKTY = { online: 'Online', walim: 'Punkt Walim', wroclaw: 'Punkt Wrocław' };

  var KATEGORIE = { akwariowe: 'Akwariowe', sadownicze: 'Drzewa owocowe' };

  /* Tabele objęte kopią zapasową. Kolejność bezpieczna dla kluczy obcych
     przy przywracaniu: rodzice przed dziećmi. */
  var TABELE_KOPII = [
    'profiles', 'products', 'orders', 'order_items', 'guests',
    'cart_items', 'watched_products', 'site_content', 'sales_targets'
  ];

  /* Adres funkcji brzegowych bierzemy z klienta, nie z wpisanego na sztywno
     ciągu. Dzięki temu podgląd na Netlify — który dostaje zaślepkę zamiast
     klienta Supabase — nie ma jak wysłać żądania do produkcyjnej instancji;
     zwraca null, a poczta mówi wprost, że w tym trybie nie działa. */
  function funkcjeUrl() {
    var baza = sb && sb.supabaseUrl;
    return baza ? String(baza).replace(/\/+$/, '') + '/functions/v1' : null;
  }


  /* ========================================================================
     Formatowanie
     ====================================================================== */

  var kwotaFmt = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var okraglaFmt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });

  function zl(n) {
    var v = Number(n);
    return (isFinite(v) ? kwotaFmt.format(v) : '—') + ' zł';
  }

  /* Kwoty na kaflach i w wykresach idą bez groszy: przy sumie rocznej dwa
     miejsca po przecinku są szumem, a kafel ma być czytelny z odległości. */
  function zlOkr(n) {
    var v = Number(n);
    return (isFinite(v) ? okraglaFmt.format(Math.round(v)) : '—') + ' zł';
  }

  function dwie(x) { return String(x).padStart(2, '0'); }

  function data(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return dwie(d.getDate()) + '.' + dwie(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function dataGodzina(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return data(iso) + ', ' + dwie(d.getHours()) + ':' + dwie(d.getMinutes());
  }

  function rozmiar(bajty) {
    if (bajty < 1024) return bajty + ' B';
    if (bajty < 1048576) return (bajty / 1024).toFixed(1) + ' KB';
    return (bajty / 1048576).toFixed(1) + ' MB';
  }

  function inicjaly(nazwa) {
    return String(nazwa || '')
      .split(/\s+/)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .toUpperCase()
      .slice(0, 2) || '—';
  }

  /* Numer zamówienia bywa długim identyfikatorem bazy. Na liście liczy się
     rozpoznawalność, nie pełna wartość — pełną widać w szczegółach. */
  function numer(id) {
    var s = String(id == null ? '' : id);
    return s.length > 12 ? 'NF-' + s.slice(-4) : s;
  }


  /* ========================================================================
     Budowanie DOM
     el() przyjmuje tekst, nigdy HTML. Dzięki temu nazwa produktu, adres
     klienta czy temat wiadomości z zewnątrz nie mogą wstrzyknąć znacznika.
     ====================================================================== */

  function el(tag, opts, dzieci) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.text != null) n.textContent = String(opts.text);
    Object.keys(opts.attr || {}).forEach(function (k) {
      if (opts.attr[k] != null) n.setAttribute(k, String(opts.attr[k]));
    });
    Object.keys(opts.styl || {}).forEach(function (k) {
      n.style.setProperty(k, String(opts.styl[k]));
    });
    (dzieci || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attr, dzieci) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attr || {}).forEach(function (k) {
      if (attr[k] != null) n.setAttribute(k, String(attr[k]));
    });
    (dzieci || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function statusEl(s) {
    var nazwa = s || 'Nowe';
    return el('span', { cls: 'status ' + (KLASA_STATUSU[nazwa] || ''), text: nazwa });
  }

  function platnoscEl(p) {
    var oplacone = !/Nieop/i.test(p || 'Nieopłacone');
    return el('span', {
      cls: 'status ' + (oplacone ? 'status--delivered' : 'status--progress'),
      text: oplacone ? 'Opłacone' : 'Nieopłacone'
    });
  }

  function podmien(id, wezel) {
    var slot = document.getElementById(id);
    if (!slot) return;
    slot.textContent = '';
    slot.removeAttribute('aria-busy');
    if (wezel) slot.appendChild(wezel);
  }

  /* Stan pusty jest zaprojektowany, nie domyślny (8A, zasada 1): jedno
     zdanie, co się tu pojawi, i najwyżej jedno wyjście. */
  function pusty(zdanie, etykieta, href) {
    return el('div', { cls: 'empty' }, [
      el('p', { text: zdanie }),
      href ? el('a', { cls: 'btn btn--secondary', text: etykieta, attr: { href: href } }) : null
    ]);
  }

  /* Błąd wczytania mówi, co się stało, bez treści odpowiedzi z serwera —
     ta potrafi nieść dane rekordu. */
  function bladWczytania(id) {
    podmien(id, el('div', { cls: 'empty' }, [
      el('p', { text: 'Nie udało się wczytać danych. Odśwież stronę albo spróbuj za chwilę.' })
    ]));
  }

  function notatka(id, tekst, blad) {
    var p = document.getElementById(id);
    if (!p) return;
    p.textContent = tekst || '';
    p.classList.toggle('form-note--error', !!blad);
  }


  /* ========================================================================
     Modal potwierdzenia (8A, zasada 4)
     <dialog> daje pułapkę focusu i Esc bez linijki kodu. Focus wraca na
     element, z którego modal otwarto.
     ====================================================================== */

  function potwierdz(opts) {
    var dlg = document.getElementById('panelModal');
    if (!dlg) { opts.onPotwierdz(); return; }

    var wracaDo = document.activeElement;

    dlg.querySelector('[data-modal-title]').textContent = opts.tytul;
    dlg.querySelector('[data-modal-body]').textContent = opts.opis || '';

    var tak = dlg.querySelector('[data-modal-confirm]');
    var nie = dlg.querySelector('[data-modal-cancel]');
    tak.textContent = opts.czasownik;
    nie.textContent = opts.anuluj || 'Zachowaj';

    function sprzataj() {
      tak.removeEventListener('click', naTak);
      dlg.removeEventListener('close', sprzataj);
      if (wracaDo && wracaDo.focus) wracaDo.focus();
    }
    function naTak() { dlg.close(); opts.onPotwierdz(); }

    tak.addEventListener('click', naTak);
    dlg.addEventListener('close', sprzataj);
    dlg.showModal();
  }


  /* ========================================================================
     Eksport do CSV
     Separator średnik i BOM UTF-8 — polski Excel otwiera taki plik bez
     kreatora importu i nie gubi ogonków.
     ====================================================================== */

  function wierszCSV(pola) {
    return pola.map(function (v) {
      var s = (v == null) ? '' : String(v);
      if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(';');
  }

  function budujCSV(naglowki, wiersze) {
    return [naglowki].concat(wiersze).map(wierszCSV).join('\r\n');
  }

  function pobierzPlik(nazwa, tresc, typ) {
    var blob = new Blob([tresc], { type: typ });
    var url = URL.createObjectURL(blob);
    var a = el('a', { attr: { href: url, download: nazwa } });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return blob.size;
  }

  function pobierzCSV(nazwa, tresc) {
    return pobierzPlik(nazwa + '.csv', '﻿' + tresc, 'text/csv;charset=utf-8;');
  }

  /* Liczba dla arkusza: przecinek dziesiętny, bez separatora tysięcy. */
  function liczbaCSV(v) {
    return (Math.round((Number(v) || 0) * 100) / 100).toString().replace('.', ',');
  }


  /* ========================================================================
     Dane
     Każdy widok pobiera tylko to, czego potrzebuje. Stary dashboard ciągnął
     wszystkie tabele przy każdym wejściu, bo miał jeden wspólny stan.
     ====================================================================== */

  function produkty() { return sb.from('products').select('*'); }
  function profile() { return sb.from('profiles').select('*'); }
  function goscie() { return sb.from('guests').select('*'); }
  function cele() { return sb.from('sales_targets').select('*'); }
  function pozycje() { return sb.from('order_items').select('*'); }

  function zamowienia() {
    return sb.from('orders').select('*').order('created_at', { ascending: false });
  }

  function wynik(r) { return (r && r.data) || []; }

  /* Kto stoi za zamówieniem: konto, gość albo migawka adresu zapisana
     przy składaniu. Kolejność źródeł jest ta sama, co w starym panelu. */
  function klientZamowienia(o, profileWgId) {
    var snap = o.address_snapshot || {};
    var prof = o.user_id ? profileWgId[o.user_id] : null;
    var gosc = !o.user_id;

    var nazwa = o.guest_name || snap.full_name || snap.name ||
      (prof && prof.full_name) || (gosc ? 'Gość' : 'Klient');
    var mail = o.guest_email || snap.email || (prof && prof.email) || '';
    var tel = o.guest_phone || snap.phone || (prof && prof.phone) || '';
    var adres = [snap.street, [snap.postal, snap.city].filter(Boolean).join(' ')]
      .filter(Boolean).join(', ');

    return {
      nazwa: nazwa,
      kontakt: [mail, tel].filter(Boolean).join(' · '),
      adres: adres,
      typ: gosc ? 'Gość' : 'Konto'
    };
  }

  function indeksuj(lista, klucz) {
    var mapa = {};
    lista.forEach(function (x) { mapa[x[klucz]] = x; });
    return mapa;
  }

  /* Pozycje zamówienia jako jedno zdanie: „Anubias ×3, Mech ×2”. */
  function opisPozycji(lista) {
    if (!lista || !lista.length) return '—';
    return lista.map(function (i) { return (i.name || '—') + ' ×' + (i.qty || 0); }).join(', ');
  }


  /* ========================================================================
     WIDOK 1 — Przegląd (admin-nf.html)
     ====================================================================== */

  function widokPrzeglad() {
    var dzis = document.getElementById('dzisiaj');
    if (dzis) {
      dzis.textContent = new Date().toLocaleDateString('pl-PL',
        { weekday: 'long', day: 'numeric', month: 'long' });
    }

    Promise.all([zamowienia(), produkty(), profile(), pozycje()])
      .then(function (r) {
        var lista = wynik(r[0]);
        var prod = wynik(r[1]);
        var osoby = wynik(r[2]);
        var poz = wynik(r[3]);

        var przychod = lista.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
        var klienci = osoby.filter(function (u) { return (Number(u.rank) || 9) === 9; });

        wpiszKafel('statZamowienia', lista.length);
        wpiszKafel('statProdukty', prod.filter(function (p) { return (Number(p.stock) || 0) > 0; }).length);
        wpiszKafel('statKlienci', klienci.length);
        wpiszKafel('statPrzychod', zlOkr(przychod));

        var kafle = document.getElementById('kafle');
        if (kafle) kafle.removeAttribute('aria-busy');

        rysujOstatnie(lista, poz, indeksuj(osoby, 'id'));
        rysujUwage(lista);
      })
      .catch(function () {
        bladWczytania('slotOstatnie');
        bladWczytania('slotUwaga');
      });

    function wpiszKafel(id, wartosc) {
      var p = document.getElementById(id);
      if (!p) return;
      p.classList.remove('skeleton', 'skeleton--line');
      p.textContent = String(wartosc);
    }

    function rysujOstatnie(lista, poz, profileWgId) {
      if (!lista.length) {
        podmien('slotOstatnie', pusty('Nie ma jeszcze żadnych zamówień. Pierwsze pojawi się tu w chwili złożenia.'));
        return;
      }

      var pozWgZamowienia = {};
      poz.forEach(function (i) {
        (pozWgZamowienia[i.order_id] = pozWgZamowienia[i.order_id] || []).push(i);
      });

      var tbody = el('tbody');
      lista.slice(0, 5).forEach(function (o) {
        var k = klientZamowienia(o, profileWgId);
        tbody.appendChild(el('tr', {}, [
          el('td', { cls: 'num', text: numer(o.id), attr: { 'data-label': 'Zamówienie' } }),
          el('td', { attr: { 'data-label': 'Klient' } }, [
            el('div', { cls: 'cell-lines' }, [
              el('span', { text: k.nazwa }),
              el('span', { cls: 'cell-lines__sub num', text: k.kontakt || '—' })
            ])
          ]),
          el('td', { cls: 'small', text: opisPozycji(pozWgZamowienia[o.id]), attr: { 'data-label': 'Pozycje' } }),
          el('td', { cls: 'num td--right', text: zl(o.total), attr: { 'data-label': 'Kwota' } }),
          el('td', { attr: { 'data-label': 'Status' } }, [statusEl(o.status)])
        ]));
      });

      podmien('slotOstatnie', el('div', { cls: 'table-wrap panel-card section--light' }, [
        el('table', { cls: 'table' }, [
          el('caption', { cls: 'visually-hidden', text: 'Pięć ostatnich zamówień' }),
          el('thead', {}, [el('tr', {}, [
            el('th', { text: 'Zamówienie', attr: { scope: 'col' } }),
            el('th', { text: 'Klient', attr: { scope: 'col' } }),
            el('th', { text: 'Pozycje', attr: { scope: 'col' } }),
            el('th', { cls: 'th--right', text: 'Kwota', attr: { scope: 'col' } }),
            el('th', { text: 'Status', attr: { scope: 'col' } })
          ])]),
          tbody
        ])
      ]));
    }

    /* „Wymaga uwagi” nie powtarza tabeli, tylko liczy dwie rzeczy, po które
       personel wchodzi do panelu, i prowadzi do widoku z pełnymi danymi. */
    function rysujUwage(lista) {
      var nowe = lista.filter(function (o) { return /^Now/i.test(o.status || ''); }).length;
      var nieoplacone = lista.filter(function (o) { return /Nieop/i.test(o.payment || 'Nieopłacone'); });
      var doZaplaty = nieoplacone.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);

      var slot = document.getElementById('slotUwaga');
      if (!slot) return;
      slot.textContent = '';
      slot.removeAttribute('aria-busy');

      if (!nowe && !nieoplacone.length) {
        slot.appendChild(el('p', { cls: 'muted', text: 'Nic nie czeka: każde zamówienie ma nadany bieg i jest opłacone.' }));
        return;
      }

      if (nowe) {
        slot.appendChild(el('p', {}, [
          document.createTextNode('Nowych zamówień bez nadanego biegu: '),
          el('b', { cls: 'num', text: String(nowe) }),
          document.createTextNode('.')
        ]));
      }
      if (nieoplacone.length) {
        slot.appendChild(el('p', {}, [
          document.createTextNode('Nieopłaconych: '),
          el('b', { cls: 'num', text: String(nieoplacone.length) }),
          document.createTextNode(' na kwotę '),
          el('b', { cls: 'num', text: zl(doZaplaty) }),
          document.createTextNode('.')
        ]));
      }
      slot.appendChild(el('a', {
        cls: 'btn btn--secondary btn--small',
        text: 'Przejdź do zamówień',
        attr: { href: 'admin-zamowienia-nf.html' }
      }));
    }
  }


  /* ========================================================================
     WIDOK 2 — Produkty (admin-produkty-nf.html)
     ====================================================================== */

  function widokProdukty() {
    var wszystkie = [];
    var filtrKat = document.getElementById('filtrKategoria');
    var filtrDost = document.getElementById('filtrDostepnosc');

    produkty().then(function (r) {
      if (r.error) return bladWczytania('slotProdukty');
      wszystkie = wynik(r);

      /* Opcje kategorii biorą się z danych, nie z listy wpisanej ręcznie —
         nowa kategoria w bazie pojawia się w filtrze sama. */
      if (filtrKat) {
        var kategorie = [];
        wszystkie.forEach(function (p) {
          if (p.category && kategorie.indexOf(p.category) === -1) kategorie.push(p.category);
        });
        kategorie.forEach(function (c) {
          filtrKat.appendChild(el('option', { text: KATEGORIE[c] || c, attr: { value: c } }));
        });
        filtrKat.addEventListener('change', rysuj);
      }
      if (filtrDost) filtrDost.addEventListener('change', rysuj);

      rysuj();
    }).catch(function () { bladWczytania('slotProdukty'); });

    function widoczne() {
      var kat = filtrKat ? filtrKat.value : '';
      var dost = filtrDost ? filtrDost.value : '';
      return wszystkie.filter(function (p) {
        if (kat && p.category !== kat) return false;
        var ma = (Number(p.stock) || 0) > 0;
        if (dost === 'tak' && !ma) return false;
        if (dost === 'nie' && ma) return false;
        return true;
      });
    }

    function rysuj() {
      var lista = widoczne();

      var licznik = document.getElementById('licznikProduktow');
      if (licznik) {
        licznik.textContent = lista.length === wszystkie.length
          ? lista.length + ' z ' + wszystkie.length
          : lista.length + ' z ' + wszystkie.length + ' po filtrze';
      }

      if (!wszystkie.length) {
        podmien('slotProdukty', pusty('W bazie nie ma jeszcze żadnego produktu.'));
        return;
      }
      if (!lista.length) {
        podmien('slotProdukty', pusty('Żaden produkt nie pasuje do wybranego filtra.'));
        return;
      }

      var siatka = el('div', { cls: 'listing', styl: { '--listing-cols': String(Math.min(3, lista.length)) } });
      lista.forEach(function (p) { siatka.appendChild(kartaProduktu(p)); });
      podmien('slotProdukty', siatka);
    }

    function kartaProduktu(p) {
      var dostepny = (Number(p.stock) || 0) > 0;

      var zdjecie = el('div', { cls: 'card__photo' }, [
        p.image
          ? el('img', { attr: { src: p.image, alt: '', loading: 'lazy', decoding: 'async' } })
          : el('div', { cls: 'skeleton skeleton--block', attr: { 'aria-hidden': 'true' } }),
        el('span', { cls: 'tag', text: KATEGORIE[p.category] || p.category || 'Bez kategorii' }),
        el('span', {
          cls: 'stock' + (dostepny ? '' : ' stock--out'),
          text: dostepny ? 'Dostępny · ' + p.stock + ' szt.' : 'Niedostępny'
        })
      ]);

      var edytuj = el('button', { cls: 'btn btn--secondary btn--small', text: 'Edytuj', attr: { type: 'button' } });
      edytuj.addEventListener('click', function () { otworzEdycje(p, edytuj); });

      var przelacz = el('button', {
        cls: 'btn btn--secondary btn--small',
        text: dostepny ? 'Ukryj w sklepie' : 'Przywróć do sprzedaży',
        attr: { type: 'button' }
      });
      przelacz.addEventListener('click', function () { przelaczDostepnosc(p, przelacz); });

      return el('article', { cls: 'card section--light' }, [
        zdjecie,
        el('div', { cls: 'card__body' }, [
          p.latin ? el('span', { cls: 'latin', text: p.latin }) : null,
          el('h3', { cls: 'specimen-name', text: p.name || 'Bez nazwy' }),
          el('p', { cls: 'small muted', text: p.description || '' }),
          el('div', { cls: 'card__foot' }, [
            el('p', { cls: 'price num', text: zl(p.price) })
          ]),
          el('div', { cls: 'card__actions' }, [edytuj, przelacz])
        ])
      ]);
    }

    /* Ukrycie produktu jest odwracalne jednym kliknięciem, więc nie budzi
       modala (8A, zasada 4 mówi o tym, co znika). Przycisk mówi jednak, co
       zrobi, a nie „OK”. */
    function przelaczDostepnosc(p, przycisk) {
      var byl = Number(p.stock) || 0;
      var nowy = byl > 0 ? 0 : 10;

      przycisk.disabled = true;
      sb.from('products').update({ stock: nowy }).eq('id', p.id).then(function (r) {
        przycisk.disabled = false;
        if (r && r.error) { przycisk.textContent = 'Spróbuj ponownie'; return; }
        p.stock = nowy;
        rysuj();
      }).catch(function () {
        przycisk.disabled = false;
        przycisk.textContent = 'Spróbuj ponownie';
      });
    }

    /* --- Edycja produktu -------------------------------------------------
       Formularz zapisuje się jawnie (8A, zasada 7): „Zapisz zmiany” jest
       nieaktywne, dopóki nic się nie zmieniło. */

    var dlg = document.getElementById('modalProduktu');
    var form = document.getElementById('formProduktu');
    var zapisz = document.getElementById('zapiszProdukt');
    var podglad = document.getElementById('polePodglad');
    var usunZdj = document.getElementById('usunZdjecie');
    var edytowany = null;
    var wyjsciowe = null;
    var adresZdjecia = '';
    var wracaDo = null;

    function stanFormularza() {
      return {
        nazwa: document.getElementById('poleNazwa').value.trim(),
        opis: document.getElementById('poleOpis').value.trim(),
        cena: document.getElementById('poleCena').value.trim(),
        koszt: document.getElementById('poleKoszt').value.trim(),
        kategoria: document.getElementById('poleKategoria').value,
        dostepny: document.getElementById('poleDostepny').checked,
        zdjecie: adresZdjecia
      };
    }

    function sprawdzZmiany() {
      if (!zapisz || !wyjsciowe) return;
      var teraz = stanFormularza();
      var zmiana = Object.keys(teraz).some(function (k) { return teraz[k] !== wyjsciowe[k]; });
      zapisz.disabled = !zmiana;
    }

    function pokazZdjecie() {
      if (!podglad) return;
      podglad.hidden = !adresZdjecia;
      if (adresZdjecia) podglad.setAttribute('src', adresZdjecia);
      if (usunZdj) usunZdj.hidden = !adresZdjecia;
    }

    function otworzEdycje(p, zrodlo) {
      if (!dlg) return;
      edytowany = p;
      wracaDo = zrodlo;
      adresZdjecia = p.image || '';

      document.getElementById('poleNazwa').value = p.name || '';
      document.getElementById('poleOpis').value = p.description || '';
      document.getElementById('poleCena').value = p.price != null ? String(p.price) : '';
      document.getElementById('poleKoszt').value = p.cost != null ? String(p.cost) : '';
      document.getElementById('poleKategoria').value = p.category || 'akwariowe';
      document.getElementById('poleDostepny').checked = (Number(p.stock) || 0) > 0;

      pokazZdjecie();
      notatka('notatkaProduktu', '');
      wyjsciowe = stanFormularza();
      if (zapisz) zapisz.disabled = true;
      dlg.showModal();
    }

    if (form) {
      form.addEventListener('input', sprawdzZmiany);
      form.addEventListener('change', sprawdzZmiany);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!edytowany) return;

        var f = stanFormularza();
        if (!f.nazwa) { notatka('notatkaProduktu', 'Podaj nazwę produktu.', true); return; }

        var cena = parseFloat(f.cena);
        if (!isFinite(cena) || cena < 0) { notatka('notatkaProduktu', 'Podaj poprawną cenę.', true); return; }

        var koszt = f.koszt === '' ? 0 : parseFloat(f.koszt);
        if (!isFinite(koszt) || koszt < 0) { notatka('notatkaProduktu', 'Podaj poprawny koszt.', true); return; }

        /* Ukrycie produktu nie kasuje stanu magazynowego — po przywróceniu
           wraca ten sam, a nie dziesięć sztuk z powietrza. */
        var byl = Number(edytowany.stock) || 0;
        var stock = f.dostepny ? (byl > 0 ? byl : 10) : 0;

        zapisz.disabled = true;
        notatka('notatkaProduktu', 'Zapisuję…');

        sb.from('products').update({
          name: f.nazwa,
          description: f.opis,
          price: cena,
          cost: koszt,
          category: f.kategoria,
          image: f.zdjecie || null,
          stock: stock
        }).eq('id', edytowany.id).then(function (r) {
          if (r && r.error) {
            zapisz.disabled = false;
            notatka('notatkaProduktu', 'Nie udało się zapisać. Spróbuj jeszcze raz.', true);
            return;
          }
          Object.assign(edytowany, {
            name: f.nazwa, description: f.opis, price: cena, cost: koszt,
            category: f.kategoria, image: f.zdjecie || null, stock: stock
          });
          wyjsciowe = stanFormularza();
          notatka('notatkaProduktu', 'Zapisano.');
          rysuj();
          dlg.close();
        }).catch(function () {
          zapisz.disabled = false;
          notatka('notatkaProduktu', 'Nie udało się zapisać. Spróbuj jeszcze raz.', true);
        });
      });
    }

    var zamknij = document.getElementById('zamknijProdukt');
    if (zamknij && dlg) zamknij.addEventListener('click', function () { dlg.close(); });
    if (dlg) {
      dlg.addEventListener('close', function () {
        if (wracaDo && wracaDo.focus) wracaDo.focus();
        wracaDo = null;
      });
    }

    if (usunZdj) {
      usunZdj.addEventListener('click', function () {
        adresZdjecia = '';
        pokazZdjecie();
        sprawdzZmiany();
      });
    }

    var pole = document.getElementById('poleZdjecie');
    if (pole) {
      pole.addEventListener('change', function () {
        var plik = pole.files && pole.files[0];
        if (!plik || !edytowany) return;

        notatka('notatkaProduktu', 'Wgrywam zdjęcie…');
        var ext = (plik.name.split('.').pop() || 'jpg').toLowerCase();
        var sciezka = edytowany.id + '-' + Date.now() + '.' + ext;

        sb.storage.from('product-images').upload(sciezka, plik, { upsert: true, contentType: plik.type })
          .then(function (r) {
            if (r && r.error) { notatka('notatkaProduktu', 'Nie udało się wgrać zdjęcia.', true); return; }
            var pub = sb.storage.from('product-images').getPublicUrl(sciezka);
            adresZdjecia = (pub && pub.data && pub.data.publicUrl) || '';
            pokazZdjecie();
            sprawdzZmiany();
            notatka('notatkaProduktu', 'Zdjęcie wgrane. Zapisz zmiany, żeby je przypiąć do produktu.');
          })
          .catch(function () { notatka('notatkaProduktu', 'Nie udało się wgrać zdjęcia.', true); });
      });
    }
  }


  /* ========================================================================
     WIDOK 3 — Zamówienia (admin-zamowienia-nf.html)
     ====================================================================== */

  function widokZamowienia() {
    var wszystkie = [];
    var pozWgZamowienia = {};
    var profileWgId = {};

    var filtrStatus = document.getElementById('filtrStatus');
    var filtrPlatnosc = document.getElementById('filtrPlatnosc');

    if (filtrStatus) {
      STATUSY.forEach(function (s) {
        filtrStatus.appendChild(el('option', { text: s, attr: { value: s } }));
      });
      filtrStatus.addEventListener('change', rysuj);
    }
    if (filtrPlatnosc) filtrPlatnosc.addEventListener('change', rysuj);

    Promise.all([zamowienia(), pozycje(), profile(), goscie()])
      .then(function (r) {
        wszystkie = wynik(r[0]);
        wynik(r[1]).forEach(function (i) {
          (pozWgZamowienia[i.order_id] = pozWgZamowienia[i.order_id] || []).push(i);
        });
        profileWgId = indeksuj(wynik(r[2]).concat(wynik(r[3])), 'id');
        rysuj();
      })
      .catch(function () { bladWczytania('slotTabela'); });

    function rysuj() {
      var st = filtrStatus ? filtrStatus.value : '';
      var pl = filtrPlatnosc ? filtrPlatnosc.value : '';

      var lista = wszystkie.filter(function (o) {
        if (st && (o.status || 'Nowe') !== st) return false;
        if (pl) {
          var oplacone = !/Nieop/i.test(o.payment || 'Nieopłacone');
          if (pl === 'Opłacone' && !oplacone) return false;
          if (pl === 'Nieopłacone' && oplacone) return false;
        }
        return true;
      });

      var licznik = document.getElementById('licznikZamowien');
      if (licznik) {
        licznik.textContent = lista.length === wszystkie.length
          ? lista.length + ' z ' + wszystkie.length
          : lista.length + ' z ' + wszystkie.length + ' po filtrze';
      }

      if (!wszystkie.length) {
        podmien('slotTabela', pusty('Nie ma jeszcze żadnych zamówień. Pierwsze pojawi się tu w chwili złożenia.'));
        return;
      }
      if (!lista.length) {
        podmien('slotTabela', pusty('Żadne zamówienie nie pasuje do wybranego filtra.'));
        return;
      }

      var tbody = el('tbody');
      lista.forEach(function (o) { tbody.appendChild(wiersz(o)); });

      podmien('slotTabela', el('div', { cls: 'table-wrap panel-card section--light' }, [
        el('table', { cls: 'table' }, [
          el('caption', { cls: 'visually-hidden', text: 'Zamówienia' }),
          el('thead', {}, [el('tr', {}, [
            el('th', { text: 'Zamówienie', attr: { scope: 'col' } }),
            el('th', { text: 'Klient', attr: { scope: 'col' } }),
            el('th', { text: 'Pozycje', attr: { scope: 'col' } }),
            el('th', { cls: 'th--right', text: 'Kwota', attr: { scope: 'col' } }),
            el('th', { text: 'Data', attr: { scope: 'col' } }),
            el('th', { text: 'Kanał i punkt', attr: { scope: 'col' } }),
            el('th', { text: 'Status', attr: { scope: 'col' } }),
            el('th', { text: 'Płatność', attr: { scope: 'col' } })
          ])]),
          tbody
        ])
      ]));
    }

    function wiersz(o) {
      var k = klientZamowienia(o, profileWgId);

      return el('tr', {}, [
        el('td', { cls: 'num', text: numer(o.id), attr: { 'data-label': 'Zamówienie' } }),
        el('td', { attr: { 'data-label': 'Klient' } }, [
          el('div', { cls: 'cell-lines' }, [
            el('span', { text: k.nazwa }),
            el('span', { cls: 'cell-lines__sub num', text: k.kontakt || '—' }),
            el('span', { cls: 'cell-lines__sub', text: k.adres || 'Bez adresu wysyłki' })
          ])
        ]),
        el('td', { cls: 'small', text: opisPozycji(pozWgZamowienia[o.id]), attr: { 'data-label': 'Pozycje' } }),
        el('td', { cls: 'num td--right', text: zl(o.total), attr: { 'data-label': 'Kwota' } }),
        el('td', { cls: 'num', text: data(o.created_at), attr: { 'data-label': 'Data' } }),
        el('td', { attr: { 'data-label': 'Kanał i punkt' } }, [
          el('div', { cls: 'cell-stack' }, [
            wybor(o, 'channel', KANALY, o.channel || 'online', 'Kanał sprzedaży', false),
            wybor(o, 'location', PUNKTY, o.location || '', 'Punkt odbioru', true)
          ])
        ]),
        el('td', { attr: { 'data-label': 'Status' } }, [
          wyborListy(o, 'status', STATUSY, o.status || 'Nowe', 'Status zamówienia')
        ]),
        el('td', { attr: { 'data-label': 'Płatność' } }, [
          wyborListy(o, 'payment', PLATNOSCI, o.payment || 'Nieopłacone', 'Stan płatności')
        ])
      ]);
    }

    function wyborListy(o, pole, opcje, wybrana, etykieta) {
      var mapa = {};
      opcje.forEach(function (v) { mapa[v] = v; });
      return wybor(o, pole, mapa, wybrana, etykieta, false);
    }

    /* Zmiana leci do bazy od razu, bez przycisku „Zapisz”: to jedno pole,
       a nie formularz, i jest odwracalna wyborem poprzedniej wartości.
       Wynik pojawia się przy tabeli, nie jako znikający komunikat w rogu. */
    function wybor(o, pole, opcje, wybrana, etykieta, pustaOpcja) {
      var s = el('select', {
        cls: 'input cell-select',
        attr: { 'aria-label': etykieta + ' — zamówienie ' + numer(o.id) }
      });

      if (pustaOpcja) s.appendChild(el('option', { text: 'Punkt: —', attr: { value: '' } }));
      Object.keys(opcje).forEach(function (v) {
        s.appendChild(el('option', { text: opcje[v], attr: { value: v } }));
      });
      s.value = wybrana;

      s.addEventListener('change', function () {
        var poprzednia = wybrana;
        var nowa = s.value;
        s.disabled = true;

        var zmiana = {};
        zmiana[pole] = nowa;

        sb.from('orders').update(zmiana).eq('id', o.id).then(function (r) {
          s.disabled = false;
          if (r && r.error) {
            s.value = poprzednia;
            notatka('notatkaZamowien', 'Nie udało się zapisać zmiany w zamówieniu ' + numer(o.id) + '.', true);
            return;
          }
          wybrana = nowa;
          o[pole] = nowa;
          notatka('notatkaZamowien', 'Zapisano zmianę w zamówieniu ' + numer(o.id) + '.');
          dziennik(pole === 'payment' ? 'order_payment' : 'order_' + pole, o.id, { z: poprzednia, na: nowa });
        }).catch(function () {
          s.disabled = false;
          s.value = poprzednia;
          notatka('notatkaZamowien', 'Nie udało się zapisać zmiany w zamówieniu ' + numer(o.id) + '.', true);
        });
      });

      return s;
    }
  }


  /* ========================================================================
     WIDOK 4 — Użytkownicy (admin-uzytkownicy-nf.html)
     ====================================================================== */

  function widokUzytkownicy() {
    rysujSkale();

    Promise.all([profile(), goscie()])
      .then(function (r) {
        var osoby = wynik(r[0]).map(function (u) {
          return { id: u.id, nazwa: u.full_name, mail: u.email, ranga: Number(u.rank) || 9, gosc: false };
        });
        /* Zamówienia bez konta pokazujemy jako rangę 8, tylko do odczytu:
           gość nie ma profilu, więc nie ma czego zmieniać. */
        var bezKonta = wynik(r[1]).map(function (g) {
          return { id: 'guest:' + g.id, nazwa: g.full_name, mail: g.email, ranga: 8, gosc: true };
        });
        rysuj(osoby.concat(bezKonta));
      })
      .catch(function () { bladWczytania('slotTabela'); });

    function rysujSkale() {
      var ul = document.getElementById('skalaRang');
      if (!ul) return;
      for (var r = 11; r >= 1; r--) {
        var wolna = r <= 7;
        ul.appendChild(el('li', {}, [
          el('span', {
            cls: 'rank-chip' + (wolna ? ' rank-chip--free' : ''),
            styl: wolna ? {} : { '--rank-color': kolorRangi(r) },
            attr: { title: wolna ? 'Stopień zarezerwowany' : nazwaRangi(r) }
          }, [
            el('b', { cls: 'num', text: String(r) }),
            el('span', { text: wolna ? 'Wolna' : nazwaRangi(r) })
          ])
        ]));
      }
    }

    function rysuj(lista) {
      lista.sort(function (a, b) { return b.ranga - a.ranga; });

      var licznik = document.getElementById('licznikUzytkownikow');
      if (licznik) licznik.textContent = lista.length + (lista.length === 1 ? ' konto' : ' kont');

      if (!lista.length) {
        podmien('slotTabela', pusty('Nie ma jeszcze żadnych kont.'));
        return;
      }

      var tbody = el('tbody');
      lista.forEach(function (u) { tbody.appendChild(wiersz(u)); });

      podmien('slotTabela', el('div', { cls: 'table-wrap panel-card section--light' }, [
        el('table', { cls: 'table' }, [
          el('caption', { cls: 'visually-hidden', text: 'Konta i rangi' }),
          el('thead', {}, [el('tr', {}, [
            el('th', { text: 'Osoba', attr: { scope: 'col' } }),
            el('th', { text: 'E-mail', attr: { scope: 'col' } }),
            el('th', { text: 'Ranga', attr: { scope: 'col' } })
          ])]),
          tbody
        ])
      ]));
    }

    function wiersz(u) {
      var nazwa = u.nazwa || (u.mail || '').split('@')[0] || '—';

      /* Kto może komu zmienić rangę: personel edytuje ściśle niższych,
         administrator także równych sobie, nikt nie edytuje samego siebie,
         a gość nie ma profilu do zmiany. To sito jest tu dla wygody —
         właściwą granicę stawiają polityki RLS. */
      var wolno = !u.gosc &&
        mojaRanga >= RANGA_PERSONELU &&
        u.id !== (user && user.id) &&
        (mojaRanga > u.ranga || mojaRanga >= RANGA_ADMINA);

      return el('tr', {}, [
        el('td', { attr: { 'data-label': 'Osoba' } }, [
          el('div', { cls: 'cell-lines' }, [
            el('span', { text: nazwa }),
            u.gosc ? el('span', { cls: 'cell-lines__sub', text: 'Zamówienie bez konta' }) : null
          ])
        ]),
        el('td', { cls: 'num', text: u.mail || '—', attr: { 'data-label': 'E-mail' } }),
        el('td', { attr: { 'data-label': 'Ranga' } }, [
          el('span', { cls: 'cell-rank', styl: { '--rank-color': kolorRangi(u.ranga) } }, [
            el('span', { cls: 'rank-dot', attr: { 'aria-hidden': 'true' } }),
            wolno ? polaRangi(u, nazwa) : el('span', { text: nazwaRangi(u.ranga) })
          ])
        ])
      ]);
    }

    function polaRangi(u, nazwa) {
      var select = el('select', {
        cls: 'input cell-select',
        attr: { 'aria-label': 'Ranga — ' + nazwa }
      });

      /* Nie da się nadać rangi wyższej niż własna. */
      [11, 10, 9, 8].filter(function (r) { return r <= mojaRanga; }).forEach(function (r) {
        select.appendChild(el('option', { text: r + ' · ' + nazwaRangi(r), attr: { value: String(r) } }));
      });
      select.value = String(u.ranga);

      /* Zmiana rangi potrafi odebrać komuś dostęp do panelu, więc jest
         nieodwracalna w sensie skutku i wymaga potwierdzenia (8A, 4). */
      select.addEventListener('change', function () {
        var nowa = parseInt(select.value, 10);
        var poprzednia = u.ranga;
        if (nowa === poprzednia) return;

        potwierdz({
          tytul: 'Zmienić rangę?',
          opis: nazwa + ' przejdzie ze stopnia ' + poprzednia + ' (' + nazwaRangi(poprzednia) +
                ') na ' + nowa + ' (' + nazwaRangi(nowa) + '). To zmienia dostęp tej osoby do panelu.',
          czasownik: 'Zmień rangę',
          anuluj: 'Zostaw jak jest',
          onPotwierdz: function () { zapisz(nowa, poprzednia); }
        });

        /* Do czasu potwierdzenia pole pokazuje stan faktyczny, a nie życzenie. */
        select.value = String(poprzednia);

        function zapisz(nowaRanga, staraRanga) {
          select.disabled = true;
          sb.from('profiles').update({ rank: nowaRanga }).eq('id', u.id).then(function (r) {
            select.disabled = false;
            if (r && r.error) {
              notatka('notatkaRang', 'Nie udało się zmienić rangi. Spróbuj jeszcze raz.', true);
              return;
            }
            u.ranga = nowaRanga;
            select.value = String(nowaRanga);
            var komorka = select.closest('.cell-rank');
            if (komorka) komorka.style.setProperty('--rank-color', kolorRangi(nowaRanga));
            notatka('notatkaRang', nazwa + ' ma teraz rangę ' + nowaRanga + ' (' + nazwaRangi(nowaRanga) + ').');
            dziennik('rank_change', u.id, { z: staraRanga, na: nowaRanga });
          }).catch(function () {
            select.disabled = false;
            notatka('notatkaRang', 'Nie udało się zmienić rangi. Spróbuj jeszcze raz.', true);
          });
        }
      });

      return select;
    }
  }


  /* ========================================================================
     WIDOK 5 — Analiza sklepu (admin-analiza-nf.html)
     ====================================================================== */

  var MIESIACE = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

  function widokAnaliza() {
    var okres = 'year';
    var dane = null;
    var sekcje = {};

    Promise.all([zamowienia(), pozycje(), produkty(), cele()])
      .then(function (r) {
        var poz = {};
        wynik(r[1]).forEach(function (i) {
          (poz[i.order_id] = poz[i.order_id] || []).push(i);
        });
        dane = {
          zamowienia: wynik(r[0]),
          pozycje: poz,
          produkty: wynik(r[2]),
          cele: wynik(r[3])
        };
        rysuj();
      })
      .catch(function () {
        ['slotTrend', 'slotRentownosc', 'slotStatusy', 'slotPlatnosci',
         'slotKategorie', 'slotKanaly', 'slotGap', 'slotPunkty', 'slotTop']
          .forEach(bladWczytania);
      });

    var przelacznik = document.getElementById('zakres');
    if (przelacznik) {
      przelacznik.addEventListener('click', function (e) {
        var b = e.target.closest('[data-okres]');
        if (!b) return;
        okres = b.getAttribute('data-okres');
        Array.prototype.forEach.call(przelacznik.querySelectorAll('[data-okres]'), function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        if (dane) rysuj();
      });
    }

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-csv]');
      if (!b) return;
      var s = sekcje[b.getAttribute('data-csv')];
      if (s) pobierzCSV(s.nazwa, budujCSV(s.naglowki, s.wiersze));
    });

    var wszystko = document.getElementById('pobierzWszystko');
    if (wszystko) {
      wszystko.addEventListener('click', function () {
        var bloki = Object.keys(sekcje).map(function (k) {
          var s = sekcje[k];
          return wierszCSV([s.tytul.toUpperCase()]) + '\r\n' + budujCSV(s.naglowki, s.wiersze);
        });
        pobierzCSV('analiza-sklepu_' + kluczOkresu(okres), bloki.join('\r\n\r\n'));
      });
    }

    /* --- Zakres okresu ----------------------------------------------------
       Rok to dwanaście ostatnich miesięcy, kwartał trzy, miesiąc cztery
       tygodnie bieżącego miesiąca. Kubełki wyliczamy raz i używa ich
       zarówno wykres, jak i eksport. */
    function zakres() {
      var teraz = new Date();
      var od, kubelki;

      if (okres === 'year') {
        od = new Date(teraz.getFullYear(), teraz.getMonth() - 11, 1);
        kubelki = [];
        for (var i = 0; i < 12; i++) {
          var d = new Date(teraz.getFullYear(), teraz.getMonth() - (11 - i), 1);
          kubelki.push({
            od: d,
            do: new Date(d.getFullYear(), d.getMonth() + 1, 1),
            etykieta: MIESIACE[d.getMonth()]
          });
        }
      } else if (okres === 'quarter') {
        od = new Date(teraz.getFullYear(), teraz.getMonth() - 2, 1);
        kubelki = [];
        for (var j = 0; j < 3; j++) {
          var q = new Date(teraz.getFullYear(), teraz.getMonth() - (2 - j), 1);
          kubelki.push({
            od: q,
            do: new Date(q.getFullYear(), q.getMonth() + 1, 1),
            etykieta: MIESIACE[q.getMonth()]
          });
        }
      } else {
        od = new Date(teraz.getFullYear(), teraz.getMonth(), 1);
        kubelki = [];
        for (var w = 0; w < 4; w++) {
          kubelki.push({
            od: new Date(teraz.getFullYear(), teraz.getMonth(), 1 + w * 7),
            do: w === 3
              ? new Date(teraz.getFullYear(), teraz.getMonth() + 1, 1)
              : new Date(teraz.getFullYear(), teraz.getMonth(), 1 + (w + 1) * 7),
            etykieta: 'tydz. ' + (w + 1)
          });
        }
      }
      return { od: od, do: teraz, kubelki: kubelki };
    }

    function kluczOkresu(o) {
      var d = new Date();
      if (o === 'year') return String(d.getFullYear());
      if (o === 'quarter') return d.getFullYear() + '-Q' + (Math.floor(d.getMonth() / 3) + 1);
      return d.getFullYear() + '-' + dwie(d.getMonth() + 1);
    }

    function rysuj() {
      var z = zakres();
      var klucz = kluczOkresu(okres);
      var prodWgId = indeksuj(dane.produkty, 'id');

      var wOkresie = dane.zamowienia.filter(function (o) {
        var t = o.created_at ? new Date(o.created_at) : null;
        return t && !isNaN(t) && t >= z.od && t <= z.do;
      });

      var przychod = wOkresie.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);

      /* Koszt liczymy z pozycji zamówienia i kosztu własnego produktu.
         Bez wypełnionych kosztów marża jest nieznana — i tak właśnie
         pokazujemy ją zamiast zerowego wykresu. */
      var koszt = 0;
      wOkresie.forEach(function (o) {
        (dane.pozycje[o.id] || []).forEach(function (i) {
          var p = prodWgId[i.product_id];
          koszt += (p ? (Number(p.cost) || 0) : 0) * (Number(i.qty) || 0);
        });
      });
      var saKoszty = dane.produkty.some(function (p) { return (Number(p.cost) || 0) > 0; });
      var marza = przychod - koszt;

      sekcje = {};

      kafle(przychod, wOkresie.length, saKoszty ? zlOkr(marza) : 'brak danych');
      trend(z, wOkresie, klucz);
      rentownosc(przychod, koszt, marza, saKoszty, klucz);
      statusy(wOkresie, klucz);
      platnosci(wOkresie, klucz);
      kategorie(wOkresie, prodWgId, klucz);
      kanaly(wOkresie, klucz);
      gap(przychod, klucz);
      punkty(wOkresie, klucz);
      top(wOkresie, klucz);
    }

    function kafle(przychod, ile, marza) {
      var aktywne = dane.produkty.filter(function (p) { return (Number(p.stock) || 0) > 0; }).length;
      [['statProdukty', aktywne], ['statPrzychod', zlOkr(przychod)],
       ['statZamowienia', ile], ['statMarza', marza]].forEach(function (para) {
        var p = document.getElementById(para[0]);
        if (!p) return;
        p.classList.remove('skeleton', 'skeleton--line');
        p.textContent = String(para[1]);
      });
      var k = document.getElementById('kafle');
      if (k) k.removeAttribute('aria-busy');
    }

    /* --- Trend ----------------------------------------------------------- */
    function trend(z, wOkresie, klucz) {
      var wartosci = z.kubelki.map(function (b) {
        var w = wOkresie.filter(function (o) {
          var t = new Date(o.created_at);
          return t >= b.od && t < b.do;
        });
        return {
          etykieta: b.etykieta,
          przychod: w.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0),
          ile: w.length
        };
      });

      sekcje.trend = {
        nazwa: 'trend-przychodu_' + klucz,
        tytul: 'Trend przychodu',
        naglowki: ['Okres', 'Przychód (zł)', 'Zamówienia'],
        wiersze: wartosci.map(function (v) { return [v.etykieta, liczbaCSV(v.przychod), v.ile]; })
      };

      if (!wartosci.some(function (v) { return v.przychod > 0; })) {
        podmien('slotTrend', pusty('W tym okresie nie było sprzedaży. Wykres wypełni się sam, gdy pojawią się zamówienia.'));
        return;
      }

      var SZ = 620, WY = 220, lewy = 58, prawy = 12, gora = 16, dol = 26;
      var szer = SZ - lewy - prawy, wys = WY - gora - dol;
      var max = Math.max.apply(null, wartosci.map(function (v) { return v.przychod; })) || 1;
      var n = wartosci.length;

      function x(i) { return lewy + (n <= 1 ? szer / 2 : szer * i / (n - 1)); }
      function y(v) { return gora + wys - wys * (v / max); }

      var punktyLinii = wartosci.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v.przychod).toFixed(1); });

      var dzieci = [];
      [1, 0.5, 0].forEach(function (f) {
        dzieci.push(svg('text', {
          class: 'chart__tick', x: 6, y: (gora + wys - wys * f).toFixed(1),
          'dominant-baseline': 'middle'
        }, [document.createTextNode(zlOkr(max * f))]));
      });

      dzieci.push(svg('path', {
        class: 'chart__area',
        d: 'M' + x(0).toFixed(1) + ',' + (gora + wys).toFixed(1) +
           ' L' + punktyLinii.join(' L') +
           ' L' + x(n - 1).toFixed(1) + ',' + (gora + wys).toFixed(1) + ' Z'
      }));
      dzieci.push(svg('polyline', { class: 'chart__line', points: punktyLinii.join(' ') }));

      wartosci.forEach(function (v, i) {
        dzieci.push(svg('circle', { class: 'chart__dot', cx: x(i).toFixed(1), cy: y(v.przychod).toFixed(1), r: 3.5 }));
        dzieci.push(svg('text', {
          class: 'chart__tick', x: x(i).toFixed(1), y: WY - 6, 'text-anchor': 'middle'
        }, [document.createTextNode(v.etykieta)]));
      });

      var rysunek = svg('svg', {
        class: 'chart chart--trend', viewBox: '0 0 ' + SZ + ' ' + WY,
        role: 'img',
        'aria-label': 'Przychód w kolejnych okresach: ' +
          wartosci.map(function (v) { return v.etykieta + ' ' + zlOkr(v.przychod); }).join(', ')
      }, dzieci);

      podmien('slotTrend', rysunek);
    }

    /* --- Pierścień z jedną wartością -------------------------------------- */
    function pierscien(procent, kolor, wartosc, etykieta) {
      var r = 44, obwod = 2 * Math.PI * r;
      var dlugosc = Math.max(0, Math.min(100, procent)) / 100 * obwod;

      return el('div', { cls: 'donut' }, [
        svg('svg', { viewBox: '0 0 120 120', class: 'chart', 'aria-hidden': 'true' }, [
          svg('circle', { class: 'donut__ring donut__track', cx: 60, cy: 60, r: r }),
          svg('circle', {
            class: 'donut__ring', cx: 60, cy: 60, r: r,
            stroke: kolor, 'stroke-linecap': 'round',
            'stroke-dasharray': dlugosc.toFixed(2) + ' ' + (obwod - dlugosc).toFixed(2),
            transform: 'rotate(-90 60 60)'
          })
        ]),
        el('div', { cls: 'donut__center' }, [
          el('p', { cls: 'donut__value num', text: wartosc }),
          el('p', { cls: 'donut__label', text: etykieta })
        ])
      ]);
    }

    /* --- Pierścień wielosegmentowy + legenda ------------------------------- */
    function donut(segmenty, wartoscSrodka, etykietaSrodka) {
      var r = 52, obwod = 2 * Math.PI * r;
      var suma = segmenty.reduce(function (s, x) { return s + x.wartosc; }, 0);
      var narosle = 0;

      var kola = [svg('circle', { class: 'donut__ring donut__track', cx: 60, cy: 60, r: r })];
      segmenty.filter(function (s) { return s.wartosc > 0; }).forEach(function (s) {
        var dlugosc = (suma ? s.wartosc / suma : 0) * obwod;
        kola.push(svg('circle', {
          class: 'donut__ring', cx: 60, cy: 60, r: r, stroke: s.kolor,
          'stroke-dasharray': dlugosc.toFixed(2) + ' ' + (obwod - dlugosc).toFixed(2),
          'stroke-dashoffset': (-narosle).toFixed(2),
          transform: 'rotate(-90 60 60)'
        }));
        narosle += dlugosc;
      });

      var legenda = el('ul', { cls: 'legend' });
      segmenty.forEach(function (s) {
        legenda.appendChild(el('li', {}, [
          el('span', { cls: 'legend__dot', styl: { '--legend-dot': s.kolor }, attr: { 'aria-hidden': 'true' } }),
          el('span', { text: s.etykieta }),
          el('span', { cls: 'legend__count num', text: s.opis != null ? s.opis : String(s.wartosc) })
        ]));
      });

      return el('div', { cls: 'chart-row' }, [
        el('div', { cls: 'donut' }, [
          svg('svg', { viewBox: '0 0 120 120', class: 'chart', 'aria-hidden': 'true' }, kola),
          el('div', { cls: 'donut__center' }, [
            el('p', { cls: 'donut__value num', text: wartoscSrodka }),
            el('p', { cls: 'donut__label', text: etykietaSrodka })
          ])
        ]),
        legenda
      ]);
    }

    /* --- Słupki ----------------------------------------------------------- */
    function slupki(pozycje) {
      var max = Math.max.apply(null, pozycje.map(function (p) { return p.wartosc; })) || 1;
      var wrap = el('div', { cls: 'bars' });
      pozycje.forEach(function (p) {
        wrap.appendChild(el('div', { cls: 'bar' }, [
          el('span', { cls: 'bar__value num', text: zlOkr(p.wartosc) }),
          el('span', {
            cls: 'bar__fill',
            styl: { '--bar-h': Math.max(2, Math.round(p.wartosc / max * 140)) + 'px' },
            attr: { 'aria-hidden': 'true' }
          }),
          el('span', { cls: 'bar__label', text: p.etykieta })
        ]));
      });
      return wrap;
    }

    /* --- Rentowność -------------------------------------------------------- */
    function rentownosc(przychod, koszt, marza, saKoszty, klucz) {
      var procentZysku = przychod ? Math.round(marza / przychod * 100) : 0;
      var procentKosztu = przychod ? Math.round(koszt / przychod * 100) : 0;

      sekcje.rentownosc = {
        nazwa: 'rentownosc_' + klucz,
        tytul: 'Rentowność',
        naglowki: ['Wskaźnik', 'Wartość'],
        wiersze: [
          ['Przychód (zł)', liczbaCSV(przychod)],
          ['Koszt (zł)', liczbaCSV(koszt)],
          ['Marża brutto (zł)', liczbaCSV(marza)],
          ['Zysk (%)', procentZysku],
          ['Koszty (%)', procentKosztu]
        ]
      };

      if (!saKoszty || !przychod) {
        podmien('slotRentownosc', pusty(
          'Marża policzy się sama, gdy produkty będą miały wpisany koszt własny.',
          'Uzupełnij produkty', 'admin-produkty-nf.html'));
        return;
      }

      podmien('slotRentownosc', el('div', {}, [
        el('div', { cls: 'chart-row' }, [
          pierscien(procentZysku, ZIELEN, procentZysku + '%', 'Zysk'),
          pierscien(procentKosztu, MIOD, procentKosztu + '%', 'Koszty')
        ]),
        el('ul', { cls: 'legend' }, [
          el('li', {}, [
            el('span', { cls: 'legend__dot', styl: { '--legend-dot': ZIELEN }, attr: { 'aria-hidden': 'true' } }),
            el('span', { text: 'Marża brutto' }),
            el('span', { cls: 'legend__count num', text: zlOkr(marza) })
          ]),
          el('li', {}, [
            el('span', { cls: 'legend__dot', styl: { '--legend-dot': MIOD }, attr: { 'aria-hidden': 'true' } }),
            el('span', { text: 'Koszt własny' }),
            el('span', { cls: 'legend__count num', text: zlOkr(koszt) })
          ])
        ])
      ]));
    }

    /* --- Statusy ----------------------------------------------------------- */
    function statusy(wOkresie, klucz) {
      var segmenty = STATUSY.map(function (s) {
        return {
          etykieta: s,
          kolor: KOLOR_STATUSU[s],
          wartosc: wOkresie.filter(function (o) { return (o.status || 'Nowe') === s; }).length
        };
      });

      sekcje.statusy = {
        nazwa: 'zamowienia-wg-statusu_' + klucz,
        tytul: 'Zamówienia wg statusu',
        naglowki: ['Status', 'Liczba'],
        wiersze: segmenty.map(function (s) { return [s.etykieta, s.wartosc]; })
      };

      if (!wOkresie.length) {
        podmien('slotStatusy', pusty('W tym okresie nie było zamówień.'));
        return;
      }
      podmien('slotStatusy', donut(segmenty, String(wOkresie.length), 'zamówień'));
    }

    /* --- Płatności --------------------------------------------------------- */
    function platnosci(wOkresie, klucz) {
      var nieoplacone = wOkresie.filter(function (o) { return /Nieop/i.test(o.payment || 'Nieopłacone'); });
      var oplacone = wOkresie.length - nieoplacone.length;
      var doZaplaty = nieoplacone.reduce(function (s, o) { return s + (Number(o.total) || 0); }, 0);
      var procent = wOkresie.length ? Math.round(oplacone / wOkresie.length * 100) : 0;

      sekcje.platnosci = {
        nazwa: 'platnosci_' + klucz,
        tytul: 'Płatności',
        naglowki: ['Typ', 'Liczba', 'Wartość (zł)'],
        wiersze: [
          ['Opłacone', oplacone, ''],
          ['Nieopłacone', nieoplacone.length, liczbaCSV(doZaplaty)]
        ]
      };

      if (!wOkresie.length) {
        podmien('slotPlatnosci', pusty('W tym okresie nie było zamówień.'));
        return;
      }

      podmien('slotPlatnosci', el('div', {}, [
        donut([
          { etykieta: 'Opłacone', kolor: ZIELEN, wartosc: oplacone },
          { etykieta: 'Nieopłacone', kolor: MIOD, wartosc: nieoplacone.length }
        ], procent + '%', 'opłaconych'),
        el('p', { cls: 'muted small' }, [
          document.createTextNode('Do zapłaty: '),
          el('b', { cls: 'num', text: zl(doZaplaty) })
        ])
      ]));
    }

    /* --- Kategorie ---------------------------------------------------------- */
    function kategorie(wOkresie, prodWgId, klucz) {
      var suma = {};
      wOkresie.forEach(function (o) {
        (dane.pozycje[o.id] || []).forEach(function (i) {
          var p = prodWgId[i.product_id];
          var c = (p && p.category) || 'inne';
          suma[c] = (suma[c] || 0) + (Number(i.price) || 0) * (Number(i.qty) || 0);
        });
      });

      var pary = Object.keys(suma).map(function (c) {
        return { etykieta: KATEGORIE[c] || c, wartosc: suma[c] };
      });

      sekcje.kategorie = {
        nazwa: 'sprzedaz-wg-kategorii_' + klucz,
        tytul: 'Sprzedaż wg kategorii',
        naglowki: ['Kategoria', 'Przychód (zł)'],
        wiersze: pary.map(function (p) { return [p.etykieta, liczbaCSV(p.wartosc)]; })
      };

      if (!pary.length) {
        podmien('slotKategorie', pusty('W tym okresie nic się nie sprzedało.'));
        return;
      }
      podmien('slotKategorie', slupki(pary));
    }

    /* --- Kanały ------------------------------------------------------------- */
    function kanaly(wOkresie, klucz) {
      var suma = {};
      wOkresie.forEach(function (o) {
        var c = o.channel || 'online';
        suma[c] = (suma[c] || 0) + (Number(o.total) || 0);
      });

      var pary = Object.keys(suma).map(function (c) {
        return { etykieta: KANALY[c] || c, wartosc: suma[c] };
      });

      sekcje.kanaly = {
        nazwa: 'sprzedaz-wg-kanalow_' + klucz,
        tytul: 'Sprzedaż wg kanałów',
        naglowki: ['Kanał', 'Przychód (zł)'],
        wiersze: pary.map(function (p) { return [p.etykieta, liczbaCSV(p.wartosc)]; })
      };

      if (!pary.length) {
        podmien('slotKanaly', pusty('Oznacz kanał przy zamówieniu, a słupki wypełnią się same.',
          'Przejdź do zamówień', 'admin-zamowienia-nf.html'));
        return;
      }
      podmien('slotKanaly', slupki(pary));
    }

    /* --- Plan i wykonanie ---------------------------------------------------- */
    function gap(przychod, klucz) {
      var cel = (dane.cele || []).filter(function (t) { return t.period === klucz; })[0];
      var plan = cel ? Number(cel.amount) : 0;
      var roznica = przychod - plan;
      var procent = plan ? Math.round(przychod / plan * 100) : 0;

      sekcje.gap = {
        nazwa: 'plan-i-wykonanie_' + klucz,
        tytul: 'Plan i wykonanie',
        naglowki: ['Pozycja', 'Wartość'],
        wiersze: [
          ['Plan (zł)', liczbaCSV(plan)],
          ['Wykonanie (zł)', liczbaCSV(przychod)],
          ['Odchylenie (zł)', liczbaCSV(roznica)],
          ['Realizacja planu (%)', procent]
        ]
      };

      var pole = document.getElementById('poleCel');
      if (pole && !pole.value) pole.value = plan ? String(plan) : '';

      if (!plan) {
        podmien('slotGap', pusty('Nie ma jeszcze celu na ten okres. Wpisz go poniżej, a odchylenie policzy się samo.'));
        return;
      }

      podmien('slotGap', el('div', {}, [
        pierscien(Math.min(100, procent), roznica >= 0 ? ZIELEN : MIOD, procent + '%', 'planu'),
        el('ul', { cls: 'legend' }, [
          el('li', {}, [
            el('span', { text: 'Plan' }),
            el('span', { cls: 'legend__count num', text: zlOkr(plan) })
          ]),
          el('li', {}, [
            el('span', { text: 'Wykonanie' }),
            el('span', { cls: 'legend__count num', text: zlOkr(przychod) })
          ]),
          el('li', {}, [
            el('span', { text: roznica >= 0 ? 'Ponad plan' : 'Brakuje' }),
            el('span', { cls: 'legend__count num', text: zlOkr(Math.abs(roznica)) })
          ])
        ])
      ]));
    }

    var formCelu = document.getElementById('formCelu');
    if (formCelu) {
      formCelu.addEventListener('submit', function (e) {
        e.preventDefault();
        var pole = document.getElementById('poleCel');
        var kwota = parseFloat(pole.value);
        if (!isFinite(kwota) || kwota < 0) {
          notatka('notatkaCelu', 'Podaj kwotę celu.', true);
          return;
        }

        var przycisk = document.getElementById('zapiszCel');
        przycisk.disabled = true;
        notatka('notatkaCelu', 'Zapisuję…');

        sb.from('sales_targets')
          .upsert({ period: kluczOkresu(okres), amount: kwota, updated_by: user && user.id },
                  { onConflict: 'period' })
          .then(function (r) {
            przycisk.disabled = false;
            if (r && r.error) { notatka('notatkaCelu', 'Nie udało się zapisać celu.', true); return; }
            notatka('notatkaCelu', 'Cel zapisany.');
            dziennik('sales_target', kluczOkresu(okres), { kwota: kwota });
            return cele().then(function (c) {
              dane.cele = wynik(c);
              rysuj();
            });
          })
          .catch(function () {
            przycisk.disabled = false;
            notatka('notatkaCelu', 'Nie udało się zapisać celu.', true);
          });
      });
    }

    /* --- Punkty sprzedaży ----------------------------------------------------- */
    function punkty(wOkresie, klucz) {
      var suma = {};
      wOkresie.forEach(function (o) {
        if (!o.location) return;
        suma[o.location] = (suma[o.location] || 0) + (Number(o.total) || 0);
      });

      var pary = Object.keys(suma).map(function (l) {
        return { etykieta: PUNKTY[l] || l, wartosc: suma[l] };
      });

      sekcje.punkty = {
        nazwa: 'sprzedaz-wg-punktow_' + klucz,
        tytul: 'Sprzedaż wg punktów',
        naglowki: ['Punkt', 'Przychód (zł)'],
        wiersze: pary.map(function (p) { return [p.etykieta, liczbaCSV(p.wartosc)]; })
      };

      if (!pary.length) {
        podmien('slotPunkty', pusty('Przypisz zamówieniu punkt (Walim, Wrocław, Online), a sprzedaż zsumuje się sama.',
          'Przejdź do zamówień', 'admin-zamowienia-nf.html'));
        return;
      }

      var ul = el('ul', { cls: 'legend' });
      pary.sort(function (a, b) { return b.wartosc - a.wartosc; }).forEach(function (p) {
        ul.appendChild(el('li', {}, [
          el('span', { text: p.etykieta }),
          el('span', { cls: 'legend__count num', text: zlOkr(p.wartosc) })
        ]));
      });
      podmien('slotPunkty', ul);
    }

    /* --- Najlepiej sprzedające się ------------------------------------------- */
    function top(wOkresie, klucz) {
      var mapa = {};
      wOkresie.forEach(function (o) {
        (dane.pozycje[o.id] || []).forEach(function (i) {
          var k = i.product_id || i.name;
          if (!mapa[k]) mapa[k] = { nazwa: i.name || '—', sztuk: 0, przychod: 0 };
          mapa[k].sztuk += Number(i.qty) || 0;
          mapa[k].przychod += (Number(i.price) || 0) * (Number(i.qty) || 0);
        });
      });

      var lista = Object.keys(mapa).map(function (k) { return mapa[k]; })
        .sort(function (a, b) { return b.przychod - a.przychod; })
        .slice(0, 5);

      sekcje.top = {
        nazwa: 'najlepiej-sprzedajace_' + klucz,
        tytul: 'Najlepiej sprzedające się rośliny',
        naglowki: ['Pozycja', 'Roślina', 'Sztuki', 'Przychód (zł)'],
        wiersze: lista.map(function (t, i) { return [i + 1, t.nazwa, t.sztuk, liczbaCSV(t.przychod)]; })
      };

      if (!lista.length) {
        podmien('slotTop', pusty('W tym okresie nic się nie sprzedało.'));
        return;
      }

      var max = lista[0].przychod || 1;
      var ol = el('ol', { cls: 'rank-list' });
      lista.forEach(function (t, i) {
        ol.appendChild(el('li', { cls: 'rank-item' }, [
          el('span', { cls: 'num muted', text: (i + 1) + '.' }),
          el('div', {}, [
            el('span', { text: t.nazwa }),
            el('div', {
              cls: 'rank-item__bar',
              styl: { '--share': Math.max(3, Math.round(t.przychod / max * 100)) + '%' },
              attr: { 'aria-hidden': 'true' }
            }, [el('span')])
          ]),
          el('div', { cls: 'rank-item__money' }, [
            el('span', { cls: 'num', text: zlOkr(t.przychod) }),
            el('br'),
            el('span', { cls: 'num muted small', text: t.sztuk + ' szt.' })
          ])
        ]));
      });
      podmien('slotTop', ol);
    }
  }


  /* ========================================================================
     WIDOK 6 — Kopie zapasowe (admin-kopie-nf.html)
     ====================================================================== */

  function widokKopie() {
    var zajete = false;

    rysujListe();

    function nazwaPliku() {
      var d = new Date();
      return 'nf-kopia-' + d.getFullYear() + dwie(d.getMonth() + 1) + dwie(d.getDate()) +
             '-' + dwie(d.getHours()) + dwie(d.getMinutes()) + '.json';
    }

    /* Zrzut idzie tabela po tabeli. Tabela, której nie da się przeczytać
       (brak uprawnień, literówka w nazwie), nie przerywa całości — jest
       wymieniona w komunikacie, żeby nikt nie wziął niepełnej kopii
       za pełną. */
    function zrzut() {
      var snap = {
        _meta: { app: 'Nature & Future', schema: 1, created_at: new Date().toISOString() },
        tables: {}
      };
      var pominiete = [];

      return TABELE_KOPII.reduce(function (lancuch, t) {
        return lancuch.then(function () {
          return sb.from(t).select('*').then(function (r) {
            if (r && r.error) { pominiete.push(t); return; }
            snap.tables[t] = wynik(r);
          }).catch(function () { pominiete.push(t); });
        });
      }, Promise.resolve()).then(function () {
        return { snap: snap, pominiete: pominiete };
      });
    }

    function zapiszNaLiscie(wpis, snap) {
      try {
        var meta = odczytajMeta();
        meta.unshift(wpis);
        var przycieta = meta.slice(0, 8);
        localStorage.setItem('nf-backups-meta', JSON.stringify(przycieta));
        localStorage.setItem('nf-backup-snap-' + wpis.id, JSON.stringify(snap));
        meta.slice(8).forEach(function (m) { localStorage.removeItem('nf-backup-snap-' + m.id); });
      } catch (e) {
        /* Przekroczony limit pamięci przeglądarki. Plik i tak został pobrany,
           więc kopia istnieje — nie ma jej tylko na liście do przywrócenia. */
      }
    }

    function odczytajMeta() {
      try { return JSON.parse(localStorage.getItem('nf-backups-meta') || '[]'); }
      catch (e) { return []; }
    }

    function rysujListe() {
      var meta = odczytajMeta();
      if (!meta.length) {
        podmien('slotKopie', pusty('Na tym urządzeniu nie ma jeszcze żadnej kopii. Utwórz pierwszą przyciskiem powyżej.'));
        return;
      }

      var ul = el('ul', { cls: 'backup-list' });
      meta.forEach(function (b) {
        var przywroc = el('button', {
          cls: 'btn btn--primary btn--small', text: 'Przywróć', attr: { type: 'button' }
        });
        przywroc.addEventListener('click', function () { przywrocZListy(b, przywroc); });

        ul.appendChild(el('li', { cls: 'backup' }, [
          el('div', {}, [
            el('p', { cls: 'backup__name', text: b.label }),
            el('p', { cls: 'backup__meta num', text: b.date + ' · ' + b.size })
          ]),
          przywroc
        ]));
      });
      podmien('slotKopie', ul);
    }

    /* Przywrócenie nadpisuje dane na serwerze — modal nazywa, co ginie,
       a przycisk opisuje skutek, nie zgodę (8A, zasada 4). */
    function zastosuj(snap) {
      var tabele = (snap && snap.tables) ? snap.tables : snap;
      var raport = [];

      return TABELE_KOPII.reduce(function (lancuch, t) {
        return lancuch.then(function () {
          var wiersze = tabele ? tabele[t] : null;
          if (!Array.isArray(wiersze) || !wiersze.length) return;
          return sb.from(t).upsert(wiersze).then(function (r) {
            raport.push(t + (r && r.error ? ' — nie zapisano' : ' — ' + wiersze.length));
          }).catch(function () { raport.push(t + ' — nie zapisano'); });
        });
      }, Promise.resolve()).then(function () {
        return raport.length ? raport.join(', ') : 'brak danych do zapisania';
      });
    }

    function przywrocZListy(b, przycisk) {
      var snap = null;
      try {
        var raw = localStorage.getItem('nf-backup-snap-' + b.id);
        if (raw) snap = JSON.parse(raw);
      } catch (e) { snap = null; }

      if (!snap) {
        notatka('notatkaKopii', 'Ta pozycja nie ma zapisanego pliku na tym urządzeniu. Użyj „Przywróć z pliku”.', true);
        return;
      }

      potwierdz({
        tytul: 'Przywrócić kopię?',
        opis: 'Dane w bazie zostaną nadpisane zawartością kopii „' + b.label + '” z ' + b.date + '. Bieżącej wersji nie da się już odzyskać.',
        czasownik: 'Przywróć i nadpisz',
        anuluj: 'Zostaw bieżące dane',
        onPotwierdz: function () {
          przycisk.disabled = true;
          notatka('notatkaKopii', 'Przywracam…');
          zastosuj(snap).then(function (raport) {
            przycisk.disabled = false;
            notatka('notatkaKopii', 'Przywrócono: ' + raport + '.');
          }).catch(function () {
            przycisk.disabled = false;
            notatka('notatkaKopii', 'Nie udało się przywrócić kopii.', true);
          });
        }
      });
    }

    var utworz = document.getElementById('utworzKopie');
    if (utworz) {
      utworz.addEventListener('click', function () {
        if (zajete) return;
        zajete = true;
        notatka('notatkaKopii', 'Zbieram dane…');

        zrzut().then(function (w) {
          var nazwa = nazwaPliku();
          var bajty = pobierzPlik(nazwa, JSON.stringify(w.snap, null, 2), 'application/json');
          zapiszNaLiscie({
            id: Date.now(),
            date: dataGodzina(new Date().toISOString()),
            size: rozmiar(bajty),
            label: 'Kopia ręczna — ' + nazwa
          }, w.snap);
          rysujListe();
          zajete = false;
          notatka('notatkaKopii', w.pominiete.length
            ? 'Kopia gotowa, ale nie weszły do niej tabele: ' + w.pominiete.join(', ') + '.'
            : 'Kopia gotowa i pobrana.', w.pominiete.length > 0);
        }).catch(function () {
          zajete = false;
          notatka('notatkaKopii', 'Nie udało się utworzyć kopii.', true);
        });
      });
    }

    var eksport = document.getElementById('eksportujBaze');
    if (eksport) {
      eksport.addEventListener('click', function () {
        if (zajete) return;
        zajete = true;
        notatka('notatkaKopii', 'Zbieram dane…');

        zrzut().then(function (w) {
          pobierzPlik(nazwaPliku(), JSON.stringify(w.snap, null, 2), 'application/json');
          zajete = false;
          notatka('notatkaKopii', w.pominiete.length
            ? 'Plik pobrany, ale bez tabel: ' + w.pominiete.join(', ') + '.'
            : 'Plik pobrany.', w.pominiete.length > 0);
        }).catch(function () {
          zajete = false;
          notatka('notatkaKopii', 'Nie udało się przygotować pliku.', true);
        });
      });
    }

    var importuj = document.getElementById('importujBaze');
    if (importuj) {
      importuj.addEventListener('click', function () {
        if (zajete) return;
        var input = el('input', { attr: { type: 'file', accept: 'application/json,.json' } });

        input.addEventListener('change', function () {
          var plik = input.files && input.files[0];
          if (!plik) return;

          potwierdz({
            tytul: 'Przywrócić dane z pliku?',
            opis: 'Zawartość bazy zostanie nadpisana danymi z pliku „' + plik.name + '”. Bieżącej wersji nie da się już odzyskać — jeśli jej nie masz, najpierw utwórz kopię.',
            czasownik: 'Przywróć i nadpisz',
            anuluj: 'Zostaw bieżące dane',
            onPotwierdz: function () {
              zajete = true;
              notatka('notatkaKopii', 'Wczytuję plik…');

              plik.text().then(function (tekst) {
                return zastosuj(JSON.parse(tekst));
              }).then(function (raport) {
                zajete = false;
                notatka('notatkaKopii', 'Przywrócono: ' + raport + '.');
              }).catch(function () {
                zajete = false;
                notatka('notatkaKopii', 'Nie udało się wczytać pliku. Sprawdź, czy to kopia z tego panelu.', true);
              });
            }
          });
        });

        input.click();
      });
    }
  }


  /* ========================================================================
     WIDOK 7 — Poczta (admin-poczta-nf.html)
     ====================================================================== */

  function widokPoczta() {
    var skrzynka = 'inbox';
    var wiadomosci = [];
    var odbiorcy = [];
    var konta = [];
    var otwarta = null;

    var widoki = {
      lista: document.getElementById('widokLista'),
      wiadomosc: document.getElementById('widokWiadomosc'),
      nowa: document.getElementById('widokNowa')
    };

    function pokaz(ktory) {
      Object.keys(widoki).forEach(function (k) {
        if (widoki[k]) widoki[k].hidden = (k !== ktory);
      });
    }

    profile().then(function (r) {
      konta = wynik(r).filter(function (u) { return u.email; });
    }).catch(function () { konta = []; });

    wczytaj();

    /* --- Wczytanie skrzynki ----------------------------------------------
       Najpierw prosimy funkcję brzegową o synchronizację z serwerem poczty,
       potem czytamy tabelę. Nieudana synchronizacja nie blokuje odczytu —
       lepiej pokazać to, co już jest, niż pusty ekran. */
    function wczytaj() {
      var slot = document.getElementById('slotPoczta');
      if (slot) slot.setAttribute('aria-busy', 'true');

      sb.auth.getSession()
        .then(function (r) {
          var sesja = r && r.data && r.data.session;
          var url = funkcjeUrl();
          if (!sesja || !url) return null;
          return fetch(url + '/fetch-emails', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + sesja.access_token,
              'Content-Type': 'application/json'
            },
            body: '{}'
          }).catch(function () { return null; });
        })
        .then(function () {
          return sb.from('emails').select('*').order('received_at', { ascending: false });
        })
        .then(function (r) {
          wiadomosci = wynik(r);
          rysuj();
        })
        .catch(function () { bladWczytania('slotPoczta'); });
    }

    function rysuj() {
      var lista = wiadomosci.filter(function (m) {
        return (m.folder || 'inbox') === skrzynka;
      });

      if (!lista.length) {
        podmien('slotPoczta', pusty(skrzynka === 'inbox'
          ? 'Skrzynka odbiorcza jest pusta. Nowe wiadomości pojawią się tu po odświeżeniu.'
          : 'Nie wysłano jeszcze żadnej wiadomości z tego panelu.'));
        return;
      }

      var ul = el('ul', { cls: 'mail-list' });
      lista.forEach(function (m) {
        var kto = skrzynka === 'sent'
          ? 'Do: ' + adresyDo(m)
          : (m.from_name || m.from_address || '—');
        var nieprzeczytana = skrzynka === 'inbox' && !m.read;

        var przycisk = el('button', {
          cls: 'mail-row' + (nieprzeczytana ? ' mail-row--unread' : ''),
          attr: { type: 'button' }
        }, [
          el('span', { cls: 'mail-row__from', text: kto }),
          el('span', { cls: 'mail-row__subject' }, [
            document.createTextNode(m.subject || '(bez tematu)'),
            nieprzeczytana ? el('span', { cls: 'visually-hidden', text: ' — nieprzeczytana' }) : null
          ]),
          el('span', { cls: 'mail-row__when num', text: data(m.received_at) })
        ]);

        przycisk.addEventListener('click', function () { otworz(m); });
        ul.appendChild(el('li', {}, [przycisk]));
      });

      podmien('slotPoczta', ul);
    }

    function adresyDo(m) {
      var lista = m.to_addresses || [];
      return lista.map(function (a) { return (a && a.email) || a; }).filter(Boolean).join(', ') || '—';
    }

    /* Treść wiadomości wchodzi do DOM jako tekst, nigdy jako HTML. Poczta
       przychodzi z zewnątrz i nie ma prawa niczego w panelu wykonać —
       stary dashboard wstawiał ją przez innerHTML. */
    function tresc(m) {
      if (m.body_text) return m.body_text;
      if (!m.body_html) return '';
      /* Wersja HTML idzie przez zdjęcie znaczników i rozwinięcie encji
         w <textarea>, którego zawartość przeglądarka traktuje jako tekst.
         Nigdzie po drodze nie powstaje węzeł, który mógłby cokolwiek zrobić. */
      var bezZnacznikow = String(m.body_html)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|tr)>/gi, '\n')
        .replace(/<[^>]*>/g, '');
      var ta = document.createElement('textarea');
      ta.innerHTML = bezZnacznikow;
      return ta.value.replace(/\n{3,}/g, '\n\n').trim();
    }

    function otworz(m) {
      otwarta = m;
      document.getElementById('wiadomoscTemat').textContent = m.subject || '(bez tematu)';
      document.getElementById('wiadomoscOd').textContent = m.from_name
        ? m.from_name + ' · ' + (m.from_address || '')
        : (m.from_address || '—');
      document.getElementById('wiadomoscDo').textContent = adresyDo(m);
      document.getElementById('wiadomoscData').textContent = dataGodzina(m.received_at);
      document.getElementById('wiadomoscTresc').textContent = tresc(m) || 'Wiadomość nie ma treści tekstowej.';
      pokaz('wiadomosc');

      if (!m.read) {
        m.read = true;
        sb.from('emails').update({ read: true }).eq('id', m.id).then(function () { rysuj(); });
      }
    }

    var zakladki = document.getElementById('zakladki');
    if (zakladki) {
      zakladki.addEventListener('click', function (e) {
        var b = e.target.closest('[data-skrzynka]');
        if (!b) return;
        skrzynka = b.getAttribute('data-skrzynka');
        Array.prototype.forEach.call(zakladki.querySelectorAll('[data-skrzynka]'), function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        rysuj();
      });
    }

    var odswiez = document.getElementById('odswiez');
    if (odswiez) odswiez.addEventListener('click', wczytaj);

    Array.prototype.forEach.call(document.querySelectorAll('[data-wroc]'), function (b) {
      b.addEventListener('click', function () { pokaz('lista'); });
    });

    /* --- Nowa wiadomość ---------------------------------------------------- */

    var edytor = document.getElementById('edytor');
    var szukaj = document.getElementById('poleSzukaj');
    var podpowiedzi = document.getElementById('podpowiedzi');

    function rysujOdbiorcow() {
      var ul = document.getElementById('listaOdbiorcow');
      var brak = document.getElementById('brakOdbiorcow');
      if (!ul) return;

      ul.textContent = '';
      if (brak) brak.hidden = odbiorcy.length > 0;

      odbiorcy.forEach(function (o) {
        var usun = el('button', {
          cls: 'chip__remove', text: '×',
          attr: { type: 'button', 'aria-label': 'Usuń odbiorcę ' + o.email }
        });
        usun.addEventListener('click', function () {
          odbiorcy = odbiorcy.filter(function (x) { return x.email !== o.email; });
          rysujOdbiorcow();
        });
        ul.appendChild(el('li', {}, [
          el('span', { cls: 'chip' }, [el('span', { text: o.nazwa || o.email }), usun])
        ]));
      });
    }

    function dodajOdbiorce(email, nazwa) {
      if (!email) return;
      if (odbiorcy.some(function (o) { return o.email === email; })) return;
      odbiorcy.push({ email: email, nazwa: nazwa || email });
      rysujOdbiorcow();
    }

    if (szukaj && podpowiedzi) {
      szukaj.addEventListener('input', function () {
        var q = szukaj.value.trim().toLowerCase();
        podpowiedzi.textContent = '';
        if (q.length < 2) { podpowiedzi.hidden = true; return; }

        var trafienia = konta.filter(function (u) {
          return (u.full_name || '').toLowerCase().indexOf(q) !== -1 ||
                 (u.email || '').toLowerCase().indexOf(q) !== -1;
        }).slice(0, 8);

        podpowiedzi.hidden = !trafienia.length;
        trafienia.forEach(function (u) {
          var b = el('button', { attr: { type: 'button' } }, [
            document.createTextNode(u.full_name || u.email),
            el('span', { cls: 'suggest__mail num', text: ' · ' + u.email })
          ]);
          b.addEventListener('click', function () {
            dodajOdbiorce(u.email, u.full_name);
            szukaj.value = '';
            podpowiedzi.hidden = true;
          });
          podpowiedzi.appendChild(el('li', {}, [b]));
        });
      });
    }

    var dodajAdres = document.getElementById('dodajAdres');
    if (dodajAdres) {
      dodajAdres.addEventListener('click', function () {
        var q = (szukaj.value || '').trim();
        if (q.indexOf('@') === -1 || q.indexOf('.') === -1) {
          notatka('notatkaPoczty', 'To nie wygląda na adres e-mail.', true);
          return;
        }
        dodajOdbiorce(q, q);
        szukaj.value = '';
        if (podpowiedzi) podpowiedzi.hidden = true;
        notatka('notatkaPoczty', '');
      });
    }

    var wszyscy = document.getElementById('dodajWszystkich');
    if (wszyscy) {
      wszyscy.addEventListener('click', function () {
        konta.filter(function (u) { return (Number(u.rank) || 9) === 9; })
          .forEach(function (u) { dodajOdbiorce(u.email, u.full_name); });
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-format]'), function (b) {
      b.addEventListener('click', function () {
        var akcja = b.getAttribute('data-format');
        if (edytor) edytor.focus();
        if (akcja === 'createLink') {
          var url = window.prompt('Adres, do którego ma prowadzić odnośnik:');
          if (url) document.execCommand('createLink', false, url);
          return;
        }
        document.execCommand(akcja);
      });
    });

    function nowa(temat, cytat) {
      odbiorcy = [];
      rysujOdbiorcow();
      document.getElementById('poleTemat').value = temat || '';
      if (edytor) {
        edytor.textContent = '';
        if (cytat) {
          edytor.appendChild(el('p'));
          edytor.appendChild(el('blockquote', { text: cytat }));
        }
      }
      notatka('notatkaPoczty', '');
      pokaz('nowa');
      if (edytor) edytor.focus();
    }

    var nowaBtn = document.getElementById('nowaWiadomosc');
    if (nowaBtn) nowaBtn.addEventListener('click', function () { nowa('', ''); });

    var odpowiedzBtn = document.getElementById('odpowiedz');
    if (odpowiedzBtn) {
      odpowiedzBtn.addEventListener('click', function () {
        if (!otwarta) return;
        var temat = (otwarta.subject || '');
        nowa(/^Re:/i.test(temat) ? temat : 'Re: ' + temat, tresc(otwarta));
        dodajOdbiorce(otwarta.from_address, otwarta.from_name);
      });
    }

    var form = document.getElementById('formWiadomosci');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var temat = document.getElementById('poleTemat').value.trim();
        var trescHtml = edytor ? edytor.innerHTML : '';

        if (!odbiorcy.length) { notatka('notatkaPoczty', 'Dodaj przynajmniej jednego odbiorcę.', true); return; }
        if (!temat) { notatka('notatkaPoczty', 'Podaj temat wiadomości.', true); return; }
        if (!edytor || !edytor.textContent.trim()) { notatka('notatkaPoczty', 'Wpisz treść wiadomości.', true); return; }

        /* Wysyłka jest nieodwracalna, a odbiorców bywa wielu — dlatego
           potwierdzenie mówi, do ilu osób to poleci (8A, zasada 4). */
        potwierdz({
          tytul: 'Wysłać wiadomość?',
          opis: 'Wiadomość „' + temat + '” poleci do ' + odbiorcy.length +
                (odbiorcy.length === 1 ? ' odbiorcy' : ' odbiorców') + '. Wysłanej nie da się cofnąć.',
          czasownik: 'Wyślij',
          anuluj: 'Wróć do edycji',
          onPotwierdz: function () { wyslij(temat, trescHtml); }
        });
      });
    }

    function wyslij(temat, html) {
      var przycisk = document.getElementById('wyslij');
      przycisk.disabled = true;
      notatka('notatkaPoczty', 'Wysyłam…');

      var url = funkcjeUrl();
      if (!url) {
        przycisk.disabled = false;
        notatka('notatkaPoczty', 'Wysyłka poczty nie działa w tym trybie — brak połączenia z serwerem.', true);
        return;
      }

      sb.auth.getSession()
        .then(function (r) {
          var sesja = r && r.data && r.data.session;
          return fetch(url + '/send-email', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + (sesja ? sesja.access_token : ''),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              to: odbiorcy.map(function (o) { return o.email; }),
              subject: temat,
              html: html
            })
          });
        })
        .then(function (res) {
          przycisk.disabled = false;
          if (!res || !res.ok) {
            notatka('notatkaPoczty', 'Nie udało się wysłać wiadomości. Spróbuj jeszcze raz.', true);
            return;
          }
          notatka('notatkaPoczty', '');
          skrzynka = 'sent';
          if (zakladki) {
            Array.prototype.forEach.call(zakladki.querySelectorAll('[data-skrzynka]'), function (x) {
              x.setAttribute('aria-pressed', String(x.getAttribute('data-skrzynka') === 'sent'));
            });
          }
          pokaz('lista');
          wczytaj();
        })
        .catch(function () {
          przycisk.disabled = false;
          notatka('notatkaPoczty', 'Nie udało się wysłać wiadomości. Spróbuj jeszcze raz.', true);
        });
    }
  }


  /* ========================================================================
     Dziennik zmian personelu
     Zapis do staff_audit. Błąd jest tu bez znaczenia: akcja główna już się
     wykonała, a dziennik nie może jej cofnąć.
     ====================================================================== */

  function dziennik(akcja, cel, szczegoly) {
    if (!user) return;
    try {
      sb.from('staff_audit').insert({
        actor_id: user.id,
        action: akcja,
        target_id: String(cel),
        detail: szczegoly
      }).then(function () {}, function () {});
    } catch (e) { /* nic */ }
  }


  /* ========================================================================
     Start
     ====================================================================== */

  var WIDOKI = {
    przeglad:    widokPrzeglad,
    produkty:    widokProdukty,
    zamowienia:  widokZamowienia,
    uzytkownicy: widokUzytkownicy,
    analiza:     widokAnaliza,
    kopie:       widokKopie,
    poczta:      widokPoczta
  };

  /* Widoki zastrzeżone dla administratora. Moderator ma tu ograniczony
     panel: zamówienia, produkty i konta — bez analizy, kopii i poczty. */
  var TYLKO_ADMIN = ['analiza', 'kopie', 'poczta'];

  function naLogowanie() {
    var wroc = (location.pathname.split('/').pop() || 'admin-nf.html') + location.search;
    location.replace('konto-logowanie-nf.html?powrot=' + encodeURIComponent(wroc));
  }

  function nawigacja() {
    var toggle = document.querySelector('.panel-nav__toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var otwarte = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!otwarte));
    });
  }

  function opiszPersonel() {
    var ranga = document.getElementById('rangaPersonelu');
    if (ranga) {
      ranga.textContent = nazwaRangi(mojaRanga);
      ranga.style.setProperty('--rank-color', kolorRangi(mojaRanga));
    }

    var nazwa = (user && user.user_metadata && user.user_metadata.full_name) ||
                ((user && user.email) || '').split('@')[0] || '—';

    var wNazwa = document.getElementById('ktoNazwa');
    var wMail = document.getElementById('ktoMail');
    var wIni = document.getElementById('ktoInicjaly');
    if (wNazwa) wNazwa.textContent = nazwa;
    if (wMail) wMail.textContent = (user && user.email) || '';
    if (wIni) wIni.textContent = inicjaly(nazwa);

    /* Pozycje administratora odsłaniamy dopiero, gdy znamy rangę — dzięki
       temu moderator nie widzi ich nawet przez ułamek sekundy. */
    if (mojaRanga >= RANGA_ADMINA) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-ranga="11"]'), function (li) {
        li.hidden = false;
      });
    }
  }

  function start() {
    sb = window.supabaseClient;
    if (!sb) { setTimeout(start, 60); return; }

    nawigacja();

    var anulujModal = document.querySelector('#panelModal [data-modal-cancel]');
    if (anulujModal) {
      anulujModal.addEventListener('click', function () {
        document.getElementById('panelModal').close();
      });
    }

    var wyloguj = document.getElementById('wyloguj');
    if (wyloguj) {
      wyloguj.addEventListener('click', function () {
        sb.auth.signOut().then(function () { location.replace('index-nf.html'); });
      });
    }

    sb.auth.getSession().then(function (r) {
      var sesja = r && r.data && r.data.session;
      if (!sesja) { naLogowanie(); return; }
      user = sesja.user;

      return sb.from('profiles').select('rank').eq('id', user.id).maybeSingle().then(function (p) {
        mojaRanga = (p && p.data && Number(p.data.rank)) || 0;

        /* Niższa ranga nie zobaczy tu nic sensownego, więc zamiast pustego
           panelu dostaje swój własny. To wygoda, nie zabezpieczenie —
           dane i tak chronią polityki RLS. */
        if (mojaRanga < RANGA_PERSONELU) { location.replace('konto-nf.html'); return; }

        var widok = document.body.getAttribute('data-view');
        if (mojaRanga < RANGA_ADMINA && TYLKO_ADMIN.indexOf(widok) !== -1) {
          location.replace('admin-nf.html');
          return;
        }

        opiszPersonel();
        var f = WIDOKI[widok];
        if (f) f();
      });
    });

    /* Wylogowanie w innej karcie ma zamknąć panel także tutaj. */
    sb.auth.onAuthStateChange(function (_e, sesja) {
      if (!sesja && user) naLogowanie();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
