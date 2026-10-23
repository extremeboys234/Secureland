<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Method Not Allowed']));
}

if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Unauthenticated']));
}

if ((string) ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Administrator access is required.']));
}

try {
    $pdo = securelandDatabaseConnection();

    $statistics = $pdo->query(
        "SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM secureland_documents) AS total_documents,
            (SELECT COUNT(*) FROM secureland_documents WHERE approval_status = 'approved') AS approved_documents,
            (SELECT COUNT(*) FROM secureland_verification_logs
             WHERE verification_status IN (
                'MISMATCH',
                'NO_TRUSTED_REFERENCE',
                'INVALID_REFERENCE',
                'INACTIVE_REFERENCE',
                'REFERENCE_ERROR',
                'REFERENCE_UNAVAILABLE',
                'DOCUMENT_UNAVAILABLE',
                'ERROR'
             )) AS failed_verification_attempts"
    )->fetch();

    echo json_encode([
        'success' => true,
        'data' => [
            'total_users' => (int) $statistics['total_users'],
            'total_documents' => (int) $statistics['total_documents'],
            'approved_documents' => (int) $statistics['approved_documents'],
            'failed_verification_attempts' => (int) $statistics['failed_verification_attempts'],
        ],
        'error' => null,
    ]);
} catch (PDOException $exception) {
    error_log('SecureLand admin statistics query failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Dashboard statistics are temporarily unavailable.',
    ]);
}
