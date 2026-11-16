<?php
// Lavender Plaza Hotel - list of members (only for you).
// Open:  https://YOUR-DOMAIN/api/members.php?key=YOUR_ADMIN_KEY      (add &csv=1 to download for Excel)
require __DIR__ . '/config.php';
$key = isset($_GET['key']) ? (string)$_GET['key'] : '';
if (ADMIN_KEY === '' || ADMIN_KEY === 'change-this-to-a-long-random-password' || !hash_equals(ADMIN_KEY, $key)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Locked. Set ADMIN_KEY in api/config.php, then open members.php?key=YOUR_KEY');
}
$raw = @file_get_contents(__DIR__ . '/data/store.json');
$d = json_decode($raw ? $raw : '', true);
$members = (is_array($d) && isset($d['members']) && is_array($d['members'])) ? array_values($d['members']) : [];
usort($members, function ($a, $b) {
    $x = isset($a['created']) ? $a['created'] : '';
    $y = isset($b['created']) ? $b['created'] : '';
    return strcmp($y, $x);
});
function g($m, $k) { return isset($m[$k]) ? (string)$m[$k] : ''; }
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function csv_safe($s) { $s = (string)$s; return (strlen($s) && strpos("=+-@", $s[0]) !== false) ? "'" . $s : $s; }

if (isset($_GET['csv'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="lavender-plaza-members.csv"');
    $o = fopen('php://output', 'w');
    fwrite($o, "\xEF\xBB\xBF");
    fputcsv($o, ['Name', 'Email', 'Signed up with', 'Created', 'Last login', 'Sign-ins']);
    foreach ($members as $m) {
        fputcsv($o, [csv_safe(g($m, 'name')), csv_safe(g($m, 'email')), g($m, 'provider'), g($m, 'created'), g($m, 'last_login'), g($m, 'logins')]);
    }
    exit;
}
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Members | Lavender Plaza Hotel</title>
<style>
body{margin:0;background:#F8F3E9;color:#2B2A28;font:15px/1.5 system-ui,Segoe UI,Arial,sans-serif;padding:32px 20px}
.wrap{max-width:980px;margin:0 auto;background:#fff;border:1px solid #e7d9b8;border-radius:20px;padding:28px;box-shadow:0 30px 60px -40px rgba(100,75,30,.5)}
h1{margin:0 0 4px;font:400 32px Georgia,serif;color:#8a6d38}
.sub{color:#777;margin:0 0 20px}
a.btn{display:inline-block;background:#2B2A28;color:#fff;text-decoration:none;padding:10px 20px;border-radius:999px;font-size:12px;letter-spacing:.15em;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-top:22px}
th{text-align:left;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#8a6d38;border-bottom:2px solid #B8975A;padding:10px 8px}
td{padding:12px 8px;border-bottom:1px solid #eee;vertical-align:middle}
img{width:34px;height:34px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px}
.av{display:inline-block;width:34px;height:34px;border-radius:50%;background:#B8975A;color:#fff;text-align:center;line-height:34px;margin-right:10px;vertical-align:middle}
.empty{padding:40px 0;text-align:center;color:#888}
@media(max-width:640px){th:nth-child(n+4),td:nth-child(n+4){display:none}}
</style>
</head>
<body>
<div class="wrap">
  <h1>Members</h1>
  <p class="sub"><?php echo count($members); ?> guest account<?php echo count($members) === 1 ? '' : 's'; ?> &middot; Lavender Plaza Hotel</p>
  <a class="btn" href="?key=<?php echo urlencode($key); ?>&amp;csv=1">Download CSV</a>
  <?php if (!count($members)) { ?>
    <div class="empty">No accounts yet. They appear here when guests sign in with Gmail or Facebook.</div>
  <?php } else { ?>
  <table>
    <tr><th>Guest</th><th>Email</th><th>Via</th><th>Joined</th><th>Last sign-in</th></tr>
    <?php foreach ($members as $m) { $nm = g($m, 'name'); $pic = g($m, 'picture'); ?>
    <tr>
      <td><?php if ($pic !== '') { ?><img src="<?php echo h($pic); ?>" alt="" referrerpolicy="no-referrer"><?php } else { ?><span class="av"><?php echo h(strtoupper(substr($nm !== '' ? $nm : '?', 0, 1))); ?></span><?php } ?><?php echo h($nm); ?></td>
      <td><?php echo h(g($m, 'email')); ?></td>
      <td><?php echo h(g($m, 'provider')); ?></td>
      <td><?php echo h(substr(g($m, 'created'), 0, 10)); ?></td>
      <td><?php echo h(substr(g($m, 'last_login'), 0, 10)); ?> (<?php echo h(g($m, 'logins')); ?>)</td>
    </tr>
    <?php } ?>
  </table>
  <?php } ?>
</div>
</body>
</html>
