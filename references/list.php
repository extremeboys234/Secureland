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

try {
    $pdo = securelandDatabaseConnection();

    $filterActiveOnly = isset($_GET['active'])
        ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
        : true;
    if ($filterActiveOnly === null) {
        http_response_code(400);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Invalid active filter'
        ]));
    }

    $sql = 'SELECT id, name, filename, sha256_hash, is_active, is_validated, is_demo, registered_by, registered_at, validated_by, validated_at FROM secureland_trusted_references';

    if ($filterActiveOnly) {
        $sql .= ' WHERE is_active = 1 AND is_validated = 1';
    }

    $sql .= ' ORDER BY registered_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $references = $stmt->fetchAll();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $references,
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand trusted reference list error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference listing service is temporarily unavailable.'
    ]);
    exit;
}
