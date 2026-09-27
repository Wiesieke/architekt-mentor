<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function finish(int $status, array $result): never {
    http_response_code($status);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' ||
    !str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
    finish(405, ['error' => 'Method not allowed']);
}

$configFile = __DIR__ . '/config.local.php';
if (!is_file($configFile)) finish(503, ['error' => 'Config missing']);
$config = require $configFile;
$token = $_SERVER['HTTP_X_STORE_TOKEN'] ?? '';
if (!is_string($token) || !is_string($config['token'] ?? null) ||
    strlen($config['token']) < 32 || !hash_equals($config['token'], $token)) {
    finish(401, ['error' => 'Unauthorized']);
}

$body = json_decode(file_get_contents('php://input', false, null, 0, 1024), true);
if (!is_array($body) || ($body['type'] ?? null) !== 'health') {
    finish(400, ['error' => 'Invalid request']);
}

if (!in_array('mysql', PDO::getAvailableDrivers(), true)) {
    finish(503, ['error' => 'MySQL driver missing']);
}

$result = [
    'config_modified_utc' => gmdate('Y-m-d H:i:s', filemtime($configFile)),
    'database' => $config['database'],
    'user' => $config['user'],
    'checks' => [],
];
foreach (array_unique([$config['host'], 'sql189.lh.pl', 'localhost']) as $host) {
    try {
        $db = new PDO(
            'mysql:host=' . $host . ';dbname=' . $config['database'] . ';charset=utf8mb4',
            $config['user'], $config['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $db->query('SELECT 1');
        $result['checks'][] = ['host' => $host, 'ok' => true];
    } catch (PDOException $e) {
        $message = $e->getMessage();
        $origin = null;
        if (preg_match("/Access denied for user '[^']*'@'([^']+)'/", $message, $match)) {
            $origin = $match[1];
        }
        $result['checks'][] = [
            'host' => $host,
            'ok' => false,
            'mysql_code' => (int)($e->errorInfo[1] ?? 0),
            'origin' => $origin,
        ];
    }
}
finish(200, $result);
