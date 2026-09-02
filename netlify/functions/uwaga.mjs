/* =============================================================================
   Przekazuje uwagę zgłoszoną z podglądu na kanał Discorda.

   Dlaczego funkcja, a nie fetch prosto z przeglądarki:
   adres webhooka musi zostać sekretem. Gdyby leżał w preview-banner.js, miałby
   go każdy, kto otworzy podgląd — a podgląd jest bez hasła. Tutaj siedzi
   w zmiennej środowiskowej po stronie Netlify i nigdy nie dociera do klienta.

   Konfiguracja: Netlify → Site settings → Environment variables
     DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/…
   ========================================================================== */

const MAX_TRESC = 2000;
const MAX_IMIE  = 60;

/* Limit częstotliwości. Trzymany w pamięci instancji — po jej wygaszeniu
   licznik się zeruje. To świadomy kompromis: chodzi o zdławienie przypadkowego
   zalewu i prostych botów, a nie o twardą ochronę. Poważniejsze nadużycie
   rozwiązuje się skasowaniem webhooka w Discordzie. */
const OKNO_MS   = 60_000;
const LIMIT     = 6;
const historia  = new Map();

const KOLORY = {
  'blokuje':    0xb4453f,
  'do poprawy': 0xb89b50,
  'drobiazg':   0x0f7c31
};

function odpowiedz(status, tekst) {
  return new Response(tekst, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}

/* Discord przycina embed po przekroczeniu limitów i zwraca 400 — lepiej
   przyciąć samemu i wysłać cokolwiek niż stracić uwagę. */
function przytnij(tekst, max) {
  const s = String(tekst ?? '').trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export default async (request) => {
  if (request.method !== 'POST') return odpowiedz(405, 'Tylko POST.');

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error('Brak zmiennej DISCORD_WEBHOOK_URL w konfiguracji Netlify.');
    return odpowiedz(500, 'Zgłaszanie uwag nie jest jeszcze skonfigurowane. Daj znać administratorowi.');
  }

  /* Formularz jest wyłącznie na tym podglądzie — żądania z innych stron
     odrzucamy, żeby webhook nie stał się otwartym wysyłaczem. */
  const origin = request.headers.get('origin');
  if (origin) {
    const wlasny = new URL(request.url).origin;
    if (origin !== wlasny) return odpowiedz(403, 'Żądanie spoza podglądu.');
  }

  let dane;
  try {
    dane = await request.json();
  } catch {
    return odpowiedz(400, 'Nieczytelne dane.');
  }

  /* Pole-pułapka. Jest ukryte, więc człowiek go nie wypełni; bot wypełnia
     wszystko. Odpowiadamy 204, żeby bot nie wiedział, że został odrzucony. */
  if (dane.strona) return new Response(null, { status: 204 });

  const imie  = przytnij(dane.imie, MAX_IMIE);
  const tresc = przytnij(dane.tresc, MAX_TRESC);
  if (!imie || !tresc) return odpowiedz(400, 'Brakuje imienia albo treści.');

  const ip = request.headers.get('x-nf-client-connection-ip')
          || request.headers.get('x-forwarded-for')
          || 'nieznane';
  const teraz = Date.now();
  const ostatnie = (historia.get(ip) || []).filter((t) => teraz - t < OKNO_MS);
  if (ostatnie.length >= LIMIT) {
    return odpowiedz(429, 'Za dużo zgłoszeń naraz. Spróbuj za chwilę.');
  }
  ostatnie.push(teraz);
  historia.set(ip, ostatnie);

  const k = dane.kontekst || {};
  const waga = ['drobiazg', 'do poprawy', 'blokuje'].includes(dane.waga)
    ? dane.waga
    : 'do poprawy';

  const bazaUrl = new URL(request.url).origin;
  const linkDoStrony = k.sciezka ? bazaUrl + k.sciezka : bazaUrl;

  const embed = {
    title: `${waga.toUpperCase()} — ${przytnij(k.strona, 120) || 'podgląd'}`,
    description: tresc,
    url: linkDoStrony,
    color: KOLORY[waga],
    timestamp: new Date().toISOString(),
    author: { name: imie },
    fields: [
      { name: 'Sekcja',  value: przytnij(k.sekcja, 200) || '—', inline: false },
      { name: 'Adres',   value: przytnij(k.sciezka, 200) || '/', inline: true },
      { name: 'Ekran',   value: k.szerokosc ? `${k.szerokosc}×${k.wysokosc}` : '—', inline: true },
      { name: 'Wersja',  value: `\`${przytnij(k.wersja, 40) || '—'}\``, inline: true }
    ],
    footer: { text: `podgląd redesignu · ${przytnij(k.srodowisko, 40) || 'local'}` }
  };

  const odp = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'Uwagi z podglądu', embeds: [embed] })
  });

  if (!odp.ok) {
    const szczegoly = await odp.text().catch(() => '');
    console.error('Discord odrzucił zgłoszenie:', odp.status, szczegoly);
    return odpowiedz(502, 'Discord odrzucił zgłoszenie. Spróbuj jeszcze raz.');
  }

  return odpowiedz(200, 'ok');
};

export const config = { path: '/.netlify/functions/uwaga' };
