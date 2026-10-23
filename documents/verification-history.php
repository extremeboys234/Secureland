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

$documentId = trim((string) ($_GET['id'] ?? ''));
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $documentId)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid document ID'
    ]));
}

try {
    $pdo = securelandDatabaseConnection();

    $documentStmt = $pdo->prepare('SELECT id, user_id FROM secureland_documents WHERE id = :id LIMIT 1');
    $documentStmt->execute(['id' => $documentId]);
    $document = $documentStmt->fetch();

    if (!$document) {
        http_response_code(404);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Document not found'
        ]));
    }

    $isOwner = (int) ($_SESSION['user_id'] ?? 0) === (int) ($document['user_id'] ?? 0);
    $isAdmin = ((string) ($_SESSION['role'] ?? '')) === 'admin';
    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Access denied. You do not own this document.'
        ]));
    }

    $stmt = $pdo->prepare(
        'SELECT v.id, v.document_id, v.reference_id, v.verification_status, v.verified_at, v.verified_by, v.file_name, v.file_size,
                v.calculated_sha256, v.expected_sha256, v.signature_status, v.reason_code
         FROM secureland_verification_logs v
         WHERE v.document_id = :document_id
         ORDER BY v.verified_at DESC'
    );
    $stmt->execute(['document_id' => $documentId]);
    $history = $stmt->fetchAll();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $history,
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand verification history error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The verification history service is temporarily unavailable.'
    ]);
    exit;
}
