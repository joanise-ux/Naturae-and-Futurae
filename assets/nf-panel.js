/* ==========================================================================
   Nature & Future — nf-panel.js
   Wspólny runtime pięciu widoków panelu klienta (docs/design-system.md,
   rozdz. 8A). Jeden plik dla wszystkich stron; widok wybiera się atrybutem
   data-view na <body>.

   Zasady, które ten plik egzekwuje:
   · wszystko za autoryzacją — niezalogowany trafia na logowanie i wraca tu;
   · żadne dane osobowe nie idą do konsoli;
   · treść z bazy wchodzi do DOM przez textContent, nigdy przez innerHTML;
   · nic nieodwracalnego bez potwierdzenia w <dialog>;
   · stan ładowania to szkielet z HTML-a, podmieniany po nadejściu danych.

   Zależy od: supabase-js 2 + supabase-config.js (window.supabaseClient).
   ========================================================================== */

(function () {
  'use strict';

  var sb = null;
  var user = null;

  /* --- Słownik statusów (8A, zasada 3) ------------------------------------
     Baza trzyma pięć wartości, bo tyle ma panel staffa. Klient widzi cztery:
     „Nowe” i „W realizacji” to dla niego ten sam etap. Etykieta jest zawsze
     słowem — kropka koloru wchodzi klasą i nigdy nie występuje sama. */
  var STATUSY = {
    'Nowe':         { label: 'W realizacji', cls: 'status--progress' },
    'W realizacji': { label: 'W realizacji', cls: 'status--progress' },
    'Wysłane':      { label: 'Wysłane',      cls: 'status--sent' },
    'Dostarczone':  { label: 'Dostarczone',  cls: 'status--delivered' },
    'Anulowane':    { label: 'Anulowane',    cls: 'status--cancelled' }
  };

  var FILTRY = ['W realizacji', 'Wysłane', 'Dostarczone', 'Anulowane'];

  function status(s) {
    return STATUSY[s] || { label: s || 'Nieznany', cls: '' };
  }

  /* <!-- TREŚĆ DO POTWIERDZENIA: adresy śledzenia przesyłek u przewoźników.
         Dopóki para nie jest potwierdzona, numer pokazuje się jako tekst,
         nie jako link prowadzący w nieznane miejsce. --> */
  var SLEDZENIE = {};

  /* --- Formatowanie ------------------------------------------------------- */

  var kwotaFmt = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function zl(n) {
    var v = Number(n);
    return (isFinite(v) ? kwotaFmt.format(v) : '—') + ' zł';
  }

  function data(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var p = function (x) { return String(x).padStart(2, '0'); };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  /* --- Budowanie DOM ------------------------------------------------------
     el() przyjmuje tekst, nigdy HTML. Dzięki temu nazwa rośliny czy adres
     wpisany przez użytkownika nie może wstrzyknąć znacznika. */

  function el(tag, opts, dzieci) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.text != null) n.textContent = String(opts.text);
    Object.keys(opts.attr || {}).forEach(function (k) {
      if (opts.attr[k] != null) n.setAttribute(k, String(opts.attr[k]));
    });
    (dzieci || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function statusEl(s) {
    var st = status(s);
    return el('span', { cls: 'status ' + st.cls, text: st.label });
  }

  function miniatura(src, alt) {
    if (!src) return el('span', { cls: 'thumb', attr: { 'aria-hidden': 'true' } });
    return el('img', {
      cls: 'thumb',
      attr: { src: src, alt: alt || '', loading: 'lazy', decoding: 'async', width: 64, height: 64 }
    });
  }

  function pusty(zdanie, hrefTekst, href) {
    return el('div', { cls: 'empty' }, [
      el('p', { text: zdanie }),
      el('a', { cls: 'btn btn--secondary', text: hrefTekst || 'Zobacz rośliny', attr: { href: href || 'sklep-nf.html' } })
    ]);
  }

  function podmien(id, wezel) {
    var slot = document.getElementById(id);
    if (!slot) return;
    slot.textContent = '';
    slot.removeAttribute('aria-busy');
    if (wezel) slot.appendChild(wezel);
  }

  /* Błąd wczytania mówi co się stało, bez treści odpowiedzi z serwera —
     ta potrafi nieść dane rekordu. */
  function bladWczytania(id) {
    podmien(id, el('div', { cls: 'empty' }, [
      el('p', { text: 'Nie udało się wczytać danych. Odśwież stronę albo spróbuj za chwilę.' })
    ]));
  }

  /* --- Modal potwierdzenia (8A, zasada 4) ---------------------------------
     <dialog> daje pułapkę focusu i Esc bez linijki kodu. Focus wraca na
     element, z którego modal otwarto. */

  function potwierdz(opts) {
    var dlg = document.getElementById('panelModal');
    if (!dlg) return;

    var wracaDo = document.activeElement;

    dlg.querySelector('[data-modal-title]').textContent = opts.tytul;
    dlg.querySelector('[data-modal-body]').textContent = opts.opis || '';

    var tak = dlg.querySelector('[data-modal-confirm]');
    var nie = dlg.querySelector('[data-modal-cancel]');
    tak.textContent = opts.czasownik;
    nie.textContent = opts.anuluj || 'Zachowaj';

    function sprzataj() {
      tak.removeEventListener('click', naTak);
      dlg.removeEventListener('close', naZamkniecie);
      if (wracaDo && wracaDo.focus) wracaDo.focus();
    }
    function naTak() { dlg.close(); opts.onPotwierdz(); }
    function naZamkniecie() { sprzataj(); }

    tak.addEventListener('click', naTak);
    dlg.addEventListener('close', naZamkniecie);
    dlg.showModal();
  }

  /* --- Autoryzacja --------------------------------------------------------
     Niezalogowany trafia na ekran logowania (konto-logowanie-nf.html)
     z adresem powrotu. Budowanie drugiego logowania byłoby dublowaniem
     mechanizmu uwierzytelniania — to osobne zadanie. */

  function adresPowrotu() {
    return (location.pathname.split('/').pop() || 'konto-nf.html') + location.search;
  }

  function naLogowanie() {
    location.replace('konto-logowanie-nf.html?powrot=' + encodeURIComponent(adresPowrotu()));
  }

  /* --- Narzędzia personelu -------------------------------------------------
     Ranga >= 10 (moderator, administrator) to ten sam próg, którego pilnuje
     dashboard w sklep.html — STAFF_RANK. Trzymamy go tutaj jako jedną stałą,
     żeby nie rozjechał się przy zmianie.

     To wyłącznie skrót w interfejsie. Ukrycie linku niczego nie chroni:
     dostęp do danych rozstrzygają polityki RLS (is_staff), a panel personelu
     i edytor sprawdzają rangę same, po swojej stronie.

     Dashboard ma już swoją wersję w nowym froncie (admin-*-nf.html), więc
     pierwszy skrót prowadzi tam. Edytor treści został na starym froncie
     i czeka na przepisanie — po nim zostaje do podmiany jeden href. */
  var RANGA_PERSONELU = 10;

  function narzedziaPersonelu() {
    var slot = document.getElementById('panelNavStaff');
    if (!slot) return;

    sb.from('profiles').select('rank').eq('id', user.id).maybeSingle().then(function (r) {
      var ranga = (r && r.data && Number(r.data.rank)) || 0;
      if (ranga < RANGA_PERSONELU) return;

      slot.hidden = false;
      slot.appendChild(el('p', { cls: 'panel-nav__label', text: 'Personel' }));

      slot.appendChild(el('a', {
        cls: 'panel-nav__link',
        text: 'Panel personelu',
        attr: { href: 'admin-nf.html' }
      }));

      slot.appendChild(el('a', {
        cls: 'panel-nav__link',
        text: 'Edytuj treść strony',
        attr: { href: 'index.html?edit=1' }
      }));
    });
  }

  /* --- Licznik koszyka -----------------------------------------------------
     Ta sama ikona co w sklepie (6.3). Liczy sztuki, nie pozycje — dwie
     sadzonki tego samego gatunku to dwie rzeczy w koszyku, nie jedna.
     Przy pustym koszyku licznik zostaje schowany: zero nic nie wnosi. */

  function pozycjeKoszyka() {
    return sb.from('cart_items')
      .select('id, product_id, qty, products(id, name, latin, image, price, unit)')
      .eq('user_id', user.id);
  }

  function licznikKoszyka(pozycje) {
    var bak = document.getElementById('koszykLicznik');
    var ikona = document.getElementById('koszyk');
    if (!bak) return;

    var sztuk = (pozycje || []).reduce(function (s, i) { return s + (Number(i.qty) || 0); }, 0);

    bak.textContent = sztuk;
    bak.hidden = !sztuk;
    if (ikona) {
      ikona.setAttribute('aria-label', sztuk ? 'Koszyk, ' + sztuk + ' szt.' : 'Koszyk, pusty');
    }
  }

  /* --- Wysuwka koszyka -----------------------------------------------------
     Kliknięcie ikony pokazuje, co jest w koszyku, zamiast przerzucać do
     sklepu. Dane idą z cart_items z dołączonym produktem — nazwa, cena
     i zdjęcie mieszkają w products, w koszyku jest tylko ilość. */

  function koszyk() {
    var ikona = document.getElementById('koszyk');
    var dlg = document.getElementById('koszykWysuwka');
    if (!ikona || !dlg) return;

    ikona.addEventListener('click', function () {
      dlg.showModal();
      wczytajKoszyk();
    });

    var zamknij = dlg.querySelector('[data-koszyk-zamknij]');
    if (zamknij) zamknij.addEventListener('click', function () { dlg.close(); });

    /* Pierwsze wczytanie w tle: licznik przy ikonie ma być aktualny,
       zanim ktokolwiek otworzy wysuwkę. */
    wczytajKoszyk(true);
  }

  function wczytajKoszyk(tylkoLicznik) {
    pozycjeKoszyka().then(function (r) {
      var poz = (r.error ? [] : r.data || []).filter(function (i) { return i.products; });
      licznikKoszyka(poz);
      if (!tylkoLicznik) rysujKoszyk(poz, r.error);
    }).catch(function () {
      if (!tylkoLicznik) rysujKoszyk([], true);
    });
  }

  function rysujKoszyk(poz, blad) {
    var stopka = document.getElementById('koszykStopka');

    if (blad) {
      bladWczytania('koszykTresc');
      if (stopka) stopka.hidden = true;
      return;
    }

    if (!poz.length) {
      podmien('koszykTresc', el('div', { cls: 'empty' }, [
        el('p', { text: 'Koszyk jest pusty.' }),
        el('a', { cls: 'btn btn--secondary', text: 'Zobacz rośliny', attr: { href: 'sklep-nf.html' } })
      ]));
      if (stopka) { stopka.hidden = true; stopka.textContent = ''; }
      return;
    }

    var lista = el('ul', { cls: 'mini-list' });
    var suma = 0;

    poz.forEach(function (i) {
      var p = i.products;
      var ile = Number(i.qty) || 0;
      var cena = (Number(p.price) || 0) * ile;
      suma += cena;

      var nazwa = el('div', { cls: 'mini-item__name' });
      if (p.latin) nazwa.appendChild(el('i', { cls: 'latin', text: p.latin, attr: { lang: 'la' } }));
      nazwa.appendChild(el('span', { text: p.name }));
      nazwa.appendChild(el('span', { cls: 'muted small num', text: ' × ' + ile }));

      var usun = el('button', {
        cls: 'btn btn--underline btn--small',
        text: 'Usuń',
        attr: { type: 'button' }
      });
      usun.addEventListener('click', function () { usunZKoszyka(i, p); });

      lista.appendChild(el('li', { cls: 'drawer__item' }, [
        p.image
          ? el('img', { cls: 'drawer__thumb', attr: { src: p.image, alt: '', loading: 'lazy', decoding: 'async', width: 56, height: 56 } })
          : el('span', { cls: 'drawer__thumb', attr: { 'aria-hidden': 'true' } }),
        nazwa,
        el('div', { cls: 'drawer__money' }, [
          el('span', { cls: 'num', text: zl(cena) }),
          usun
        ])
      ]));
    });

    podmien('koszykTresc', lista);

    if (!stopka) return;
    stopka.textContent = '';
    stopka.hidden = false;

    stopka.appendChild(el('p', { cls: 'drawer__sum' }, [
      el('span', { text: 'Razem' }),
      el('strong', { cls: 'num', text: zl(suma) })
    ]));

    /* Kasa jest na starym froncie — nowy nie ma jeszcze checkoutu. */
    stopka.appendChild(el('a', {
      cls: 'btn btn--primary',
      text: 'Przejdź do kasy',
      attr: { href: 'konto.html' }
    }));
  }

  function usunZKoszyka(pozycja, produkt) {
    potwierdz({
      tytul: 'Usunąć „' + produkt.name + '” z koszyka?',
      opis: 'Pozycja zniknie z koszyka. Zawsze możesz dodać ją ponownie.',
      czasownik: 'Usuń z koszyka',
      onPotwierdz: function () {
        sb.from('cart_items').delete().eq('id', pozycja.id).eq('user_id', user.id)
          .then(function () { wczytajKoszyk(); });
      }
    });
  }

  /* --- Nawigacja panelu ---------------------------------------------------- */

  function nawigacja() {
    var toggle = document.querySelector('.panel-nav__toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
  }

  /* --- Zapytania ----------------------------------------------------------
     Każde filtruje po user_id, mimo że RLS robi to samo po stronie bazy.
     Dwie bariery zamiast jednej: gdyby polityka kiedyś zniknęła, zapytanie
     nadal nie sięgnie po cudze dane. */

  function zamowienia() {
    return sb.from('orders')
      .select('id, total, status, created_at, tracking_number, carrier, delivery_method, payment_method, payment, address_snapshot')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  }

  function pozycje(idZamowien) {
    return sb.from('order_items')
      .select('order_id, product_id, name, latin, qty, price, image')
      .in('order_id', idZamowien);
  }

  function adresy() {
    return sb.from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
  }

  function ulubione() {
    return sb.from('watched_products')
      .select('id, product_id, created_at, products(id, name, latin, image, price, unit, stock, tag)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  }


  /* ========================================================================
     WIDOK 1 — Przegląd (/konto)
     Układ ze starego panelu: powitanie, rząd kafli, dwie kolumny.
     ====================================================================== */

  function widokPrzeglad() {
    powitanie();

    Promise.all([zamowienia(), ulubione(), adresy()]).then(function (r) {
      var ord = r[0], fav = r[1], adr = r[2];

      kafle(ord, fav, adr);

      /* Ostatnie zamówienie */
      if (ord.error) { bladWczytania('slotOstatnie'); }
      else if (!ord.data.length) {
        podmien('slotOstatnie', pusty('Nie masz jeszcze żadnych zamówień. Pierwsze pojawi się tu zaraz po złożeniu.'));
      } else {
        var o = ord.data[0];
        pozycje([o.id]).then(function (pi) {
          podmien('slotOstatnie', blokOstatnie(o, pi.error ? [] : pi.data, ord.data));
        });
      }

      /* Zapisane rośliny — skrót do trzech pozycji */
      if (fav.error) { bladWczytania('slotUlubione'); }
      else if (!fav.data.length) {
        podmien('slotUlubione', el('div', { cls: 'empty' }, [
          el('p', { text: 'Nie zapisałeś jeszcze żadnej rośliny.' }),
          el('a', { cls: 'btn btn--secondary btn--small', text: 'Zobacz rośliny', attr: { href: 'sklep-nf.html' } })
        ]));
      } else {
        var lista = el('ul', { cls: 'mini-list' });
        fav.data.slice(0, 3).forEach(function (w) {
          if (!w.products) return;
          lista.appendChild(miniPozycja(w.products));
        });
        podmien('slotUlubione', lista);
      }

      /* Adres domyślny */
      if (adr.error) { bladWczytania('slotAdres'); }
      else if (!adr.data.length) {
        podmien('slotAdres', el('div', { cls: 'empty' }, [
          el('p', { text: 'Nie masz jeszcze zapisanego adresu wysyłki.' }),
          el('a', { cls: 'btn btn--secondary btn--small', text: 'Dodaj adres', attr: { href: 'konto-dane-nf.html' } })
        ]));
      } else {
        var a = adr.data[0];
        var box = el('div', { cls: 'panel__block' }, [
          el('p', {}, [
            el('strong', { text: a.label || 'Adres' }),
            a.is_default ? el('span', { cls: 'tag', text: 'Domyślny' }) : null
          ]),
          el('p', { cls: 'addr__lines', text: a.full_name }),
          el('p', { cls: 'addr__lines', text: a.street }),
          el('p', { cls: 'addr__lines num', text: [a.postal, a.city].filter(Boolean).join(' ') })
        ]);
        podmien('slotAdres', box);
      }
    }).catch(function () {
      ['slotOstatnie', 'slotUlubione', 'slotAdres'].forEach(bladWczytania);
    });
  }

  /* Powitanie: imię, adres logowania i skrócony identyfikator konta.
     Identyfikator to ostatnie znaki UUID-a — pełny jest długi i nic
     klientowi nie mówi, a przy zgłoszeniu do obsługi liczy się to, żeby
     dało się go przeczytać przez telefon. */
  function powitanie() {
    var h = document.getElementById('powitanie');
    var mail = document.getElementById('powitanieMail');
    var id = document.getElementById('idKlienta');

    if (mail) mail.textContent = user.email || '';
    if (id) id.textContent = 'ID ' + String(user.id).slice(-6).toUpperCase();

    sb.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      .then(function (r) {
        var imie = ((r && r.data && r.data.full_name) || '').trim().split(' ')[0];
        if (h) h.textContent = imie ? 'Witaj, ' + imie : 'Twoje konto';
      });
  }

  function kafle(ord, fav, adr) {
    var lista = document.getElementById('kafle');
    if (lista) lista.removeAttribute('aria-busy');

    /* Suma wydatków liczy tylko zamówienia, które nie zostały anulowane —
       anulowane nic nie kosztowały. */
    var suma = (ord.data || []).reduce(function (s, o) {
      return o.status === 'Anulowane' ? s : s + (Number(o.total) || 0);
    }, 0);

    wartosc('statZamowienia', (ord.data || []).length);
    wartosc('statWydatki', zl(suma));
    wartosc('statObserwowane', (fav.data || []).length);
    wartosc('statAdresy', (adr.data || []).length);
  }

  function wartosc(id, v) {
    var n = document.getElementById(id);
    if (!n) return;
    n.classList.remove('skeleton', 'skeleton--line');
    n.textContent = v;
  }

  function miniPozycja(p) {
    var nazwa = el('div', { cls: 'mini-item__name' });
    if (p.latin) nazwa.appendChild(el('i', { cls: 'latin', text: p.latin, attr: { lang: 'la' } }));
    nazwa.appendChild(el('span', { text: p.name }));

    var stan = Number(p.stock) || 0;

    return el('li', { cls: 'mini-item' }, [
      p.image
        ? el('img', { cls: 'mini-item__thumb', attr: { src: p.image, alt: '', loading: 'lazy', decoding: 'async', width: 40, height: 40 } })
        : el('span', { cls: 'mini-item__thumb', attr: { 'aria-hidden': 'true' } }),
      nazwa,
      el('span', {
        cls: 'stock' + (stan === 0 ? ' stock--out' : (stan <= 3 ? ' stock--low' : '')),
        text: stan === 0 ? 'brak' : 'dostępna'
      })
    ]);
  }

  function blokOstatnie(o, items, wszystkie) {
    var karta = el('article', { cls: 'order-brief section--light' });

    karta.appendChild(el('div', { cls: 'order-brief__head' }, [
      el('p', {}, [
        el('span', { cls: 'num', text: 'nr ' + o.id }),
        el('span', { cls: 'muted', text: ' · ' }),
        el('span', { cls: 'num', text: data(o.created_at) })
      ]),
      statusEl(o.status)
    ]));

    /* Postęp realizacji — ten sam komponent co w szczegółach zamówienia. */
    karta.appendChild(postep(o));

    if (items.length) {
      var thumbs = el('ul', { cls: 'thumbs' });
      items.slice(0, 4).forEach(function (i) {
        thumbs.appendChild(el('li', {}, [miniatura(i.image, i.name)]));
      });
      if (items.length > 4) {
        thumbs.appendChild(el('li', {}, [
          el('span', { cls: 'thumbs__more num', text: '+' + (items.length - 4) })
        ]));
      }
      karta.appendChild(thumbs);
    }

    /* Numer przesyłki ląduje tutaj, kiedy zamówienie jest w drodze. */
    if (o.tracking_number && o.status === 'Wysłane') {
      karta.appendChild(elPrzesylka(o));
    }

    karta.appendChild(el('p', {}, [
      el('span', { cls: 'num', text: zl(o.total) }),
      el('span', { cls: 'muted', text: ' · ' }),
      el('a', {
        cls: 'btn btn--underline',
        text: 'Szczegóły',
        attr: { href: 'konto-zamowienie-nf.html?nr=' + encodeURIComponent(o.id) }
      })
    ]));

    /* Starsze zamówienia jako jedna linijka, nie druga tabela — pełna
       lista ma własny widok. */
    var starsze = (wszystkie || []).slice(1, 4);
    if (!starsze.length) return karta;

    var ul = el('ul', { cls: 'mini-list' });
    starsze.forEach(function (s) {
      ul.appendChild(el('li', { cls: 'mini-item' }, [
        el('span', { cls: 'mini-item__thumb', attr: { 'aria-hidden': 'true' } }),
        el('div', { cls: 'mini-item__name' }, [
          el('a', { cls: 'table__link num', text: s.id, attr: { href: 'konto-zamowienie-nf.html?nr=' + encodeURIComponent(s.id) } }),
          el('span', { cls: 'muted small', text: ' · ' + data(s.created_at) })
        ]),
        statusEl(s.status)
      ]));
    });

    return el('div', { cls: 'panel__block' }, [karta, ul]);
  }

  /* --- Postęp realizacji (.progress) ---------------------------------------
     Cztery etapy, przez które przechodzi każde zamówienie. Stan czytamy
     z jednej kolumny `status`, bo dat poszczególnych etapów baza nie
     trzyma — pasek pokazuje więc, gdzie zamówienie jest, a nie kiedy
     zmieniało etapy. */
  var ETAPY = ['Przyjęte', 'W realizacji', 'Wysłane', 'Dostarczone'];

  function etapIndeks(s) {
    if (s === 'Nowe') return 0;
    if (s === 'W realizacji') return 1;
    if (s === 'Wysłane') return 2;
    if (s === 'Dostarczone') return 3;
    return -1;
  }

  function postep(o) {
    var anulowane = o.status === 'Anulowane';
    var teraz = anulowane ? -1 : etapIndeks(o.status);

    var ol = el('ol', {
      cls: 'progress' + (anulowane ? ' progress--cancelled' : ''),
      attr: { 'aria-label': 'Postęp realizacji zamówienia' }
    });

    ETAPY.forEach(function (nazwa, i) {
      var stan = i < teraz ? 'is-done' : (i === teraz ? 'is-current' : '');
      var opis = i < teraz ? 'etap ukończony' : (i === teraz ? 'etap bieżący' : 'etap przed nami');

      ol.appendChild(el('li', {
        cls: 'progress__step ' + stan,
        attr: i === teraz ? { 'aria-current': 'step' } : {}
      }, [
        el('span', { cls: 'progress__mark', attr: { 'aria-hidden': 'true' } }),
        el('span', { cls: 'progress__label' }, [
          el('span', { text: nazwa }),
          el('span', { cls: 'visually-hidden', text: ' — ' + opis })
        ])
      ]));
    });

    if (!anulowane) return ol;

    return el('div', { cls: 'panel__block' }, [
      ol,
      el('p', { cls: 'muted small', text: 'Zamówienie zostało anulowane — realizacja się zatrzymała.' })
    ]);
  }

  function elPrzesylka(o) {
    var wiersz = el('p', {}, [el('span', { cls: 'muted', text: 'Numer przesyłki: ' })]);
    var url = SLEDZENIE[o.carrier];
    if (url) {
      wiersz.appendChild(el('a', {
        cls: 'num', text: o.tracking_number,
        attr: { href: url + encodeURIComponent(o.tracking_number), rel: 'noopener noreferrer', target: '_blank' }
      }));
    } else {
      wiersz.appendChild(el('span', { cls: 'num', text: o.tracking_number }));
      if (o.carrier) wiersz.appendChild(el('span', { cls: 'muted', text: ' · ' + o.carrier }));
    }
    return wiersz;
  }

  /* ========================================================================
     WIDOK 2 — Lista zamówień (/konto/zamowienia)
     ====================================================================== */

  function widokZamowienia() {
    var filtr = document.getElementById('filtrStatus');
    var wszystkie = [];

    zamowienia().then(function (r) {
      if (r.error) return bladWczytania('slotTabela');
      wszystkie = r.data;

      if (!wszystkie.length) {
        podmien('slotTabela', pusty('Nie masz jeszcze żadnych zamówień.'));
        if (filtr) filtr.disabled = true;
        return;
      }

      return pozycje(wszystkie.map(function (o) { return o.id; })).then(function (pi) {
        var ile = {};
        (pi.error ? [] : pi.data).forEach(function (i) {
          ile[i.order_id] = (ile[i.order_id] || 0) + (Number(i.qty) || 0);
        });
        rysuj(wszystkie, ile, filtr ? filtr.value : '');
        if (filtr) {
          filtr.addEventListener('change', function () { rysuj(wszystkie, ile, filtr.value); });
        }
      });
    }).catch(function () { bladWczytania('slotTabela'); });

    function rysuj(lista, ile, wybrany) {
      var widoczne = lista.filter(function (o) {
        return !wybrany || status(o.status).label === wybrany;
      });

      var licznik = document.getElementById('licznikZamowien');
      if (licznik) {
        licznik.textContent = widoczne.length === lista.length
          ? widoczne.length + ' z ' + lista.length
          : widoczne.length + ' z ' + lista.length + ' po filtrze';
      }

      if (!widoczne.length) {
        podmien('slotTabela', el('div', { cls: 'empty' }, [
          el('p', { text: 'Żadne zamówienie nie ma statusu „' + wybrany + '”.' })
        ]));
        return;
      }

      var thead = el('thead', {}, [el('tr', {}, [
        el('th', { text: 'Zamówienie', attr: { scope: 'col' } }),
        el('th', { text: 'Data', attr: { scope: 'col' } }),
        el('th', { text: 'Pozycje', attr: { scope: 'col' } }),
        el('th', { cls: 'th--right', text: 'Kwota', attr: { scope: 'col' } }),
        el('th', { text: 'Status', attr: { scope: 'col' } })
      ])]);

      var tbody = el('tbody');
      widoczne.forEach(function (o) {
        tbody.appendChild(el('tr', {}, [
          el('td', { attr: { 'data-label': 'Zamówienie' } }, [
            el('a', {
              cls: 'table__link num', text: o.id,
              attr: { href: 'konto-zamowienie-nf.html?nr=' + encodeURIComponent(o.id) }
            })
          ]),
          el('td', { cls: 'num', text: data(o.created_at), attr: { 'data-label': 'Data' } }),
          el('td', { cls: 'num', text: ile[o.id] || 0, attr: { 'data-label': 'Pozycje' } }),
          el('td', { cls: 'num td--right', text: zl(o.total), attr: { 'data-label': 'Kwota' } }),
          el('td', { attr: { 'data-label': 'Status' } }, [statusEl(o.status)])
        ]));
      });

      var tabela = el('table', { cls: 'table' }, [
        el('caption', { cls: 'visually-hidden', text: 'Twoje zamówienia' }),
        thead, tbody
      ]);
      podmien('slotTabela', el('div', { cls: 'table-wrap panel-card section--light' }, [tabela]));
    }

    /* Filtr wypełniamy z tego samego słownika, z którego bierze się etykieta
       w tabeli — inaczej łatwo o pozycję, która nic nie filtruje. */
    if (filtr) {
      FILTRY.forEach(function (s) {
        filtr.appendChild(el('option', { text: s, attr: { value: s } }));
      });
    }
  }


  /* ========================================================================
     WIDOK 3 — Szczegóły zamówienia (/konto/zamowienia/[id])
     ====================================================================== */

  function widokZamowienie() {
    var nr = new URLSearchParams(location.search).get('nr');
    if (!nr) { podmien('slotZamowienie', pusty('Nie podano numeru zamówienia.', 'Wróć do listy', 'konto-zamowienia-nf.html')); return; }

    sb.from('orders')
      .select('id, total, status, created_at, tracking_number, carrier, delivery_method, payment_method, payment, address_snapshot')
      .eq('user_id', user.id)
      .eq('id', nr)
      .maybeSingle()
      .then(function (r) {
        if (r.error) return bladWczytania('slotZamowienie');
        if (!r.data) {
          podmien('slotZamowienie', pusty('Nie znaleźliśmy tego zamówienia na Twoim koncie.', 'Wróć do listy', 'konto-zamowienia-nf.html'));
          return;
        }
        var o = r.data;
        return pozycje([o.id]).then(function (pi) {
          rysujZamowienie(o, pi.error ? [] : pi.data);
        });
      })
      .catch(function () { bladWczytania('slotZamowienie'); });
  }

  function rysujZamowienie(o, items) {
    var tytul = document.getElementById('tytulZamowienia');
    if (tytul) {
      /* Mono dostaje sam numer, nie całe zdanie: w nagłówku H2 monospace
         na całości robi się bardzo szeroki i na telefonie łamie tytuł
         w połowie słowa. */
      tytul.textContent = 'Zamówienie ';
      tytul.appendChild(el('span', { cls: 'num', text: o.id }));
    }
    document.title = 'Zamówienie ' + o.id + ' — Nature & Future';

    var korzen = el('div', { cls: 'panel__main' });

    /* Nagłówek: status słowem, pasek postępu, numer przesyłki. Pasek
       pokazuje, gdzie zamówienie jest w drodze; słowo obok zostaje, bo
       sam pasek nie jest etykietą (8A, zasada 3). */
    korzen.appendChild(el('section', { cls: 'panel-card section--light' }, [
      el('div', { cls: 'order-brief__head' }, [
        el('p', {}, [
          statusEl(o.status),
          el('span', { cls: 'muted', text: ' · złożone ' }),
          el('span', { cls: 'num', text: data(o.created_at) })
        ]),
        o.delivery_method ? el('p', { cls: 'muted small', text: o.delivery_method }) : null
      ]),
      postep(o),
      o.tracking_number ? elPrzesylka(o) : null
    ]));

    /* Pozycje */
    var lista = el('ul', { cls: 'items' });
    var suma = 0;
    items.forEach(function (i) {
      suma += (Number(i.price) || 0) * (Number(i.qty) || 0);

      var nazwa = el('div', { cls: 'item__name' });
      if (i.latin) nazwa.appendChild(el('i', { cls: 'latin', text: i.latin, attr: { lang: 'la' } }));
      nazwa.appendChild(el('span', { cls: 'specimen-name', text: i.name }));

      lista.appendChild(el('li', { cls: 'item' }, [
        miniatura(i.image, ''),
        nazwa,
        el('p', { cls: 'item__money' }, [
          el('span', { cls: 'num', text: '×' + (i.qty || 0) }),
          el('br'),
          el('span', { cls: 'num', text: zl((Number(i.price) || 0) * (Number(i.qty) || 0)) })
        ])
      ]));
    });

    korzen.appendChild(el('section', { cls: 'panel-card section--light' }, [
      el('h2', { cls: 'h3', text: 'Pozycje' }),
      items.length ? lista : el('p', { cls: 'muted', text: 'Ta pozycja zamówienia nie jest już dostępna.' })
    ]));

    /* Podsumowanie kwot */
    var dostawa = Number(o.total) - suma;
    var totals = el('dl', { cls: 'totals' }, [
      el('dt', { text: 'Rośliny' }),
      el('dd', { cls: 'num', text: zl(suma) })
    ]);
    if (items.length && Math.abs(dostawa) >= 0.01) {
      totals.appendChild(el('dt', { text: 'Dostawa' }));
      totals.appendChild(el('dd', { cls: 'num', text: zl(dostawa) }));
    }
    totals.appendChild(el('dt', { cls: 'totals__sum', text: 'Razem' }));
    totals.appendChild(el('dd', { cls: 'num totals__sum', text: zl(o.total) }));

    korzen.appendChild(el('section', { cls: 'panel-card section--light' }, [
      el('h2', { cls: 'h3', text: 'Podsumowanie' }),
      totals
    ]));

    /* Adres dostawy — ze zrzutu zapisanego przy składaniu zamówienia,
       nie z bieżącej listy adresów: adres mógł się od tamtej pory zmienić. */
    korzen.appendChild(el('section', { cls: 'panel-card section--light' }, [
      el('h2', { cls: 'h3', text: 'Adres dostawy' }),
      blokAdresu(o)
    ]));

    /* Opieka po dostawie */
    korzen.appendChild(sekcjaOpieka(items));

    podmien('slotZamowienie', korzen);
  }

  function blokAdresu(o) {
    var a = o.address_snapshot;
    if (!a || typeof a !== 'object') {
      return el('p', { cls: 'muted', text: 'Adres nie został zapisany przy tym zamówieniu.' });
    }
    var box = el('div', { cls: 'addr' });
    [a.full_name, a.street].forEach(function (w) {
      if (w) box.appendChild(el('p', { cls: 'addr__lines', text: w }));
    });
    var miasto = [a.postal, a.city].filter(Boolean).join(' ');
    if (miasto) box.appendChild(el('p', { cls: 'addr__lines num', text: miasto }));
    if (o.delivery_method) box.appendChild(el('p', { cls: 'muted small', text: 'Dostawa: ' + o.delivery_method }));
    return box;
  }

  /* Opieka po dostawie — najbardziej użyteczna rzecz, jaką panel może zrobić:
     roślina in vitro po rozpakowaniu wymaga konkretnych kroków, a klient
     szuka tej informacji właśnie tutaj.

     <!-- TREŚĆ DO POTWIERDZENIA: instrukcji aklimatyzacji nie ma jeszcze
          nigdzie w bazie — ani kolumny w products, ani wpisu w site_content.
          Sekcja wypisuje kupione gatunki i czeka na treść; kiedy się pojawi,
          podmienia się tu wyłącznie href. --> */
  function sekcjaOpieka(items) {
    var lista = el('ul', { cls: 'care-list' });

    var gatunki = [];
    items.forEach(function (i) {
      var klucz = i.latin || i.name;
      if (klucz && gatunki.indexOf(klucz) === -1) {
        gatunki.push(klucz);
        lista.appendChild(el('li', {}, [
          i.latin ? el('i', { cls: 'latin', text: i.latin, attr: { lang: 'la' } }) : null,
          el('span', { text: i.name }),
          el('span', { cls: 'muted small', text: '— instrukcja w przygotowaniu' })
        ]));
      }
    });

    return el('section', { cls: 'panel-card section--light' }, [
      el('h2', { cls: 'h3', text: 'Opieka po dostawie' }),
      el('p', { cls: 'muted', text: 'Roślina z kultury in vitro po rozpakowaniu przechodzi aklimatyzację. Instrukcje dla kupionych gatunków przygotowujemy — do tego czasu napisz do nas, a podpowiemy krok po kroku.' }),
      gatunki.length ? lista : null,
      el('a', { cls: 'btn btn--secondary', text: 'Zapytaj o aklimatyzację', attr: { href: 'mailto:kontakt@nfplantbiotech.com?subject=' + encodeURIComponent('Aklimatyzacja roślin') } })
    ]);
  }


  /* ========================================================================
     WIDOK 4 — Dane i adresy (/konto/dane)
     ====================================================================== */

  function widokDane() {
    formularzProfilu();
    listaAdresow();
    formularzAdresu();
  }

  /* --- Dane konta ---------------------------------------------------------- */

  function formularzProfilu() {
    var form = document.getElementById('formProfil');
    if (!form) return;

    var przycisk = form.querySelector('[data-save]');
    var nota = form.querySelector('[data-note]');
    var poczatkowe = null;

    function biezace() {
      return {
        full_name: form.elements.full_name.value.trim(),
        phone: form.elements.phone.value.trim()
      };
    }

    /* Zapis jawny: przycisk nieaktywny, dopóki nic się nie zmieniło. */
    function odswiezPrzycisk() {
      if (!poczatkowe) return;
      var b = biezace();
      przycisk.disabled = b.full_name === poczatkowe.full_name && b.phone === poczatkowe.phone;
    }

    sb.from('profiles').select('full_name, phone, email').eq('id', user.id).maybeSingle()
      .then(function (r) {
        var p = (r && r.data) || {};
        form.elements.full_name.value = p.full_name || '';
        form.elements.phone.value = p.phone || '';
        form.elements.email.value = p.email || user.email || '';
        poczatkowe = biezace();
        przycisk.disabled = true;
        form.removeAttribute('aria-busy');
        form.hidden = false;
        var szkielet = document.getElementById('szkieletProfil');
        if (szkielet) szkielet.remove();
      });

    form.addEventListener('input', function () { nota.textContent = ''; odswiezPrzycisk(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = biezace();
      przycisk.disabled = true;
      nota.textContent = '';
      nota.className = 'form-note';

      sb.from('profiles').update({ full_name: b.full_name, phone: b.phone }).eq('id', user.id)
        .then(function (r) {
          if (r.error) {
            nota.className = 'form-note form-note--error';
            nota.textContent = 'Nie udało się zapisać. Spróbuj jeszcze raz.';
            przycisk.disabled = false;
            return;
          }
          poczatkowe = b;
          nota.textContent = 'Zapisano.';
        });
    });
  }

  /* --- Adresy --------------------------------------------------------------- */

  function listaAdresow() {
    adresy().then(function (r) {
      if (r.error) return bladWczytania('slotAdresy');

      if (!r.data.length) {
        podmien('slotAdresy', el('div', { cls: 'empty' }, [
          el('p', { text: 'Nie masz jeszcze zapisanego adresu. Dodaj pierwszy, żeby zamawianie szło szybciej.' })
        ]));
        return;
      }

      var ul = el('ul', { cls: 'addr-list' });
      r.data.forEach(function (a) { ul.appendChild(kartaAdresu(a)); });
      podmien('slotAdresy', ul);
    }).catch(function () { bladWczytania('slotAdresy'); });
  }

  function kartaAdresu(a) {
    var li = el('li', { cls: 'addr section--light' + (a.is_default ? ' addr--default' : '') });

    var head = el('p', {}, [el('strong', { text: a.label || 'Adres' })]);
    if (a.is_default) head.appendChild(el('span', { cls: 'tag', text: 'Domyślny' }));
    li.appendChild(head);

    [a.full_name, a.street].forEach(function (w) {
      if (w) li.appendChild(el('p', { cls: 'addr__lines', text: w }));
    });
    var miasto = [a.postal, a.city].filter(Boolean).join(' ');
    if (miasto) li.appendChild(el('p', { cls: 'addr__lines num', text: miasto }));
    if (a.phone) li.appendChild(el('p', { cls: 'addr__lines num', text: a.phone }));

    var akcje = el('div', { cls: 'addr__actions' });

    var edytuj = el('button', { cls: 'btn btn--secondary btn--small', text: 'Edytuj', attr: { type: 'button' } });
    edytuj.addEventListener('click', function () { otworzFormularzAdresu(a); });
    akcje.appendChild(edytuj);

    if (!a.is_default) {
      var domyslny = el('button', { cls: 'btn btn--secondary btn--small', text: 'Ustaw domyślny', attr: { type: 'button' } });
      domyslny.addEventListener('click', function () { ustawDomyslny(a); });
      akcje.appendChild(domyslny);
    }

    var usun = el('button', { cls: 'btn btn--secondary btn--small', text: 'Usuń', attr: { type: 'button' } });
    usun.addEventListener('click', function () {
      potwierdz({
        tytul: 'Usunąć adres „' + (a.label || 'Adres') + '”?',
        opis: [a.full_name, a.street, miasto].filter(Boolean).join(', ') + '. Tego nie da się cofnąć.',
        czasownik: 'Usuń adres',
        onPotwierdz: function () {
          sb.from('addresses').delete().eq('id', a.id).eq('user_id', user.id).then(function () { listaAdresow(); });
        }
      });
    });
    akcje.appendChild(usun);

    li.appendChild(akcje);
    return li;
  }

  function ustawDomyslny(a) {
    sb.from('addresses').update({ is_default: false }).eq('user_id', user.id)
      .then(function () {
        return sb.from('addresses').update({ is_default: true }).eq('id', a.id).eq('user_id', user.id);
      })
      .then(function () { listaAdresow(); });
  }

  var edytowanyAdres = null;

  function otworzFormularzAdresu(a) {
    var form = document.getElementById('formAdres');
    if (!form) return;
    edytowanyAdres = a || null;

    form.hidden = false;
    form.querySelector('[data-addr-title]').textContent = a ? 'Edytuj adres' : 'Nowy adres';
    ['label', 'full_name', 'street', 'postal', 'city', 'phone'].forEach(function (k) {
      form.elements[k].value = (a && a[k]) || '';
    });
    form.querySelector('[data-note]').textContent = '';

    /* Formularz otwarty na nowo nie może nieść błędów z poprzedniego razu. */
    Array.prototype.forEach.call(form.querySelectorAll('.field__error'), function (p) {
      p.hidden = true; p.textContent = '';
    });
    Array.prototype.forEach.call(form.querySelectorAll('.input--error'), function (i) {
      i.classList.remove('input--error'); i.removeAttribute('aria-invalid');
    });

    form.elements.label.focus();
  }

  function formularzAdresu() {
    var form = document.getElementById('formAdres');
    var dodaj = document.getElementById('dodajAdres');
    if (!form) return;

    if (dodaj) dodaj.addEventListener('click', function () { otworzFormularzAdresu(null); });

    var anuluj = form.querySelector('[data-cancel]');
    if (anuluj) anuluj.addEventListener('click', function () {
      form.hidden = true;
      edytowanyAdres = null;
      if (dodaj) dodaj.focus();
    });

    /* Walidacja pól wymaganych. Komunikat mówi co zrobić, jest powiązany
       z polem przez aria-describedby i znika, kiedy pole przestaje być
       puste — czytnik ekranu dostaje to samo, co oko. */
    var WYMAGANE = [
      { pole: 'full_name', err: 'aNameErr',   tekst: 'Podaj imię i nazwisko odbiorcy.' },
      { pole: 'street',    err: 'aStreetErr', tekst: 'Podaj ulicę i numer.' },
      { pole: 'city',      err: 'aCityErr',   tekst: 'Podaj miejscowość.' }
    ];

    function wyczyscBledy() {
      WYMAGANE.forEach(function (w) {
        var input = form.elements[w.pole];
        var err = document.getElementById(w.err);
        input.classList.remove('input--error');
        input.removeAttribute('aria-invalid');
        if (err) { err.hidden = true; err.textContent = ''; }
      });
    }

    function sprawdz() {
      wyczyscBledy();
      var pierwsze = null;
      WYMAGANE.forEach(function (w) {
        var input = form.elements[w.pole];
        if (input.value.trim()) return;
        var err = document.getElementById(w.err);
        input.classList.add('input--error');
        input.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = w.tekst; err.hidden = false; }
        if (!pierwsze) pierwsze = input;
      });
      if (pierwsze) pierwsze.focus();
      return !pierwsze;
    }

    form.addEventListener('input', function (e) {
      if (e.target.value.trim()) {
        var w = WYMAGANE.filter(function (x) { return form.elements[x.pole] === e.target; })[0];
        if (!w) return;
        var err = document.getElementById(w.err);
        e.target.classList.remove('input--error');
        e.target.removeAttribute('aria-invalid');
        if (err) { err.hidden = true; err.textContent = ''; }
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nota = form.querySelector('[data-note]');
      nota.className = 'form-note';
      nota.textContent = '';

      if (!sprawdz()) return;

      var dane = {
        user_id: user.id,
        label: form.elements.label.value.trim() || 'Adres',
        full_name: form.elements.full_name.value.trim(),
        street: form.elements.street.value.trim(),
        postal: form.elements.postal.value.trim(),
        city: form.elements.city.value.trim(),
        phone: form.elements.phone.value.trim()
      };

      var zapytanie = edytowanyAdres
        ? sb.from('addresses').update(dane).eq('id', edytowanyAdres.id).eq('user_id', user.id)
        : sb.from('addresses').insert(dane);

      zapytanie.then(function (r) {
        if (r.error) {
          nota.className = 'form-note form-note--error';
          nota.textContent = 'Nie udało się zapisać adresu. Sprawdź pola i spróbuj ponownie.';
          return;
        }
        form.hidden = true;
        edytowanyAdres = null;
        listaAdresow();
      });
    });
  }


  /* ========================================================================
     WIDOK 5 — Zapisane rośliny (/konto/ulubione)
     ====================================================================== */

  function widokUlubione() {
    ulubione().then(function (r) {
      if (r.error) return bladWczytania('slotUlubione');

      var zapisane = r.data.filter(function (w) { return w.products; });

      if (!zapisane.length) {
        podmien('slotUlubione', pusty('Nie zapisałeś jeszcze żadnej rośliny. Serce na karcie w sklepie dodaje ją tutaj.'));
        return;
      }

      /* Liczba kolumn zależna od liczby pozycji (rozdz. 8.1) — ta sama
         zasada co w sklepie: nigdy niepełny rząd w trójce. */
      var kolumny = zapisane.length === 1 ? 1 : (zapisane.length === 2 || zapisane.length === 4 ? 2 : 3);

      var grid = el('div', { cls: 'listing', attr: { style: '--listing-cols:' + kolumny } });
      zapisane.forEach(function (w) { grid.appendChild(kartaUlubionej(w)); });
      podmien('slotUlubione', grid);
    }).catch(function () { bladWczytania('slotUlubione'); });
  }

  function kartaUlubionej(w) {
    var p = w.products;
    var art = el('article', { cls: 'card section--light' });

    var foto = el('div', { cls: 'card__photo' });
    if (p.tag) foto.appendChild(el('span', { cls: 'tag', text: p.tag }));
    if (p.image) {
      foto.appendChild(el('img', { attr: { src: p.image, alt: '', loading: 'lazy', decoding: 'async' } }));
    }
    var stan = Number(p.stock) || 0;
    foto.appendChild(el('span', {
      cls: 'stock' + (stan === 0 ? ' stock--out' : (stan <= 3 ? ' stock--low' : '')),
      text: stan === 0 ? 'brak' : stan + ' dostępne'
    }));
    art.appendChild(foto);

    var nazwa = el('p');
    if (p.latin) nazwa.appendChild(el('i', { cls: 'latin', text: p.latin, attr: { lang: 'la' } }));
    nazwa.appendChild(el('span', { cls: 'specimen-name', text: p.name }));
    art.appendChild(el('div', { cls: 'card__body' }, [nazwa]));

    /* Karta produktu wchodzi do panelu bez zmian — z różowym „Do koszyka”
       jak w sklepie (8.1). Ta sama roślina, ta sama akcja, ten sam przycisk;
       inny kolor tylko dlatego, że karta stoi w panelu, byłby niespójnością,
       nie oszczędnością. */
    var doKoszyka = el('button', {
      cls: 'btn btn--primary btn--small',
      text: 'Do koszyka',
      attr: { type: 'button' }
    });
    if (stan === 0) doKoszyka.disabled = true;
    doKoszyka.addEventListener('click', function () { dodajDoKoszyka(p, doKoszyka); });

    art.appendChild(el('div', { cls: 'card__foot' }, [
      el('p', {}, [
        el('span', { cls: 'price num', text: zl(p.price) }),
        el('br'),
        el('span', { cls: 'price-note muted', text: p.unit || 'szt.' })
      ]),
      doKoszyka
    ]));

    var usun = el('button', {
      cls: 'btn btn--underline btn--small',
      text: 'Usuń z listy',
      attr: { type: 'button' }
    });
    usun.addEventListener('click', function () {
      potwierdz({
        tytul: 'Usunąć „' + p.name + '” z zapisanych?',
        opis: 'Roślina zniknie z tej listy. Zawsze możesz zapisać ją ponownie w sklepie.',
        czasownik: 'Usuń z listy',
        onPotwierdz: function () {
          sb.from('watched_products').delete().eq('id', w.id).eq('user_id', user.id)
            .then(function () { widokUlubione(); });
        }
      });
    });
    art.appendChild(usun);

    return art;
  }

  /* Nowy front nie ma jeszcze wspólnego koszyka — przycisk w sklepie -nf
     jest atrapą. Panel pisze więc wprost do cart_items, tabeli, z której
     korzysta checkout. */
  function dodajDoKoszyka(p, przycisk) {
    przycisk.disabled = true;
    sb.from('cart_items').select('id, qty').eq('user_id', user.id).eq('product_id', p.id).maybeSingle()
      .then(function (r) {
        if (r && r.data) {
          return sb.from('cart_items').update({ qty: (Number(r.data.qty) || 0) + 1 }).eq('id', r.data.id);
        }
        return sb.from('cart_items').insert({ user_id: user.id, product_id: p.id, qty: 1 });
      })
      .then(function (r) {
        if (r && r.error) { przycisk.disabled = false; przycisk.textContent = 'Spróbuj ponownie'; return; }
        przycisk.textContent = 'W koszyku';
      })
      .catch(function () { przycisk.disabled = false; przycisk.textContent = 'Spróbuj ponownie'; });
  }


  /* --- Start ---------------------------------------------------------------- */

  var WIDOKI = {
    przeglad:   widokPrzeglad,
    zamowienia: widokZamowienia,
    zamowienie: widokZamowienie,
    dane:       widokDane,
    ulubione:   widokUlubione
  };

  function start() {
    sb = window.supabaseClient;
    if (!sb) { setTimeout(start, 60); return; }

    nawigacja();

    /* Przycisk wycofania zamyka modal zawsze tak samo, niezależnie od tego,
       co modal akurat potwierdza — dlatego stoi tu, a nie w potwierdz(). */
    var anulujModal = document.querySelector('#panelModal [data-modal-cancel]');
    if (anulujModal) {
      anulujModal.addEventListener('click', function () {
        document.getElementById('panelModal').close();
      });
    }

    sb.auth.getSession().then(function (r) {
      var session = r && r.data && r.data.session;
      if (!session) { naLogowanie(); return; }
      user = session.user;

      narzedziaPersonelu();
      koszyk();

      var widok = WIDOKI[document.body.getAttribute("data-view")];
      if (widok) widok();
    });

    /* Wylogowanie w innej karcie ma zamknąć panel także tutaj. */
    sb.auth.onAuthStateChange(function (_e, session) {
      if (!session && user) naLogowanie();
    });

    var wyloguj = document.getElementById('wyloguj');
    if (wyloguj) {
      wyloguj.addEventListener('click', function () {
        sb.auth.signOut().then(function () { location.replace('index-nf.html'); });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
