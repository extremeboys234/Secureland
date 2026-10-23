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
        'SELECT id, user_id, filename, actual_filename, sha256_hash
         FROM secureland_documents
         WHERE id = :id'
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

    $ownsDocument = (int) ($_SESSION['user_id'] ?? 0) === (int) ($document['user_id'] ?? 0);
    $isAdmin = (string) ($_SESSION['role'] ?? '') === 'admin';

    if (!$ownsDocument && !$isAdmin) {
        http_response_code(403);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Access denied: you do not own this document'
        ]));
    }

    // Storage directory (outside web root)
    $storageDir = realpath(__DIR__ . '/../../storage');
    $storedFilename = (string) ($document['actual_filename'] ?? '');
    $storagePath = $storageDir !== false && basename($storedFilename) === $storedFilename
        ? realpath($storageDir . DIRECTORY_SEPARATOR . $storedFilename)
        : false;

    if (
        $storageDir === false ||
        $storagePath === false ||
        strncmp($storagePath, $storageDir . DIRECTORY_SEPARATOR, strlen($storageDir . DIRECTORY_SEPARATOR)) !== 0 ||
        !is_file($storagePath) ||
        !is_readable($storagePath)
    ) {
        http_response_code(404);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'The stored document file is unavailable.'
        ]));
    }

    // Get file extension to determine Content-Type
    $extension = strtolower(pathinfo($document['actual_filename'], PATHINFO_EXTENSION));
    $contentType = 'application/octet-stream'; // default

    switch ($extension) {
        case 'pdf':
            $contentType = 'application/pdf';
            break;
        case 'jpg':
        case 'jpeg':
            $contentType = 'image/jpeg';
            break;
        case 'png':
            $contentType = 'image/png';
            break;
    }

    // Set headers for secure download
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . rawurlencode($document['filename']) . '"');
    $fileSize = filesize($storagePath);
    if ($fileSize === false) {
        error_log('SecureLand download: failed to read stored document size.');
        http_response_code(500);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'The document download service is temporarily unavailable.'
        ]));
    }
    header('Content-Length: ' . $fileSize);
    header('Cache-Control: private, max-age=3600');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 3600) . ' GMT');

    // Read and output the file
    readfile($storagePath);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand download database error: ' . $exception->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The document download service is temporarily unavailable.'
    ]));
}
