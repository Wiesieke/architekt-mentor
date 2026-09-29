<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(405, ['error' => 'Method not allowed']);
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') respond(415, ['error' => 'Unsupported content type']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 12000) respond(413, ['error' => 'Payload too large']);
$configFile = __DIR__ . '/config.local.php';
if (!is_file($configFile)) respond(503, ['error' => 'Unavailable']);
$config = require $configFile;
$token = $_SERVER['HTTP_X_STORE_TOKEN'] ?? '';
if (!is_string($token) || !is_string($config['token'] ?? null) ||
    strlen($config['token']) < 32 || !hash_equals($config['token'], $token)) respond(401, ['error' => 'Unauthorized']);
$raw = file_get_contents('php://input', false, null, 0, 12001);
if (!is_string($raw) || strlen($raw) > 12000) respond(413, ['error' => 'Payload too large']);
$data = json_decode($raw, true);
if (!is_array($data)) respond(400, ['error' => 'Invalid JSON']);

function validId(mixed $id): bool {
    return is_string($id) && (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $id);
}
function validPath(mixed $path, mixed $locale): bool {
    return is_string($path) && in_array($locale, ['pl', 'en'], true) &&
        (bool)preg_match('~^/(?:podstawy-architektury|architektura-w-ruchu|antywzorce|en/(?:foundations|architecture-in-motion|anti-patterns))/[a-z0-9-]+/$~D', $path) &&
        (($locale === 'en') === str_starts_with($path, '/en/'));
}
function textField(mixed $value, int $min, int $max): bool {
    return is_string($value) && (bool)preg_match('/\A.{'.$min.','.$max.'}\z/us', $value);
}
try {
    $pdo = new PDO(
        'mysql:host=' . $config['host'] . ';dbname=' . $config['database'] . ';charset=utf8mb4',
        $config['user'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    $action = $data['action'] ?? '';
    if ($action === 'create') {
        if (!validId($data['id'] ?? null) || !validPath($data['articlePath'] ?? null, $data['locale'] ?? null) ||
            !textField($data['name'] ?? null, 2, 80) || !textField($data['body'] ?? null, 10, 2500) ||
            !is_string($data['email'] ?? null) || strlen($data['email']) > 254 ||
            !filter_var($data['email'], FILTER_VALIDATE_EMAIL) ||
            !is_string($data['sourceHash'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $data['sourceHash']) ||
            !is_string($data['verificationHash'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $data['verificationHash'])) {
            respond(400, ['error' => 'Invalid comment']);
        }
        $limit = $pdo->prepare('SELECT COUNT(*) FROM mentor_comments WHERE created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) AND (source_hash = ? OR email = ?)');
        $limit->execute([$data['sourceHash'], $data['email']]);
        if ((int)$limit->fetchColumn() >= 3) respond(429, ['error' => 'Too many comments']);
        $stmt = $pdo->prepare("INSERT INTO mentor_comments (id, article_path, locale, display_name, email, body, source_hash, verification_hash, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 DAY))");
        $stmt->execute([$data['id'], $data['articlePath'], $data['locale'], $data['name'], $data['email'], $data['body'], $data['sourceHash'], $data['verificationHash']]);
        respond(201, ['ok' => true]);
    }
    if ($action === 'verify') {
        if (!validId($data['id'] ?? null) || !is_string($data['verificationHash'] ?? null) ||
            !preg_match('/^[a-f0-9]{64}$/D', $data['verificationHash'])) respond(400, ['error' => 'Invalid request']);
        $stmt = $pdo->prepare("UPDATE mentor_comments SET status='pending', verification_hash=NULL, verification_expires_at=NULL, verified_at=UTC_TIMESTAMP() WHERE id=? AND status='email_pending' AND verification_hash=? AND verification_expires_at>UTC_TIMESTAMP()");
        $stmt->execute([$data['id'], $data['verificationHash']]);
        respond($stmt->rowCount() === 1 ? 200 : 400, $stmt->rowCount() === 1 ? ['ok' => true] : ['error' => 'Expired or invalid link']);
    }
    if ($action === 'public') {
        if (!validPath($data['articlePath'] ?? null, $data['locale'] ?? null)) respond(400, ['error' => 'Invalid article']);
        $stmt = $pdo->prepare("SELECT id, display_name, body, published_at FROM mentor_comments WHERE article_path=? AND status='approved' ORDER BY published_at DESC LIMIT 50");
        $stmt->execute([$data['articlePath']]);
        respond(200, ['comments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($action === 'queue') {
        $stmt = $pdo->query("SELECT id, article_path, locale, display_name, email, body, created_at FROM mentor_comments WHERE status='pending' ORDER BY verified_at ASC LIMIT 100");
        respond(200, ['comments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($action === 'moderate') {
        if (!validId($data['id'] ?? null) || !in_array($data['decision'] ?? null, ['approved', 'rejected'], true)) respond(400, ['error' => 'Invalid decision']);
        $stmt = $pdo->prepare("UPDATE mentor_comments SET status=?, published_at=IF(?='approved',UTC_TIMESTAMP(),NULL) WHERE id=? AND status='pending'");
        $stmt->execute([$data['decision'], $data['decision'], $data['id']]);
        respond($stmt->rowCount() === 1 ? 200 : 404, $stmt->rowCount() === 1 ? ['ok' => true] : ['error' => 'Comment not pending']);
    }
    respond(400, ['error' => 'Unknown action']);
} catch (Throwable $error) {
    error_log('Mentor comments storage failure: ' . get_class($error));
    respond(503, ['error' => 'Storage unavailable']);
}
