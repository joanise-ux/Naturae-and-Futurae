/* ==========================================================================
   Nature & Future — nf-catalogue.js
   Dane katalogu: produkty i kategorie, osobno dla każdej marki.

   Plik jest wyłącznie danymi — nie ma tu ani jednej decyzji o wyglądzie.
   Silnik listingu (nf-shop.js) bierze z niego tę gałąź, która odpowiada
   atrybutowi data-brand na <body>:

     sklep-nf.html   data-brand="nf"       → rośliny akwariowe in vitro
     pomona-nf.html  data-brand="pomona"   → drzewa i krzewy owocowe
     kamino-nf.html  data-brand="kamino"   → wyposażenie i bank roślin

   Sklep jest wyłącznie NF. Pomona i Kamino mają własne podstrony
   i własne listingi — ta sama logika siatki (8.1), inna skórka.
   ========================================================================== */

window.NF_CATALOGUE = (function () {

  var PRODUCTS = {

    /* --- Nature & Future: rośliny akwariowe in vitro -------------------- */
    nf: [
      { id: 'anubias', latin: 'Anubias barteri var. nana', name: 'Anubias nana',
        desc: 'Wolno rosnąca, znosi cień. Kłącze zostaje nad podłożem.',
        price: 22, stock: 20, level: 'łatwa', unit: 'szt. · kubek 5×5',
        img: 'assets/anubias.jpg',
        alt: 'Kępa ciemnozielonych, owalnych liści anubiasa w słoiku z kultury in vitro.',
        tags: ['mchy'] },

      { id: 'crypto', latin: 'Cryptocoryne wendtii', name: 'Kryptokoryna wendta',
        desc: 'Brązowo-zielona, średnie tempo wzrostu. Po przesadzeniu zrzuca liście i odbija w trzecim tygodniu.',
        price: 18, stock: 2, level: 'średnia', unit: 'szt. · kubek 5×5',
        img: 'assets/Kryptokoryna%20wendta.jpg',
        alt: 'Słoik z etykietą „Kryptokoryna wendta — kultura in vitro, seria IV/09” na blacie laboratorium.',
        tags: [] },

      { id: 'hemianthus', latin: 'Hemianthus callitrichoides', name: 'Hemianthus',
        desc: 'Dywanowa, wymaga CO₂ i mocnego światła. Następna partia w marcu.',
        price: 24, stock: 0, level: 'wymagająca', unit: 'szt. · kubek 5×5',
        img: 'assets/zestaw%20startowy.jpg',
        alt: 'Gęsty, jasnozielony kobierzec drobnolistnej rośliny dywanowej na pożywce.',
        tags: ['przedplan'] },

      { id: 'buce', latin: 'Bucephalandra sp.', name: 'Bucefalandra',
        desc: 'Epifit z Borneo. Rośnie na kamieniu, nie w podłożu. Liść ma metaliczny połysk.',
        price: 29, stock: 14, level: 'łatwa', unit: 'szt. · kubek 5×5',
        img: 'assets/inspiracje/leaf-wall.jpg',
        alt: 'Ściana z drobnych, ciemnych liści o metalicznym połysku.',
        tags: ['mchy', 'przedplan'] },

      { id: 'mech', latin: 'Vesicularia dubyana', name: 'Mech jawajski',
        desc: 'Najbardziej wybaczający mech w akwarium. Przywiązujesz do korzenia i zostawiasz.',
        price: 15, stock: 31, level: 'łatwa', unit: 'porcja · kubek 5×5',
        img: 'assets/inspiracje/moss-laptop.jpg',
        alt: 'Poduszka jasnozielonego mchu porastająca kawałek drewna.',
        tags: ['mchy', 'przedplan'] },

      { id: 'microsorum', latin: 'Microsorum pteropus', name: 'Mikrosorium',
        desc: 'Paproć jawajska. Nie wymaga CO₂, rozmnaża się z zarodni na spodzie liścia.',
        price: 19, stock: 12, level: 'łatwa', unit: 'szt. · kubek 5×5',
        img: 'assets/inspiracje/capsule-forest.jpg',
        alt: 'Wąskie, długie liście paproci jawajskiej w szklanym pojemniku hodowlanym.',
        tags: ['przedplan'] },

      { id: 'rotala', latin: 'Rotala rotundifolia', name: 'Rotala okrągłolistna',
        desc: 'Przy mocnym świetle czerwienieje. Rośnie szybko — przycinasz co dwa tygodnie.',
        price: 17, stock: 8, level: 'średnia', unit: 'szt. · kubek 5×5',
        img: 'assets/inspiracje/greenhouse-neon.jpg',
        alt: 'Pędy rotali o okrągłych listkach przechodzących z zieleni w czerwień pod lampą.',
        tags: [] },

      { id: 'eleocharis', latin: 'Eleocharis parvula', name: 'Sitowie karłowate',
        desc: 'Trawiasty przedplan. Rozrasta się rozłogami, tworzy równą murawę.',
        price: 16, stock: 3, level: 'średnia', unit: 'szt. · kubek 5×5',
        img: 'assets/inspiracje/bottle-vial.jpg',
        alt: 'Pęczek cienkich, trawiastych źdźbeł sitowia w szklanej fiolce hodowlanej.',
        tags: ['przedplan'] },

      { id: 'alternanthera', latin: 'Alternanthera reineckii', name: 'Alternantera',
        desc: 'Głęboka czerwień bez nawożenia żelazem nie wyjdzie. Za to wychodzi spektakularnie.',
        price: 21, stock: 6, level: 'wymagająca', unit: 'szt. · kubek 5×5',
        img: 'assets/inspiracje/sp-flasks.jpg',
        alt: 'Rząd słoików in vitro na półce komory hodowlanej, w środku czerwonolistne sadzonki.',
        tags: ['nowosc'] }
    ],

    /* --- PomonaLab: drzewa i krzewy owocowe ---------------------------- */
    pomona: [
      { id: 'jablon', latin: 'Malus domestica', name: 'Jabłoń „Antonówka”',
        desc: 'Klon z kultury in vitro, wolny od wirusów. Owocuje w trzecim roku po posadzeniu.',
        price: 89, stock: 6, level: 'łatwa', unit: 'szt. · podkładka M9',
        img: 'assets/pomona.jpg',
        alt: 'Młoda jabłoń z zawiązanymi owocami w sadzie o poranku.',
        tags: ['podkladki'] },

      { id: 'czeresnia', latin: 'Prunus avium', name: 'Czereśnia „Burlat”',
        desc: 'Wczesna, ciemnobordowa. Wymaga zapylacza — najlepiej „Kordia” w promieniu 20 m.',
        price: 95, stock: 4, level: 'średnia', unit: 'szt. · podkładka Gisela 5',
        img: 'assets/inspiracje/sp-greenhouse.jpg',
        alt: 'Szklarnia sadownicza z rzędem drzewek podpartych drewnianymi tyczkami.',
        tags: [] },

      { id: 'malina', latin: 'Rubus idaeus', name: 'Malina „Polka”',
        desc: 'Powtarzająca, owocuje od sierpnia do przymrozków. Pędy tniesz do ziemi zimą.',
        price: 34, stock: 18, level: 'łatwa', unit: 'szt. · doniczka P9',
        img: 'assets/inspiracje/capsule-rainforest.jpg',
        alt: 'Krzew maliny z dojrzewającymi owocami przy drewnianej podporze.',
        tags: [] }
    ],

    /* --- Kamino BioLabs: wyposażenie i bank roślin ---------------------- */
    kamino: [
      { id: 'komora', latin: '', name: 'Komora hodowlana KM-1',
        desc: 'Sterowanie temperaturą, wilgotnością i fotoperiodem. Odczyty przez sieć lokalną.',
        price: 2400, stock: 3, level: 'laboratorium', unit: 'szt. · 60 × 40 × 45 cm',
        img: 'assets/kamino_poznajkamino.jpg',
        alt: 'Przezroczysta komora hodowlana z rośliną i panelem sterowania z odczytami.',
        tags: [] },

      { id: 'pozywka', latin: '', name: 'Pożywka MS — koncentrat',
        desc: 'Agar 7 g/l, sacharoza 30 g/l. Wystarcza na 40 słoików po 250 ml.',
        price: 120, stock: 22, level: 'laboratorium', unit: 'opak. · 1 l koncentratu',
        img: 'assets/inspiracje/sp-desk-bottles.jpg',
        alt: 'Butelki z pożywką i szklane naczynia laboratoryjne na blacie.',
        tags: [] },

      { id: 'lampa', latin: '', name: 'Lampa LED — spektrum wzrostu',
        desc: 'Pasmo 450 i 660 nm, 80 µmol/m²/s na wysokości półki. Sterownik fotoperiodu w zestawie.',
        price: 340, stock: 9, level: 'laboratorium', unit: 'szt. · listwa 60 cm',
        img: 'assets/inspiracje/greenhouse-neon.jpg',
        alt: 'Regał hodowlany oświetlony listwami LED w chłodnym świetle.',
        tags: [] },

      { id: 'pesety', latin: '', name: 'Zestaw narzędzi laminarnych',
        desc: 'Dwie pęsety, skalpel, uchwyt. Stal chirurgiczna, autoklawowalne w 121 °C.',
        price: 180, stock: 15, level: 'laboratorium', unit: 'zestaw · 4 elementy',
        img: 'assets/inspiracje/hero-hand-fern-data.jpg',
        alt: 'Dłoń w rękawiczce trzymająca paproć nad blatem z odczytami pomiarowymi.',
        tags: [] },

      { id: 'bank', latin: '', name: 'Bank roślin — dostęp roczny',
        desc: 'Depozyt materiału roślinnego i dostęp do 1200 opisanych genotypów.',
        price: 600, stock: 40, level: 'laboratorium', unit: 'rok · jedno stanowisko',
        img: 'assets/inspiracje/sp-library-terrarium.jpg',
        alt: 'Biblioteka szklanych pojemników z roślinami, każdy z etykietą katalogową.',
        tags: ['bank'] }
    ]
  };


  /* ======================================================================
     2. Kategorie. Każda ma hero (rozdz. 8) i filtr na produkty.
        Cztery przypadki testowe z briefu — 1, 3, 5 i 9 pozycji — siedzą
        w kolekcji NF i są przełączalne paskiem.
     ====================================================================== */

  var CATEGORIES = {
    nf: [
      { id: 'wszystkie', label: 'Wszystkie rośliny', filter: null,
        title: 'Rośliny akwariowe',
        lead: 'Każda sadzonka pochodzi z jednej komórki matecznej i całe życie spędziła w zamkniętym słoiku. Nie miała kontaktu z wodą z akwarium, więc nie przywozi glonów, ślimaków ani pasożytów. Aklimatyzacja trwa siedem dni i opisujemy ją krok po kroku.',
        spec: [['Rodzina', 'Araceae, Hydrocharitaceae, Lythraceae'], ['Kategoria', 'Rośliny wodne i bagienne'], ['Pielęgnacja', 'Od łatwej do wymagającej']],
        img: 'assets/akwarium%20sklep.jpg',
        alt: 'Zarośnięte akwarium roślinne na komodzie: korzeń porośnięty mchem, paproć jawajska, trawiasty przedplan i ławica neonów.',
        annos: ['Cała obsada tego zbiornika to <b>9 gatunków</b> z jednej hodowli.', 'Aklimatyzacja z kubka do zbiornika: <b>7 dni</b>.'] },

      { id: 'przedplan', label: 'Przedplan', filter: 'przedplan',
        title: 'Przedplan i dywany',
        lead: 'Rośliny niskie, które trzymają się dna i tworzą zwartą murawę. Wymagają światła docierającego do samego podłoża, więc sadzi się je z przodu i nie zacienia. Cztery z pięciu radzą sobie bez CO₂.',
        spec: [['Rodzina', 'Araceae, Cyperaceae, Linderniaceae'], ['Kategoria', 'Przedplan, murawa'], ['Pielęgnacja', 'Od łatwej do wymagającej']],
        img: 'assets/inspiracje/capsule-forest.jpg',
        alt: 'Szklana kapsuła z gęstym, niskim runem roślinnym w środku.',
        annos: ['Murawa zamyka się po <b>6–8 tygodniach</b> od posadzenia.'] },

      { id: 'mchy', label: 'Mchy i epifity', filter: 'mchy',
        title: 'Mchy i epifity',
        lead: 'Rosną na drewnie i kamieniu, nigdy w podłożu. Przywiązujesz je żyłką albo nicią, a po trzech tygodniach trzymają się same. To najbardziej wybaczająca grupa w całym sklepie.',
        spec: [['Rodzina', 'Araceae, Hypnaceae'], ['Kategoria', 'Epifity, mchy'], ['Pielęgnacja', 'Łatwa']],
        img: 'assets/inspiracje/leaf-wall.jpg',
        alt: 'Ściana porośnięta drobnymi, ciemnozielonymi liśćmi i mchem.',
        annos: ['Kłącze <b>nad</b> podłożem — zakopane gnije w dwa tygodnie.'] },

      { id: 'nowosc', label: 'Nowość sezonu', filter: 'nowosc',
        title: 'Nowość sezonu',
        lead: 'Jedna odmiana, która weszła do sprzedaży w tym miesiącu. Pierwsza partia liczy sześć sztuk — tyle wyszło z hodowli. Kolejna wchodzi za osiem tygodni.',
        spec: [['Rodzina', 'Amaranthaceae'], ['Kategoria', 'Roślina tła'], ['Pielęgnacja', 'Wymagająca']],
        img: 'assets/inspiracje/bottle-vial.jpg',
        alt: 'Pojedyncza fiolka hodowlana z czerwonolistną sadzonką na jasnej pożywce.',
        annos: ['Partia <b>IV/09</b> — sześć sztuk z jednej linii matecznej.'] }
    ],

    pomona: [
      { id: 'drzewa', label: 'Drzewa i krzewy', filter: null,
        title: 'Sad z probówki',
        lead: 'Drzewka owocowe rozmnażane in vitro są klonami — owoc będzie dokładnie taki, jak z drzewa matecznego. Materiał jest wolny od wirusów, co przy jabłoni i czereśni oznacza kilka lat różnicy w plonowaniu. Sadzisz jesienią albo wczesną wiosną.',
        spec: [['Rodzina', 'Rosaceae'], ['Kategoria', 'Drzewa i krzewy owocowe'], ['Pielęgnacja', 'Od łatwej do średniej']],
        img: 'assets/pomona.jpg',
        alt: 'Sad o poranku, rzędy młodych drzew owocowych z zawiązanymi owocami.',
        annos: ['Materiał <b>wolny od wirusów</b> — certyfikat w każdej przesyłce.'] },

      { id: 'podkladki', label: 'Podkładki karłowe', filter: 'podkladki',
        title: 'Podkładki karłowe',
        lead: 'Drzewo na podkładce M9 dorasta do trzech metrów i owocuje w trzecim roku. Zbierasz z ziemi, bez drabiny. Wymaga palika przez całe życie, bo system korzeniowy jest płytki.',
        spec: [['Rodzina', 'Rosaceae'], ['Kategoria', 'Podkładka karłowa M9'], ['Pielęgnacja', 'Łatwa, wymaga palika']],
        img: 'assets/inspiracje/sp-greenhouse.jpg',
        alt: 'Szklarnia sadownicza z rzędem niskich drzewek przy drewnianych podporach.',
        annos: ['Owocowanie w <b>3. roku</b> po posadzeniu.'] }
    ],

    kamino: [
      { id: 'wyposazenie', label: 'Wyposażenie', filter: null,
        title: 'Laboratorium pod klucz',
        lead: 'Pięć pozycji, które wystarczą, żeby postawić własną kulturę in vitro. Komora, światło, pożywka, narzędzia i dostęp do banku genotypów. Wszystko działa razem i jest opisane wspólnym protokołem.',
        spec: [['Rodzina', 'Sprzęt laboratoryjny'], ['Kategoria', 'Kultura in vitro'], ['Pielęgnacja', 'Serwis co 12 miesięcy']],
        img: 'assets/kamino_poznajkamino.jpg',
        alt: 'Przezroczysta komora hodowlana z rośliną o odsłoniętych korzeniach i panelem odczytów.',
        annos: ['Fotoperiod <b>16/8 h</b>, sterownik w zestawie.'] },

      { id: 'bank', label: 'Bank roślin', filter: 'bank',
        title: 'Bank roślin',
        lead: 'Depozyt materiału roślinnego w kulturze sterylnej i dostęp do opisanego katalogu genotypów. Jedno stanowisko, rozliczenie roczne. Materiał wraca do Ciebie w słoiku, gotowy do namnożenia.',
        spec: [['Rodzina', 'Usługa'], ['Kategoria', 'Depozyt i katalog'], ['Pielęgnacja', 'Przegląd co 6 miesięcy']],
        img: 'assets/inspiracje/sp-library-terrarium.jpg',
        alt: 'Regały pełne szklanych pojemników z roślinami, każdy z etykietą katalogową.',
        annos: ['<b>1200</b> opisanych genotypów w katalogu.'] }
    ]
  };

  return { products: PRODUCTS, categories: CATEGORIES };
})();
