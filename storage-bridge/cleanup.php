<?php
declare(strict_types=1);
// Run daily as a CLI cron job on LH.pl, never over HTTP.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
$config = require __DIR__ . '/config.local.php';
$pdo = new PDO(
    'mysql:host=' . $config['host'] . ';dbname=' . $config['database'] . ';charset=utf8mb4',
    $config['user'], $config['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
);
$pdo->exec('DELETE FROM mentor_hld_generations WHERE expires_at <= UTC_TIMESTAMP()');
$pdo->exec('DELETE FROM mentor_puzzle_assessments WHERE expires_at <= UTC_TIMESTAMP()');
