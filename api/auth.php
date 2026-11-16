<?php
// Lavender Plaza Hotel - sign-in with Gmail / Facebook.
// Google or Facebook confirms who the guest is; this file only checks that confirmation
// and keeps a list of members in api/data/store.json (blocked from the web by .htaccess).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require __DIR__ . '/config.php';

function out($arr, $code = 200) {
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // public settings the web page needs (these IDs are not secret)
    if (isset($_GET['config'])) {
        out(['ok' => true, 'googleClientId' => GOOGLE_CLIENT_ID, 'facebookAppId' => FACEBOOK_APP_ID]);
    }
    out(['ok' => false, 'error' => 'method'], 405);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(['ok' => false, 'error' => 'method'], 405);
}

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) {
    out(['ok' => false, 'error' => 'bad_request'], 400);
}
$action = isset($in['action']) ? (string)$in['action'] : '';

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function http_json($url, $headers = []) {
    $raw = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $raw = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['timeout' => 12, 'header' => implode("\r\n", $headers)]]);
        $raw = @file_get_contents($url, false, $ctx);
    }
    if (!is_string($raw)) {
        return null;
    }
    $j = json_decode($raw, true);
    return is_array($j) ? $j : null;
}

// Read the member list, let $fn change it, save it again (locked, so two guests never clash).
function store_update($fn) {
    global $dataDir;
    $fp = fopen($dataDir . '/store.json', 'c+');
    if (!$fp) {
        out(['ok' => false, 'error' => 'storage'], 500);
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $d = json_decode($raw ? $raw : '', true);
    if (!is_array($d)) {
        $d = [];
    }
    if (!isset($d['members']) || !is_array($d['members'])) {
        $d['members'] = [];
    }
    if (!isset($d['sessions']) || !is_array($d['sessions'])) {
        $d['sessions'] = [];
    }
    $res = $fn($d);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $res;
}

function member_public($m) {
    return [
        'name' => isset($m['name']) ? $m['name'] : '',
        'email' => isset($m['email']) ? $m['email'] : '',
        'picture' => isset($m['picture']) ? $m['picture'] : '',
    ];
}

function new_session(&$d, $key) {
    $token = bin2hex(random_bytes(32));
    $d['sessions'][hash('sha256', $token)] = ['key' => $key, 'exp' => time() + SESSION_DAYS * 86400];
    foreach ($d['sessions'] as $h => $s) {
        if ($s['exp'] < time()) {
            unset($d['sessions'][$h]);
        }
    }
    return $token;
}

function login_member($provider, $key, $email, $name, $picture) {
    $res = store_update(function (&$d) use ($provider, $key, $email, $name, $picture) {
        $now = date('c');
        if (!isset($d['members'][$key])) {
            $d['members'][$key] = [
                'email' => $email, 'name' => $name, 'picture' => $picture,
                'provider' => $provider, 'created' => $now, 'last_login' => $now, 'logins' => 0,
            ];
        }
        if ($name !== '') {
            $d['members'][$key]['name'] = $name;
        }
        if ($picture !== '') {
            $d['members'][$key]['picture'] = $picture;
        }
        $d['members'][$key]['last_login'] = $now;
        $d['members'][$key]['logins'] = (int)$d['members'][$key]['logins'] + 1;
        $token = new_session($d, $key);
        return ['token' => $token, 'member' => member_public($d['members'][$key])];
    });
    out(['ok' => true, 'token' => $res['token'], 'member' => $res['member']]);
}

if ($action === 'google') {
    $tok = isset($in['access_token']) ? (string)$in['access_token'] : '';
    if ($tok === '' || GOOGLE_CLIENT_ID === '') {
        out(['ok' => false, 'error' => 'config'], 400);
    }
    // 1) make sure this token was issued for OUR Google client
    $info = http_json('https://oauth2.googleapis.com/tokeninfo?access_token=' . urlencode($tok));
    $aud = '';
    if ($info) {
        $aud = isset($info['aud']) ? $info['aud'] : (isset($info['azp']) ? $info['azp'] : '');
    }
    if (!$info || $aud !== GOOGLE_CLIENT_ID) {
        out(['ok' => false, 'error' => 'audience'], 401);
    }
    // 2) get the guest's name, email and photo from Google
    $p = http_json('https://www.googleapis.com/oauth2/v3/userinfo', ['Authorization: Bearer ' . $tok]);
    if (!$p || empty($p['email'])) {
        out(['ok' => false, 'error' => 'profile'], 401);
    }
    $verified = isset($p['email_verified']) && ($p['email_verified'] === true || $p['email_verified'] === 'true');
    if (!$verified) {
        out(['ok' => false, 'error' => 'unverified'], 401);
    }
    $email = strtolower($p['email']);
    login_member('google', $email, $email, isset($p['name']) ? $p['name'] : '', isset($p['picture']) ? $p['picture'] : '');
}

if ($action === 'facebook') {
    $tok = isset($in['access_token']) ? (string)$in['access_token'] : '';
    if ($tok === '' || FACEBOOK_APP_ID === '') {
        out(['ok' => false, 'error' => 'config'], 400);
    }
    $app = http_json('https://graph.facebook.com/app?access_token=' . urlencode($tok));
    if (!$app || !isset($app['id']) || (string)$app['id'] !== FACEBOOK_APP_ID) {
        out(['ok' => false, 'error' => 'audience'], 401);
    }
    $me = http_json('https://graph.facebook.com/me?fields=id,name,email,picture.width(200)&access_token=' . urlencode($tok));
    if (!$me || empty($me['id'])) {
        out(['ok' => false, 'error' => 'profile'], 401);
    }
    $email = isset($me['email']) ? strtolower($me['email']) : '';
    $key = $email !== '' ? $email : 'facebook:' . $me['id'];
    $pic = isset($me['picture']['data']['url']) ? $me['picture']['data']['url'] : '';
    login_member('facebook', $key, $email, isset($me['name']) ? $me['name'] : '', $pic);
}

if ($action === 'me') {
    $token = isset($in['token']) ? (string)$in['token'] : '';
    $h = hash('sha256', $token);
    $res = store_update(function (&$d) use ($h) {
        if (!isset($d['sessions'][$h]) || $d['sessions'][$h]['exp'] < time()) {
            return null;
        }
        $key = $d['sessions'][$h]['key'];
        return isset($d['members'][$key]) ? member_public($d['members'][$key]) : null;
    });
    if ($res === null) {
        out(['ok' => false, 'error' => 'session'], 401);
    }
    out(['ok' => true, 'member' => $res]);
}

if ($action === 'logout') {
    $token = isset($in['token']) ? (string)$in['token'] : '';
    $h = hash('sha256', $token);
    store_update(function (&$d) use ($h) {
        unset($d['sessions'][$h]);
        return true;
    });
    out(['ok' => true]);
}

out(['ok' => false, 'error' => 'unknown_action'], 400);
