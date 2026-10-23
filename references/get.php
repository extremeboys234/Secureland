<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Method Not Allowed'
    ]));
}

if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Unauthenticated'
    ]));
}

$id = trim((string) ($_GET['id'] ?? ''));
if ($id === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $id)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid reference ID'
    ]));
}

try {
    $pdo = securelandDatabaseConnection();

    $stmt = $pdo->prepare('SELECT id, name, filename, sha256_hash, is_active, is_validated, is_demo, registered_by, registered_at, validated_by, validated_at, deactivated_by, deactivated_at, deactivation_reason FROM secureland_trusted_references WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $reference = $stmt->fetch();

    if (!$reference) {
        http_response_code(404);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Trusted reference not found'
        ]));
    }

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $reference,
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand trusted reference lookup error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference lookup service is temporarily unavailable.'
    ]);
    exit;
}
