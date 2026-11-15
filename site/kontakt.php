<?php
// ============================================================================
// Kamino BioLabs — formularz kontaktowy
// ----------------------------------------------------------------------------
// Przyjmuje POST z kamino.html i wysyła wiadomość na skrzynkę kontaktową
// funkcją mail() hostingu OVH. Odpowiada JSON-em (wysyłka przez fetch) albo
// przekierowaniem z powrotem na stronę (przeglądarka bez JavaScriptu).
// ============================================================================

declare(strict_types=1);

const RECIPIENT    = 'kontakt@nfplantbiotech.com';
// Nadawca musi być adresem z własnej domeny — inaczej serwery pocztowe
// odrzucają wiadomość jako podszywanie się. Adres klienta idzie w Reply-To.
const SENDER       = 'kontakt@nfplantbiotech.com';
const MAX_PER_HOUR = 5;

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $error = '', int $status = 200): void
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true] : ['error' => $error]);
    } else {
        $query = $ok ? 'wyslano=1' : 'blad=' . rawurlencode($error);
        header('Location: kamino.html?' . $query . '#kontakt', true, 303);
    }
    exit;
}

/** Jedna linia bez znaków sterujących — nic stąd nie trafi do nagłówków jako nowy wiersz. */
function line(string $key, int $max): string
{
    $value = trim((string) ($_POST[$key] ?? ''));
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value) ?? '';
    return mb_substr($value, 0, $max + 1);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'method_not_allowed', 405);
}

// Pułapka na boty: pole ukryte w formularzu. Botowi odpowiadamy sukcesem,
// żeby nie dostał sygnału, że pułapkę wykryto. Nic nie wysyłamy.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    respond(true);
}

$name         = line('name', 120);
$email        = line('email', 200);
$organization = line('organization', 160);
$topic        = line('topic', 80);
$message      = trim((string) ($_POST['message'] ?? ''));
$message      = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $message) ?? '';

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'missing_fields', 400);
}
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(false, 'bad_email', 400);
}
if (mb_strlen($name) > 120 || mb_strlen($email) > 200 || mb_strlen($organization) > 160
    || mb_strlen($topic) > 80 || mb_strlen($message) > 5000) {
    respond(false, 'too_long', 400);
}

// Limit wiadomości z jednego adresu IP na godzinę. Plik w katalogu tymczasowym;
// gdyby nie dało się go zapisać, formularz działa dalej bez limitu.
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/nf-kontakt-' . hash('sha256', $ip) . '.json';
$now      = time();
$hits     = [];
if (is_readable($rateFile)) {
    $decoded = json_decode((string) file_get_contents($rateFile), true);
    if (is_array($decoded)) {
        $hits = array_values(array_filter($decoded, fn ($t) => is_int($t) && $t > $now - 3600));
    }
}
if (count($hits) >= MAX_PER_HOUR) {
    respond(false, 'rate_limited', 429);
}

$subject = 'Kamino BioLabs — ' . ($topic !== '' ? $topic : 'formularz kontaktowy') . ' — ' . $name;

$body  = "Wiadomość z formularza na stronie Kamino BioLabs\n\n";
$body .= "Imię i nazwisko: $name\n";
$body .= "E-mail: $email\n";
$body .= 'Firma lub gospodarstwo: ' . ($organization !== '' ? $organization : '—') . "\n";
$body .= 'Temat: ' . ($topic !== '' ? $topic : '—') . "\n\n";
$body .= $message . "\n";

$headers = [
    'From'         => 'Formularz Kamino BioLabs <' . SENDER . '>',
    'Reply-To'     => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
];

$sent = mail(RECIPIENT, mb_encode_mimeheader($subject, 'UTF-8', 'B'), $body, $headers);

if (!$sent) {
    error_log('kontakt.php: mail() zwróciło false');
    respond(false, 'server', 500);
}

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

respond(true);
