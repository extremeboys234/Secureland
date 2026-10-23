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

try {
    $pdo = securelandDatabaseConnection();

    // Get documents for the current user
    $stmt = $pdo->prepare(
        'SELECT id, filename, actual_filename, sha256_hash, upload_date,
         processing_status, approval_status, integrity_status,
         document_number, property_id, owner_name, issuing_authority, issue_date,
         CASE WHEN approval_status = \'rejected\' THEN review_note ELSE NULL END AS review_note,
         reviewed_at
         FROM secureland_documents
         WHERE user_id = :user_id
         ORDER BY upload_date DESC'
    );
    $stmt->execute(['user_id' => $_SESSION['user_id']]);
    $documents = $stmt->fetchAll();

    // Format dates for JSON serialization
    foreach ($documents as &$doc) {
        $doc['upload_date'] = $doc['upload_date'] ? (new DateTime($doc['upload_date']))->format('Y-m-d H:i:s') : null;
    }

    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $documents,
        'error' => null
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand list database error: ' . $exception->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The document listing service is temporarily unavailable.'
    ]));
}
?>