/* ============================================================================
 * Nature & Future — edytor treści inline (WYSIWYG) dla Admina/Moderatora
 * ----------------------------------------------------------------------------
 * Jak działa:
 *  1) Skrypt AUTOMATYCZNIE wykrywa wszystkie bloki tekstu (nagłówki, akapity,
 *     opisy w <div>/<td> itp.) oraz zdjęcia w treści strony i nadaje każdemu
 *     STABILNY klucz liczony z jego treści + sekcji. Elementy z ręcznym
 *     atrybutem data-edit-key mają pierwszeństwo (klucz czytelny).
 *  2) Po renderze (strony renderowane dynamicznie przez support.js/<x-dc>,
 *     dlatego czekamy MutationObserverem) skrypt wczytuje z Supabase nadpisania
 *     treści dla danej strony i języka i wstawia je do elementów — zmiana jest
 *     widoczna od razu dla KAŻDEGO odwiedzającego.
 *  3) TRYB EDYCJI jest domyślnie WYŁĄCZONY. Włącza się go świadomie: przyciskiem
 *     w panelu („Edytuj treść strony" → link `...?edit=1`) albo gdy w localStorage
 *     jest `nf-edit-mode=1`. Dopiero wtedy — i tylko dla personelu (rank>=10) —
 *     przy elementach pojawia się ołówek → edycja w miejscu → Zapisz/Anuluj.
 *     Górny pasek pokazuje, że tryb jest aktywny, i pozwala go zakończyć.
 *     Dzięki temu podczas zwykłego przeglądania nic nie da się przypadkiem zmienić.
 *
 * Zapis → tabela public.site_content (RLS: zapis tylko dla personelu).
 * Zdjęcia → bucket storage "site-images". Treści objęte kopiami zapasowymi
 * (site_content jest w DB_TABLES w sklep.html).
 * ========================================================================== */
(function () {
  'use strict';

  var ACCENT = '#c69a4c';   // mosiądz
  var GREEN  = '#8aba82';   // zieleń
  var EDIT_FLAG = 'nf-edit-mode';

  // Elementy „inline" — blok z samymi takimi dziećmi traktujemy jako jeden
  // edytowalny kawałek tekstu (zachowujemy wewnętrzne formatowanie).
  // A (link) jest tu traktowany jako inline — dzięki temu blok zawierający linki
  // (np. kolumna nawigacji w stopce, rząd przycisków) jest edytowalny jako całość,
  // można w nim zmieniać teksty i hiperłącza.
  var INLINE = { SPAN:1, B:1, I:1, EM:1, STRONG:1, BR:1, SMALL:1, SUP:1, SUB:1,
                 U:1, MARK:1, ABBR:1, TIME:1, WBR:1, S:1, FONT:1, A:1 };
  // Elementów tych nigdy nie kluczujemy jako samodzielny blok.
  var SKIP_TAG = { A:1, BUTTON:1, INPUT:1, SELECT:1, OPTION:1, TEXTAREA:1,
                   SCRIPT:1, STYLE:1, NAV:1, SVG:1, PATH:1, VIDEO:1, IFRAME:1 };

  // --- Info o stronie: page = nazwa pliku bez .html i bez sufiksu -en -----
  function getPageInfo() {
    var file = (location.pathname.split('/').pop() || 'index.html')
      .replace(/\.html$/, '') || 'index';
    var lang = /-en$/.test(file) ? 'en' : 'pl';
    var page = file.replace(/-en$/, '');
    return { page: page, lang: lang };
  }

  var INFO = getPageInfo();
  var overrides = {};          // key -> { type, value }
  var editingEl = null;        // element aktualnie edytowany (pomijamy w apply)
  var staff = false;
  var editMode = false;
  var reobs = null;            // MutationObserver wznawiający applyAll po zmianach DOM
  var applying = false;        // strażnik przed rekurencją własnych mutacji

  function sb() { return window.supabaseClient; }
  function css(el, s) { for (var k in s) el.style[k] = s[k]; }

  // --- Klucz elementu -----------------------------------------------------
  function hashStr(str) {
    var h = 5381, i = str.length;
    while (i) h = (h * 33) ^ str.charCodeAt(--i);
    return (h >>> 0).toString(36);
  }
  function normText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  }
  function sectionLabel(el) {
    var s = el.closest ? el.closest('[data-screen-label]') : null;
    return s ? s.getAttribute('data-screen-label') : '';
  }
  function computeKey(el) {
    var manual = el.getAttribute('data-edit-key');
    if (manual) return manual;
    if (el.tagName === 'IMG') {
      return 'img_' + hashStr((el.getAttribute('src') || ''));
    }
    return el.tagName.toLowerCase() + '_' + hashStr(sectionLabel(el) + '|' + normText(el));
  }

  function isInFooter(el) {
    return !!(el.closest && el.closest('#nf-footer'));
  }

  // --- Czy element to edytowalny liść tekstu? -----------------------------
  function isEditableText(el) {
    if (SKIP_TAG[el.tagName]) return false;
    if (INLINE[el.tagName]) return false;
    if (el.closest('.nf-nav, .nf-lang, header, a, button, select, [data-nf-skip]')) return false;
    if (!normText(el)) return false;
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      if (!INLINE[kids[i].tagName]) return false;
    }
    return true;
  }
  function isEditableImg(el) {
    if (el.tagName !== 'IMG') return false;
    if (el.closest('.nf-nav, header, button, [data-nf-skip]')) return false;
    return true;
  }

  // --- Skan + nadanie kluczy (jednorazowo na element) ---------------------
  function ensureKeyed() {
    var all = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span,li,td,th,blockquote,figcaption,img,[data-edit-key]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.__nfKeyed) {
        // Reaktywny framework strony (x-dc) potrafi przy re-renderze ZDJĄĆ
        // atrybut data-nf-key, zachowując sam obiekt węzła (i naszą właściwość
        // __nfKeyed). Wtedy element „znika" dla edytora — najazd go nie znajduje,
        // a zapisane treści się nie nakładają. Dlatego przywracamy atrybut.
        if (el.__nfKey && el.getAttribute('data-nf-key') !== el.__nfKey) {
          el.setAttribute('data-nf-key', el.__nfKey);
        }
        continue;
      }
      // Ręczny data-edit-key ma PIERWSZEŃSTWO: taki element jest edytowalny
      // nawet jeśli to element inline (np. <span> z rokiem na osi czasu),
      // który auto-wykrywanie normalnie pomija.
      var manual = el.getAttribute('data-edit-key');
      var type = null;
      if (el.tagName === 'IMG') { if (manual || isEditableImg(el)) type = 'image'; }
      else if (manual || isEditableText(el)) type = 'html';
      if (!type) continue;
      el.__nfKeyed = true;
      el.__nfKey = computeKey(el);
      el.__nfType = type;
      el.setAttribute('data-nf-key', el.__nfKey);
    }
  }

  // --- Nałożenie nadpisań na DOM ------------------------------------------
  // Nasze własne mutacje (ustawianie data-nf-key, src, innerHTML) TEŻ trafiają
  // do MutationObservera. Bez ochrony powstaje pętla: przeglądarka renormalizuje
  // HTML (encje, kolejność atrybutów, style=""), więc porównanie innerHTML !== value
  // zostaje true na zawsze → observer wywołuje applyAll → applyAll ustawia znowu
  // → observer znowu strzela → renderer zamraża. Dlatego:
  //   1) rozłączamy observer na czas applyAll,
  //   2) po podmianie synchronizujemy ov.value z tym, co realnie osiadło w DOM,
  //   3) chronimy się też flagą applying na wypadek reentrancji.
  function applyAll() {
    if (applying) return;
    applying = true;
    if (reobs) reobs.disconnect();
    try {
      ensureKeyed();
      var nodes = document.querySelectorAll('[data-nf-key]');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el === editingEl) continue;
        var ov = overrides[el.__nfKey];
        if (!ov) continue;
        if (el.tagName === 'IMG') {
          if (el.getAttribute('src') !== ov.value) {
            el.setAttribute('src', ov.value);
            ov.value = el.getAttribute('src');
          }
        } else if (el.innerHTML !== ov.value) {
          el.innerHTML = ov.value;
          ov.value = el.innerHTML; // sync po normalizacji HTML przez przeglądarkę
        }
      }
    } finally {
      if (reobs) reobs.observe(document.body, { childList: true, subtree: true });
      applying = false;
    }
  }

  // --- Wczytanie nadpisań z Supabase --------------------------------------
  function loadOverrides() {
    if (!sb()) return Promise.resolve();
    return sb().from('site_content')
      .select('block,type,value,page')
      .in('page', [INFO.page, '_shared'])
      .eq('lang', INFO.lang)
      .then(function (res) {
        if (res.error) { console.warn('[content-editor] load:', res.error.message); return; }
        var rows = res.data || [];
        rows.sort(function (a, b) {
          return (a.page === '_shared' ? 1 : 0) - (b.page === '_shared' ? 1 : 0);
        });
        rows.forEach(function (row) {
          overrides[row.block] = { type: row.type, value: row.value };
        });
        applyAll();
      });
  }

  // --- Sprawdzenie uprawnień personelu ------------------------------------
  // Supabase odtwarza sesję z pamięci ASYNCHRONICZNIE — zaraz po załadowaniu
  // strony getSession() potrafi jeszcze zwrócić null. Dlatego jeśli sesji nie
  // ma od razu, czekamy na zdarzenie onAuthStateChange (INITIAL_SESSION /
  // SIGNED_IN) do 3 s, zamiast od razu wyłączać tryb edycji. Bez tego przy
  // wejściu z panelu ołówki „raz się pojawiały, raz nie".
  function getUserWhenReady() {
    return new Promise(function (resolve) {
      var done = false, sub = null;
      function finish(user) {
        if (done) return; done = true;
        try { if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe(); } catch (e) {}
        resolve(user || null);
      }
      sb().auth.getSession().then(function (r) {
        var user = r && r.data && r.data.session && r.data.session.user;
        if (user) finish(user);
      });
      sub = sb().auth.onAuthStateChange(function (event, session) {
        if (session && session.user) finish(session.user);
      });
      setTimeout(function () { finish(null); }, 3000);
    });
  }

  function checkStaff() {
    if (!sb()) return Promise.resolve(false);
    return getUserWhenReady().then(function (user) {
      if (!user) return false;
      return sb().from('profiles').select('rank').eq('id', user.id).single()
        .then(function (p) { return !!(p && p.data && p.data.rank >= 10); });
    }).catch(function () { return false; });
  }

  // ========================================================================
  //  TRYB EDYCJI (tylko personel, tylko po włączeniu)
  // ========================================================================
  var pencil, toolbar, fileInput, topbar, hoverEl = null;

  function buildUI() {
    pencil = document.createElement('button');
    pencil.type = 'button';
    pencil.title = 'Edytuj';
    pencil.innerHTML = '✎';
    css(pencil, {
      position: 'absolute', zIndex: 99999, display: 'none',
      width: '30px', height: '30px', lineHeight: '28px', padding: '0',
      textAlign: 'center', fontSize: '15px', cursor: 'pointer',
      color: '#0a1a0c', background: 'linear-gradient(180deg,' + GREEN + ',#3d6a38)',
      border: '1px solid ' + GREEN, borderRadius: '6px',
      boxShadow: '0 2px 10px rgba(0,0,0,.5)'
    });
    pencil.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (hoverEl) startEdit(hoverEl);
    });
    document.body.appendChild(pencil);

    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Górny pasek: informacja + zakończenie trybu edycji
    topbar = document.createElement('div');
    topbar.setAttribute('data-nf-skip', '');
    css(topbar, {
      position: 'fixed', left: '0', right: '0', top: '0', zIndex: 99998,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
      fontFamily: "'Space Mono',monospace", fontSize: '12px', letterSpacing: '.04em',
      color: '#0a1a0c', background: ACCENT, padding: '9px 16px',
      boxShadow: '0 2px 12px rgba(0,0,0,.4)'
    });
    var label = document.createElement('span');
    label.innerHTML = '✎ Tryb edycji treści aktywny — najedź na tekst lub zdjęcie i kliknij ołówek. Strona: <b>' +
      INFO.page + '</b> (' + INFO.lang.toUpperCase() + ')';
    var endBtn = document.createElement('button');
    endBtn.type = 'button';
    endBtn.textContent = 'Zakończ edycję ✕';
    css(endBtn, {
      cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '11px',
      letterSpacing: '.08em', textTransform: 'uppercase', color: '#0a1a0c',
      background: 'rgba(0,0,0,.12)', border: '1px solid rgba(0,0,0,.35)',
      borderRadius: '5px', padding: '6px 12px'
    });
    endBtn.addEventListener('click', endEditMode);
    topbar.appendChild(label);
    topbar.appendChild(endBtn);
    document.body.appendChild(topbar);
    document.body.style.paddingTop = '38px'; // miejsce na pasek

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-nf-key]') : null;
      if (!t) {
        var els = document.elementsFromPoint(e.clientX, e.clientY);
        for (var i = 0; i < els.length; i++) {
          if (els[i].hasAttribute && els[i].hasAttribute('data-nf-key')) { t = els[i]; break; }
        }
      }
      if (t && t !== editingEl) { hoverEl = t; positionPencil(t); }
    }, true);
    window.addEventListener('scroll', function () {
      if (pencil) pencil.style.display = 'none';
    }, true);
  }

  function endEditMode() {
    try { localStorage.removeItem(EDIT_FLAG); } catch (e) {}
    // czysty reload bez parametru ?edit
    location.replace(location.pathname);
  }

  function positionPencil(el) {
    var r = el.getBoundingClientRect();
    css(pencil, {
      display: 'block',
      top: (window.scrollY + r.top + 4) + 'px',
      left: (window.scrollX + r.right - 34) + 'px'
    });
    el.style.outline = '1px dashed rgba(198,154,76,.6)';
    el.style.outlineOffset = '2px';
    el.addEventListener('mouseleave', function h() {
      el.style.outline = ''; el.style.outlineOffset = '';
      el.removeEventListener('mouseleave', h);
    });
  }

  // --- Rozpoczęcie edycji --------------------------------------------------
  function startEdit(el) {
    pencil.style.display = 'none';
    if (el.tagName === 'IMG') { editImage(el); return; }
    editText(el);
  }

  function editText(el) {
    editingEl = el;
    var original = el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.style.outline = '2px solid ' + GREEN;
    el.style.outlineOffset = '2px';
    el.focus();
    attachLinkOpener(el);
    showToolbar(el, function save() {
      var value = el.innerHTML;
      persist(el.__nfKey, 'html', value);
      finishText(el);
    }, function cancel() {
      el.innerHTML = original;
      finishText(el);
    });
  }

  function finishText(el) {
    detachLinkOpener(el);
    el.removeAttribute('contenteditable');
    el.style.outline = ''; el.style.outlineOffset = '';
    hideToolbar();
    editingEl = null;
  }

  function showToolbar(el, onSave, onCancel) {
    hideToolbar();
    toolbar = document.createElement('div');
    css(toolbar, {
      position: 'absolute', zIndex: 100000, display: 'flex', gap: '8px',
      padding: '7px', background: 'rgba(8,12,8,.96)',
      border: '1px solid rgba(90,120,70,.5)', borderRadius: '8px',
      boxShadow: '0 6px 20px rgba(0,0,0,.6)'
    });
    var r = el.getBoundingClientRect();
    var top = window.scrollY + r.top - 46;
    if (top < window.scrollY + 44) top = window.scrollY + r.bottom + 8; // nie chowaj pod paskiem
    toolbar.style.top = top + 'px';
    toolbar.style.left = (window.scrollX + r.left) + 'px';

    var linkBtn = mkBtn('🔗 Link', false);
    var unlinkBtn = mkBtn('Odłącz', false);
    var saveBtn = mkBtn('Zapisz', true);
    var cancelBtn = mkBtn('Anuluj', false);
    linkBtn.addEventListener('click', function (e) { e.preventDefault(); addLink(); });
    unlinkBtn.addEventListener('click', function (e) { e.preventDefault(); removeLink(); });
    saveBtn.addEventListener('click', function (e) { e.preventDefault(); onSave(); });
    cancelBtn.addEventListener('click', function (e) { e.preventDefault(); onCancel(); });
    toolbar.appendChild(linkBtn);
    toolbar.appendChild(unlinkBtn);
    var hint = document.createElement('span');
    hint.textContent = 'najedź na link → „Otwórz ↗" (⌘/Ctrl+klik)';
    css(hint, { fontFamily: "'Space Mono',monospace", fontSize: '10px', color: 'rgba(207,215,196,.6)', alignSelf: 'center', margin: '0 4px' });
    toolbar.appendChild(hint);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(cancelBtn);
    document.body.appendChild(toolbar);
  }

  function mkBtn(label, primary) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    css(b, {
      fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '.08em',
      textTransform: 'uppercase', cursor: 'pointer', borderRadius: '5px',
      padding: '8px 14px',
      color: primary ? '#0a1a0c' : '#a9c0a0',
      background: primary ? 'linear-gradient(180deg,#6a9a62,#3d6a38)' : 'transparent',
      border: '1px solid ' + (primary ? GREEN : 'rgba(90,120,70,.5)')
    });
    // Nie zabieraj focusu edytowanemu blokowi — zaznaczenie tekstu ma przetrwać klik
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    return b;
  }

  // --- Wstawianie / usuwanie hiperłącza w edytowanym tekście ---------------
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // Uzupełnia brakujący schemat: „example.com" → „https://example.com".
  // Zostawia bez zmian: pełne URL-e, mailto:/tel:, kotwice (#…), ścieżki (/… , sklep.html).
  function normalizeUrl(url) {
    url = String(url || '').trim();
    if (!url) return url;
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return url;
    if (/\.html($|[?#])/i.test(url)) return url;           // wewnętrzna podstrona
    if (/^[\w-]+(\.[\w-]+)+([\/?#].*)?$/.test(url)) return 'https://' + url; // goła domena
    return url;
  }
  // Rozwiązuje href względem bieżącej strony (do otwierania linku z edytora).
  function resolveHref(href) {
    try { return new URL(href, location.href).href; } catch (e) { return href; }
  }
  function normalizeAnchors() {
    if (!editingEl) return;
    var as = editingEl.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var href = normalizeUrl(as[i].getAttribute('href') || '');
      as[i].setAttribute('href', href);
      if (/^https?:\/\//i.test(href)) {
        as[i].setAttribute('target', '_blank');
        as[i].setAttribute('rel', 'noopener');
      }
    }
  }
  function addLink() {
    if (!editingEl) return;
    var url = window.prompt('Adres linku (URL), np. https://... albo sklep.html', 'https://');
    if (!url) return;
    url = normalizeUrl(url);
    var sel = window.getSelection();
    var hasSel = sel && String(sel).length > 0;
    if (hasSel) {
      document.execCommand('createLink', false, url);
    } else {
      var text = window.prompt('Tekst do wyświetlenia', url);
      if (text === null) return;
      document.execCommand('insertHTML', false,
        '<a href="' + escapeHtml(url) + '">' + escapeHtml(text || url) + '</a>');
    }
    normalizeAnchors();
    editingEl.focus();
  }

  // --- Podgląd/otwieranie linku podczas edycji ----------------------------
  // W trybie contenteditable przeglądarka NIE nawiguje po kliknięciu w link
  // (klik tylko ustawia kursor). Dlatego przy najechaniu na link pokazujemy
  // dymek „Otwórz ↗", a ⌘/Ctrl+klik otwiera link w nowej karcie.
  var linkPop = null, linkPopHover = false, linkHideT = null, curMove = null, curClick = null;
  function ensureLinkPop() {
    if (linkPop) return linkPop;
    linkPop = document.createElement('div');
    linkPop.setAttribute('data-nf-skip', '');
    css(linkPop, {
      position: 'absolute', zIndex: 100001, display: 'none', alignItems: 'center',
      padding: '5px 8px', background: 'rgba(8,12,8,.97)', border: '1px solid rgba(90,120,70,.5)',
      borderRadius: '7px', fontFamily: "'Space Mono',monospace", fontSize: '11px',
      color: '#cfd7c4', boxShadow: '0 4px 14px rgba(0,0,0,.5)', whiteSpace: 'nowrap'
    });
    linkPop.addEventListener('mouseenter', function () { linkPopHover = true; clearTimeout(linkHideT); });
    linkPop.addEventListener('mouseleave', function () { linkPopHover = false; scheduleHideLinkPop(); });
    document.body.appendChild(linkPop);
    return linkPop;
  }
  function scheduleHideLinkPop() {
    clearTimeout(linkHideT);
    linkHideT = setTimeout(function () { if (linkPop && !linkPopHover) linkPop.style.display = 'none'; }, 260);
  }
  function showLinkPop(a) {
    ensureLinkPop();
    clearTimeout(linkHideT);
    var href = a.getAttribute('href') || '';
    linkPop.innerHTML = '';
    var span = document.createElement('span');
    span.textContent = '🔗 ' + (href.length > 44 ? href.slice(0, 44) + '…' : href);
    css(span, { opacity: '.85', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', display: 'inline-block', verticalAlign: 'middle' });
    var open = document.createElement('button');
    open.type = 'button'; open.textContent = 'Otwórz ↗';
    css(open, {
      cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '11px', color: '#0a1a0c',
      background: 'linear-gradient(180deg,' + GREEN + ',#3d6a38)', border: '1px solid ' + GREEN,
      borderRadius: '5px', padding: '3px 9px', marginLeft: '10px'
    });
    open.addEventListener('mousedown', function (e) { e.preventDefault(); });
    open.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      window.open(resolveHref(a.getAttribute('href') || ''), '_blank', 'noopener');
    });
    linkPop.appendChild(span); linkPop.appendChild(open);
    linkPop.style.display = 'flex';
    var r = a.getBoundingClientRect();
    var top = window.scrollY + r.top - linkPop.offsetHeight - 6;
    if (top < window.scrollY + 4) top = window.scrollY + r.bottom + 6;
    css(linkPop, { top: top + 'px', left: (window.scrollX + r.left) + 'px' });
  }
  function attachLinkOpener(el) {
    curMove = function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a && el.contains(a)) showLinkPop(a); else scheduleHideLinkPop();
    };
    curClick = function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (a && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.open(resolveHref(a.getAttribute('href') || ''), '_blank', 'noopener');
      }
    };
    el.addEventListener('mousemove', curMove);
    el.addEventListener('click', curClick);
  }
  function detachLinkOpener(el) {
    if (curMove) el.removeEventListener('mousemove', curMove);
    if (curClick) el.removeEventListener('click', curClick);
    curMove = curClick = null;
    if (linkPop) linkPop.style.display = 'none';
  }
  function removeLink() {
    if (!editingEl) return;
    document.execCommand('unlink');
    editingEl.focus();
  }

  function hideToolbar() {
    if (toolbar && toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    toolbar = null;
  }

  // --- Podmiana zdjęcia ----------------------------------------------------
  function editImage(el) {
    fileInput.value = '';
    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      var key = el.__nfKey;
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var path = INFO.page + '/' + key.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now() + '.' + ext;
      el.style.opacity = '.5';
      sb().storage.from('site-images').upload(path, file, { upsert: true })
        .then(function (up) {
          if (up.error) throw up.error;
          var url = sb().storage.from('site-images').getPublicUrl(path).data.publicUrl;
          el.setAttribute('src', url);
          el.style.opacity = '';
          return persist(key, 'image', url);
        })
        .catch(function (err) {
          el.style.opacity = '';
          toast('Błąd wgrywania: ' + (err.message || err), true);
        });
    };
    fileInput.click();
  }

  // --- Zapis do Supabase ---------------------------------------------------
  function persist(key, type, value) {
    var page = (editingEl && isInFooter(editingEl)) ? '_shared' : INFO.page;
    var row = {
      page: page, block: key, lang: INFO.lang,
      type: type, value: value, updated_at: new Date().toISOString()
    };
    return sb().from('site_content').upsert(row, { onConflict: 'page,block,lang' })
      .then(function (res) {
        if (res.error) throw res.error;
        overrides[key] = { type: type, value: value };
        toast('Zapisano ✓', false);
      })
      .catch(function (err) { toast('Nie zapisano: ' + (err.message || err), true); });
  }

  // --- Krótki komunikat ----------------------------------------------------
  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.setAttribute('data-nf-skip', '');
    t.textContent = msg;
    css(t, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: 100001,
      fontFamily: "'Space Mono',monospace", fontSize: '12px',
      color: '#fff', background: isErr ? '#7a2a2a' : '#2f5a2a',
      borderRadius: '6px', padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.5)'
    });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  // ========================================================================
  //  Start
  // ========================================================================
  function resolveEditPref() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('edit'); } catch (e) {}
    if (q === '1') return true;
    if (q === '0') return false;
    try { return localStorage.getItem(EDIT_FLAG) === '1'; } catch (e) { return false; }
  }

  function cleanUrlParam() {
    if (/[?&]edit=/.test(location.search) && history.replaceState) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
  }

  function waitForRenderThen(cb) {
    if (document.querySelector('h1,h2,h3,p,img')) { cb(); return; }
    var obs = new MutationObserver(function () {
      if (document.querySelector('h1,h2,h3,p,img')) { obs.disconnect(); cb(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(cb, 3000);
  }

  function init() {
    if (!sb()) { console.warn('[content-editor] brak supabaseClient'); return; }
    var wantEdit = resolveEditPref();
    var started = false;
    waitForRenderThen(function () {
      if (started) return;
      started = true;

      loadOverrides();
      reobs = new MutationObserver(function () { applyAll(); });
      reobs.observe(document.body, { childList: true, subtree: true });

      checkStaff().then(function (isStaff) {
        staff = isStaff;
        if (staff && wantEdit) {
          try { localStorage.setItem(EDIT_FLAG, '1'); } catch (e) {}
          editMode = true;
          buildUI();
        }
        cleanUrlParam();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
