// ============================================================================
// Nature & Future — przyjmowanie wiadomosci z formularza kontaktowego
// ----------------------------------------------------------------------------
// Formularz na stronie NIE pisze do tabeli `emails` bezposrednio. Polityka RLS
// wymaga tam `is_staff()`, a otwarcie jej dla anonimow oznaczaloby, ze kazdy,
// kto wezmie jawny klucz `anon` z repozytorium, moze zasypac skrzynke. Zamiast
// tego strona wola te funkcje, a ona zapisuje wiersz kluczem serwisowym —
// tabela zostaje zamknieta, a walidacja i limity dzieja sie po stronie serwera,
// gdzie nikt ich nie obejdzie.
//
// Wiadomosc trafia do tej samej skrzynki, ktora obsluguje panel Poczta
// w sklep.html (folder 'inbox', nieprzeczytana).
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://nfplantbiotech.com',
  'https://www.nfplantbiotech.com',
  'http://localhost:3000',
];

// Limit: tyle wiadomosci z jednego adresu w ciagu godziny.
const MAX_PER_HOUR = 3;

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400, origin);
  }

  const name = String(payload.name ?? '').trim();
  const email = String(payload.email ?? '').trim();
  const message = String(payload.message ?? '').trim();
  // Pulapka na boty: pole ukryte w formularzu, ktorego czlowiek nie wypelni.
  const trap = String(payload.website ?? '').trim();

  // Botowi odpowiadamy sukcesem — inaczej dostaje sygnal, ze pulapke wykryto,
  // i wraca z innym wzorcem. Nic nie zapisujemy.
  if (trap) return json({ ok: true }, 200, origin);

  if (!name || !email || !message) {
    return json({ error: 'missing_fields' }, 400, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'bad_email' }, 400, origin);
  }
  // Gorne limity dlugosci: bez nich pojedyncze zadanie moze wepchnac
  // dowolnie duzy tekst do bazy.
  if (name.length > 120 || email.length > 200 || message.length > 5000) {
    return json({ error: 'too_long' }, 400, origin);
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: countError } = await sb
    .from('emails')
    .select('id', { count: 'exact', head: true })
    .eq('from_address', email)
    .gte('received_at', hourAgo);

  if (countError) {
    console.error('limit check failed', countError);
    return json({ error: 'server' }, 500, origin);
  }
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return json({ error: 'rate_limited' }, 429, origin);
  }

  const { error } = await sb.from('emails').insert({
    folder: 'inbox',
    from_address: email,
    from_name: name,
    to_addresses: [{ email: 'kontakt@nfplantbiotech.com' }],
    subject: 'Formularz kontaktowy — ' + name,
    body_text: message,
    received_at: new Date().toISOString(),
    read: false,
  });

  if (error) {
    console.error('insert failed', error);
    return json({ error: 'server' }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
});
