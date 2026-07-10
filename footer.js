(function () {
  'use strict';
  var file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  var isEn = /-en$/.test(file);

  var nav = isEn
    ? '<a href="index-en.html#kim-jestesmy">About</a>'
      + '<a href="technologia-en.html">In vitro technology</a>'
      + '<a href="historia-en.html">Orchard history</a>'
      + '<a href="sklep-en.html">Plant catalogue</a>'
      + '<a href="panel-klienta-en.html">Client panel</a>'
      + '<a href="index-en.html#kontakt">Contact</a>'
    : '<a href="index.html#kim-jestesmy">O nas</a>'
      + '<a href="technologia.html">Technologia in vitro</a>'
      + '<a href="historia.html">Historia sadu</a>'
      + '<a href="sklep.html">Katalog roślin</a>'
      + '<a href="panel-klienta.html">Panel klienta</a>'
      + '<a href="index.html#kontakt">Kontakt</a>';

  var langPL = isEn
    ? '<span style="color:#5a5a4e; border:1px solid rgba(90,120,70,.15); border-radius:4px; padding:6px 12px;">PL</span>'
    : '<span style="color:#8aba82; border:1px solid rgba(90,120,70,.4); border-radius:4px; padding:6px 12px;">PL</span>';
  var langEN = isEn
    ? '<span style="color:#8aba82; border:1px solid rgba(90,120,70,.4); border-radius:4px; padding:6px 12px;">EN</span>'
    : '<span style="color:#5a5a4e; border:1px solid rgba(90,120,70,.15); border-radius:4px; padding:6px 12px;">EN</span>';

  var t = isEn
    ? { tagline: 'In Vitro. From nature to the future. Plants propagated by micropropagation in Wałbrzych.',
        navLabel: 'Navigation', contactLabel: 'Contact', langLabel: 'Language',
        street: '148 Orkana St.', city: '58-300 Wałbrzych', fb: 'Nature Journal',
        copy: '© 2026 Nature &amp; Future. All rights reserved.' }
    : { tagline: 'In Vitro. Z natury ku przyszłości. Rośliny rozmnażane metodą mikropropagacji w Wałbrzychu.',
        navLabel: 'Nawigacja', contactLabel: 'Kontakt', langLabel: 'Język',
        street: 'ul. Orkana 148', city: '58-300 Wałbrzych', fb: 'Dziennik Nature',
        copy: '© 2026 Nature &amp; Future. Wszelkie prawa zastrzeżone.' };

  var html =
    '<div data-screen-label="Footer" style="border-top:1px solid rgba(90,120,70,.2); margin-top:20px; background:rgba(4,10,7,.5);">'
    + '<div style="max-width:1440px; margin:0 auto; padding:50px 40px 40px;">'
    +   '<div style="display:grid; grid-template-columns:1.2fr 1fr 1fr .8fr; gap:40px;">'
    +     '<div>'
    +       '<div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">'
    +         '<img src="assets/logo-circle.png" alt="Nature &amp; Future" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">'
    +         '<div style="line-height:1.1;">'
    +           '<div style="font-family:\'Cinzel\',serif; font-weight:600; font-size:14px; letter-spacing:.08em; color:#ddd8c6;">NATURE &amp; FUTURE</div>'
    +           '<div style="font-family:\'Space Mono\',monospace; font-size:8px; letter-spacing:.22em; color:#5d7a50; margin-top:2px;">PLANT BIOTECH</div>'
    +         '</div>'
    +       '</div>'
    +       '<p style="font-size:14px; line-height:1.6; color:#8c7d5e; max-width:260px;">' + t.tagline + '</p>'
    +     '</div>'
    +     '<div>'
    +       '<div style="font-family:\'Space Mono\',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#5d7a50; margin-bottom:18px;">' + t.navLabel + '</div>'
    +       '<div style="display:flex; flex-direction:column; gap:10px; font-size:14.5px; color:#9a9480;">' + nav + '</div>'
    +     '</div>'
    +     '<div>'
    +       '<div style="font-family:\'Space Mono\',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#5d7a50; margin-bottom:18px;">' + t.contactLabel + '</div>'
    +       '<div style="display:flex; flex-direction:column; gap:10px; font-size:14.5px; color:#9a9480;">'
    +         '<span>' + t.street + '</span>'
    +         '<span>' + t.city + '</span>'
    +         '<span style="color:#a9c0a0;">kontakt@nfplantbiotech.com</span>'
    +         '<span style="margin-top:6px;">Facebook: <span style="color:#a9c0a0;">' + t.fb + '</span></span>'
    +       '</div>'
    +     '</div>'
    +     '<div>'
    +       '<div style="font-family:\'Space Mono\',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#5d7a50; margin-bottom:18px;">' + t.langLabel + '</div>'
    +       '<div class="nf-lang" style="cursor:pointer; display:flex; gap:10px; font-family:\'Space Mono\',monospace; font-size:13px;">' + langPL + langEN + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex; align-items:center; justify-content:space-between; margin-top:40px; padding-top:20px; border-top:1px solid rgba(90,120,70,.12);">'
    +     '<span style="font-family:\'Space Mono\',monospace; font-size:10px; letter-spacing:.06em; color:#5a5a4e;">' + t.copy + '</span>'
    +     '<span style="font-family:\'Space Mono\',monospace; font-size:10px; letter-spacing:.06em; color:#5a5a4e;">nfplantbiotech.com</span>'
    +   '</div>'
    + '</div>'
    + '</div>';

  function inject() {
    var el = document.getElementById('nf-footer');
    if (!el) return false;
    if (el.children.length > 0) return true;
    el.innerHTML = html;
    return false;
  }

  var obs = new MutationObserver(function () { inject(); });
  if (document.body) {
    inject();
    obs.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      inject();
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
