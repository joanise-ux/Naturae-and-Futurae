/* ============================================================================
 * Nature & Future — edytor treści inline (WYSIWYG) dla Admina/Moderatora
 * ----------------------------------------------------------------------------
 * Jak działa:
 *  1) Każdy edytowalny element w HTML ma atrybut data-edit-key="...".
 *  2) Po renderze (strony są renderowane dynamicznie przez support.js/<x-dc>,
 *     dlatego używamy MutationObserver) skrypt wczytuje z Supabase nadpisania
 *     treści dla danej strony i języka i wstawia je do elementów — zmiana jest
 *     widoczna od razu dla KAŻDEGO odwiedzającego.
 *  3) Jeśli zalogowany użytkownik ma rank >= 10 (Moderator/Admin, funkcja
 *     is_staff w bazie), przy elementach pojawia się ołówek → edycja w miejscu
 *     → pasek Zapisz / Anuluj. Style/czcionki zostają nienaruszone, bo
 *     edytujemy tylko zawartość elementu (nie ruszamy atrybutu style).
 *
 * Zapis trafia do tabeli public.site_content (RLS: zapis tylko dla personelu).
 * Zdjęcia lądują w buckecie storage "site-images".
 * Treści są objęte kopiami zapasowymi (site_content jest w DB_TABLES w sklep.html).
 * ========================================================================== */
(function () {
  'use strict';

  var ACCENT = '#c69a4c';   // mosiądz
  var GREEN  = '#8aba82';   // zieleń

  // --- Info o stronie: page = nazwa pliku bez .html i bez sufiksu -en -----
  function getPageInfo() {
    var file = (location.pathname.split('/').pop() || 'index.html')
      .replace(/\.html$/, '') || 'index';
    var lang = /-en$/.test(file) ? 'en' : 'pl';
    var page = file.replace(/-en$/, '');
    return { page: page, lang: lang };
  }

  var INFO = getPageInfo();
  var overrides = {};          // block -> { type, value }
  var applied = new WeakSet(); // elementy, którym już nałożono nadpisanie
  var editingEl = null;        // element aktualnie edytowany (pomijamy w applyAll)
  var staff = false;

  function sb() { return window.supabaseClient; }

  // --- Nałożenie nadpisań na DOM ------------------------------------------
  function applyOne(el) {
    if (el === editingEl) return;
    var key = el.getAttribute('data-edit-key');
    var ov = overrides[key];
    if (!ov) return;
    if (el.tagName === 'IMG') {
      if (el.getAttribute('src') !== ov.value) el.setAttribute('src', ov.value);
    } else {
      if (el.innerHTML !== ov.value) el.innerHTML = ov.value;
    }
    applied.add(el);
  }

  function applyAll() {
    var nodes = document.querySelectorAll('[data-edit-key]');
    for (var i = 0; i < nodes.length; i++) applyOne(nodes[i]);
  }

  // --- Wczytanie nadpisań z Supabase --------------------------------------
  function loadOverrides() {
    if (!sb()) return Promise.resolve();
    return sb().from('site_content')
      .select('block,type,value')
      .eq('page', INFO.page)
      .eq('lang', INFO.lang)
      .then(function (res) {
        if (res.error) { console.warn('[content-editor] load:', res.error.message); return; }
        (res.data || []).forEach(function (row) {
          overrides[row.block] = { type: row.type, value: row.value };
        });
        applyAll();
      });
  }

  // --- Sprawdzenie uprawnień personelu ------------------------------------
  function checkStaff() {
    if (!sb()) return Promise.resolve(false);
    return sb().auth.getSession().then(function (r) {
      var user = r && r.data && r.data.session && r.data.session.user;
      if (!user) return false;
      return sb().from('profiles').select('rank').eq('id', user.id).single()
        .then(function (p) {
          return !!(p && p.data && p.data.rank >= 10);
        });
    }).catch(function () { return false; });
  }

  // ========================================================================
  //  TRYB EDYCJI (tylko personel)
  // ========================================================================
  var pencil, toolbar, fileInput, hoverEl = null;

  function css(el, styles) { for (var k in styles) el.style[k] = styles[k]; }

  function buildUI() {
    // Ołówek (pływający, pojawia się przy najechaniu na edytowalny element)
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

    // Ukryty input pliku dla podmiany zdjęć
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Wskaźnik trybu edycji
    var badge = document.createElement('div');
    badge.textContent = 'Tryb edycji treści — ' + INFO.page + ' (' + INFO.lang.toUpperCase() + ')';
    css(badge, {
      position: 'fixed', left: '14px', bottom: '14px', zIndex: 99998,
      fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '.06em',
      color: '#0a1a0c', background: ACCENT, borderRadius: '5px',
      padding: '7px 12px', boxShadow: '0 2px 10px rgba(0,0,0,.4)', pointerEvents: 'none'
    });
    document.body.appendChild(badge);

    // Śledzenie najechania na edytowalne elementy (delegacja + capture)
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-edit-key]') : null;
      if (t && t !== editingEl) { hoverEl = t; positionPencil(t); }
    }, true);
    // Przy przewijaniu chowamy ołówek (żeby nie „latał")
    window.addEventListener('scroll', function () {
      if (pencil) pencil.style.display = 'none';
    }, true);
  }

  function positionPencil(el) {
    var r = el.getBoundingClientRect();
    css(pencil, {
      display: 'block',
      top: (window.scrollY + r.top + 4) + 'px',
      left: (window.scrollX + r.right - 34) + 'px'
    });
    // Delikatne obramowanie edytowalnego bloku
    el.style.outline = '1px dashed rgba(198,154,76,.6)';
    el.style.outlineOffset = '3px';
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

  // Edycja tekstu w miejscu (WYSIWYG)
  function editText(el) {
    editingEl = el;
    var original = el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.style.outline = '2px solid ' + GREEN;
    el.style.outlineOffset = '3px';
    el.focus();
    showToolbar(el, function save() {
      var value = el.innerHTML;
      finishText(el);
      persist(el.getAttribute('data-edit-key'), 'html', value);
    }, function cancel() {
      el.innerHTML = original;
      finishText(el);
    });
  }

  function finishText(el) {
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
    toolbar.style.top = (window.scrollY + r.top - 46) + 'px';
    toolbar.style.left = (window.scrollX + r.left) + 'px';

    var saveBtn = mkBtn('Zapisz', true);
    var cancelBtn = mkBtn('Anuluj', false);
    saveBtn.addEventListener('click', function (e) { e.preventDefault(); onSave(); });
    cancelBtn.addEventListener('click', function (e) { e.preventDefault(); onCancel(); });
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
    return b;
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
      var key = el.getAttribute('data-edit-key');
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var path = INFO.page + '/' + key + '-' + Date.now() + '.' + ext;
      el.style.opacity = '.5';
      sb().storage.from('site-images').upload(path, file, { upsert: true })
        .then(function (up) {
          if (up.error) throw up.error;
          var pub = sb().storage.from('site-images').getPublicUrl(path);
          var url = pub.data.publicUrl;
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
    var row = {
      page: INFO.page, block: key, lang: INFO.lang,
      type: type, value: value, updated_at: new Date().toISOString()
    };
    return sb().from('site_content').upsert(row, { onConflict: 'page,block,lang' })
      .then(function (res) {
        if (res.error) throw res.error;
        overrides[key] = { type: type, value: value }; // by applyAll nie cofnął zmiany
        toast('Zapisano ✓', false);
      })
      .catch(function (err) {
        toast('Nie zapisano: ' + (err.message || err), true);
      });
  }

  // --- Krótki komunikat ----------------------------------------------------
  function toast(msg, isErr) {
    var t = document.createElement('div');
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
  function waitForRenderThen(cb) {
    if (document.querySelector('[data-edit-key]')) { cb(); return; }
    var obs = new MutationObserver(function () {
      if (document.querySelector('[data-edit-key]')) cb();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    // Awaryjnie odpal po chwili, gdyby nic się nie zmieniało
    setTimeout(cb, 3000);
  }

  function init() {
    if (!sb()) { console.warn('[content-editor] brak supabaseClient'); return; }
    var started = false;
    waitForRenderThen(function () {
      if (started) return;
      started = true;

      // 1) Nadpisania dla wszystkich + obserwator ponownie nakładający po re-renderze
      loadOverrides();
      var reobs = new MutationObserver(function () { applyAll(); });
      reobs.observe(document.body, { childList: true, subtree: true });

      // 2) Tryb edycji tylko dla personelu
      checkStaff().then(function (isStaff) {
        staff = isStaff;
        if (staff) buildUI();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
