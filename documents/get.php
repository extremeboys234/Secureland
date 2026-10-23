<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

// Require GET method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Method Not Allowed'
    ]));
}

// Check authentication
if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Unauthenticated'
    ]));
}

// Get CSRF token from header (for consistency, though GET typically doesn't require CSRF)
// But we'll still check if provided, for defense in depth
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!empty($csrfToken)) {
    // Validate CSRF token if provided
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $csrfToken)) {
        http_response_code(403);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Invalid CSRF token'
        ]));
    }
}

// Get document ID from query parameter
$id = $_GET['id'] ?? '';
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $id)) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid document ID'
    ]));
}

// Database connection
try {
    $pdo = securelandDatabaseConnection();

    // Get document record
    $stmt = $pdo->prepare(
        'SELECT d.id, d.user_id, d.filename, d.actual_filename, d.sha256_hash, d.upload_date,
         d.processing_status, d.approval_status, d.integrity_status,
         d.document_number, d.property_id, d.owner_name, d.issuing_authority,
         d.issue_date, d.description, d.reviewed_by, d.reviewed_at, d.review_note,
         u.email AS submitting_user
         FROM secureland_documents d
         LEFT JOIN users u ON u.id = d.user_id
         WHERE d.id = :id'
    );
    $stmt->execute(['id' => $id]);
    $document = $stmt->fetch();

    if (!$document) {
        http_response_code(404);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Document not found'
        ]));
    }

    $isOwner = (int) ($_SESSION['user_id'] ?? 0) === (int) ($document['user_id'] ?? 0);
    $isAdmin = (string) ($_SESSION['role'] ?? '') === 'admin';
    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Access denied. You do not own this document.'
        ]));
    }

    // Format date for JSON serialization
    $document['upload_date'] = $document['upload_date'] ? (new DateTime($document['upload_date']))->format('Y-m-d H:i:s') : null;

    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $document,
        'error' => null
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand get database error: ' . $exception->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The document retrieval service is temporarily unavailable.'
    ]));
}
