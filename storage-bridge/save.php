<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['error' => 'Method not allowed']);
if (($_SERVER['CONTENT_TYPE'] ?? '') !== 'application/json') reply(415, ['error' => 'Unsupported content type']);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 200000) reply(413, ['error' => 'Payload too large']);

$configFile = __DIR__ . '/config.local.php';
if (!is_file($configFile)) reply(503, ['error' => 'Storage unavailable']);
$config = require $configFile;
$token = $_SERVER['HTTP_X_STORE_TOKEN'] ?? '';
if (!is_string($token) || !is_string($config['token'] ?? null) ||
    strlen($config['token']) < 32 || !hash_equals($config['token'], $token)) {
    reply(401, ['error' => 'Unauthorized']);
}

$raw = file_get_contents('php://input', false, null, 0, 200001);
if ($raw === false || strlen($raw) > 200000) reply(413, ['error' => 'Payload too large']);
$record = json_decode($raw, true);
if (!is_array($record)) reply(400, ['error' => 'Invalid JSON']);

function validId(mixed $value): bool {
    return is_string($value) && (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $value);
}
function validText(mixed $value, int $min, int $max): bool {
    return is_string($value) && strlen($value) >= $min && strlen($value) <= $max;
}

if (empty($record['consent']) || !validId($record['id'] ?? null)) reply(400, ['error' => 'Invalid record']);
try {
    if (!in_array('mysql', PDO::getAvailableDrivers(), true)) {
        reply(503, ['error' => 'Storage unavailable', 'code' => 'mysql_driver_missing']);
    }
    $pdo = new PDO(
        'mysql:host=' . $config['host'] . ';dbname=' . $config['database'] . ';charset=utf8mb4',
        $config['user'], $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );
    if (($record['type'] ?? '') === 'hld') {
        if (!validText($record['brief'] ?? null, 1, 120000) || !validText($record['hld'] ?? null, 1, 150000) ||
            !validText($record['model'] ?? null, 1, 60) ||
            !in_array($record['mode'] ?? null, ['skeletal', 'full'], true) ||
            !in_array($record['diagram'] ?? null, ['yes', 'no'], true)) reply(400, ['error' => 'Invalid HLD']);
        $stmt = $pdo->prepare('INSERT INTO mentor_hld_generations (id, brief, hld, model, mode, diagram, expires_at) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 90 DAY))');
        $stmt->execute([$record['id'], $record['brief'], $record['hld'], $record['model'], $record['mode'], $record['diagram']]);
    } elseif (($record['type'] ?? '') === 'puzzle') {
        $feedback = json_encode($record['feedback'] ?? null, JSON_UNESCAPED_UNICODE);
        if (!validId($record['attemptId'] ?? null) || !validText($record['puzzleId'] ?? null, 1, 120) ||
            !in_array($record['stage'] ?? null, ['hint', 'score'], true) ||
            !validText($record['answer'] ?? null, 1, 16000) || $feedback === false ||
            !validText($feedback, 2, 16000)) reply(400, ['error' => 'Invalid puzzle assessment']);
        $stmt = $pdo->prepare('INSERT INTO mentor_puzzle_assessments (id, attempt_id, puzzle_id, stage, answer, feedback, expires_at) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 90 DAY))');
        $stmt->execute([$record['id'], $record['attemptId'], $record['puzzleId'], $record['stage'], $record['answer'], $feedback]);
    } else reply(400, ['error' => 'Unknown record type']);
    reply(201, ['ok' => true]);
} catch (PDOException $error) {
    // Only a fixed category is returned. SQL messages can include the submitted data.
    $driverCode = (int)($error->errorInfo[1] ?? 0);
    $category = match ($driverCode) {
        1044, 1045 => 'db_auth',
        1049 => 'db_not_found',
        1146 => 'table_not_found',
        2002, 2003, 2005 => 'db_connect',
        default => 'db_error',
    };
    error_log('Mentor storage PDO failure category: ' . $category);
    reply(503, ['error' => 'Storage unavailable', 'code' => $category]);
} catch (Throwable $error) {
    error_log('Mentor storage write failed: ' . get_class($error));
    reply(503, ['error' => 'Storage unavailable', 'code' => 'storage_error']);
}
