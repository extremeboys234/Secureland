<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

// Require POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
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

// Get CSRF token from header
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (empty($csrfToken)) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Missing CSRF token'
    ]));
}

// Validate CSRF token
if (!hash_equals($_SESSION['csrf_token'] ?? '', $csrfToken)) {
    http_response_code(403);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid CSRF token'
    ]));
}

// PHP can reject a request before populating $_FILES when server upload limits are exceeded.
if (!isset($_FILES['document']) || !is_array($_FILES['document'])) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The server did not receive the selected file. Check the PHP upload_max_filesize and post_max_size settings.'
    ]));
}

$file = $_FILES['document'];
$uploadError = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($uploadError !== UPLOAD_ERR_OK) {
    $tooLarge = in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
    http_response_code($tooLarge ? 413 : 400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => $tooLarge
            ? 'PHP rejected the file because it exceeds the server upload limit. Increase upload_max_filesize and post_max_size, then restart the PHP server.'
            : ($uploadError === UPLOAD_ERR_NO_FILE
                ? 'No file was received. Please select a document and try again.'
                : 'The file upload did not complete. Please try again.')
    ]));
}

if (
    !isset($file['tmp_name']) ||
    !is_string($file['tmp_name']) ||
    !is_uploaded_file($file['tmp_name'])
) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The uploaded file could not be received. Please select it again and retry.'
    ]));
}

// Validate file size (max 10 MB)
$maxSize = 10 * 1024 * 1024; // 10 MB in bytes
if ($file['size'] > $maxSize) {
    http_response_code(413);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'File too large (maximum size is 10 MB)'
    ]));
}

// Validate MIME type
$allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);

if (!in_array($mimeType, $allowedMimeTypes, true)) {
    http_response_code(415);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Unsupported file type. Allowed types: PDF, JPEG, PNG.'
    ]));
}

// Generate a UUID v4 for the document ID and stored filename
function generateUuidv4(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        // 32 bits for "time_low"
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        // 16 bits for "time_mid"
        mt_rand(0, 0xffff),
        // 16 bits for "time_hi_and_version", four most significant bits holds version number 4
        mt_rand(0, 0x0fff) | 0x4000,
        // 16 bits for "clock_seq_hi_and_reserved", two most significant bits holds zero and one for variant DCE
        mt_rand(0, 0x3fff) | 0x8000,
        // 48 bits for "node"
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

$documentId = generateUuidv4();
$storedFilename = $documentId; // We'll use the same UUID for the stored file (without extension)

// Determine file extension from MIME type (or original filename)
$extension = '';
switch ($mimeType) {
    case 'application/pdf':
        $extension = '.pdf';
        break;
    case 'image/jpeg':
        $extension = '.jpg';
        break;
    case 'image/png':
        $extension = '.png';
        break;
    default:
        // This should not happen due to earlier check, but fallback to original extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ['pdf', 'jpg', 'jpeg', 'png'], true)) {
            $extension = '.bin'; // fallback
        }
        $extension = '.' . $extension;
}

// Storage directory (outside web root)
$storageDir = __DIR__ . '/../../storage/';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0750, true);
}

// Storage file path
$storagePath = $storageDir . $storedFilename . $extension;

// Move uploaded file to storage
if (!move_uploaded_file($file['tmp_name'], $storagePath)) {
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Failed to store file'
    ]));
}

// Set file permissions (readable by owner, group readable, others not)
chmod($storagePath, 0640);

// Calculate SHA-256 hash of the stored file
$sha256Hash = hash_file('sha256', $storagePath);
if ($sha256Hash === false) {
    // If hash calculation fails, we should delete the stored file and return error
    @unlink($storagePath);
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Failed to compute file hash'
    ]));
}

// Prepare data for database insertion
$originalFilename = basename($file['name']); // Prevent path traversal
$docType = $_POST['type'] ?? 'Other'; // We'll get this from the form, but we don't have it in this endpoint? We need to adjust.
// Actually, the upload endpoint should receive the form data. We'll change the endpoint to accept POST with multipart/form-data and also get the other fields.
// We'll update the endpoint to also get the form fields from $_POST.

// We'll need to change the way we call this endpoint: the frontend will send a FormData with the file and the other fields.
// So we'll also get the other fields from $_POST.

// Let's get the other fields:
$documentInfo = [
    'name' => $_POST['name'] ?? '',
    'type' => $_POST['type'] ?? 'Sale Deed',
    'propertyId' => $_POST['propertyId'] ?? '',
    'documentNumber' => $_POST['documentNumber'] ?? '',
    'issuingAuthority' => $_POST['issuingAuthority'] ?? '',
    'issueDate' => $_POST['issueDate'] ?? '',
    'ownerName' => $_POST['ownerName'] ?? '',
    'location' => $_POST['location'] ?? '',
    'description' => $_POST['description'] ?? '',
    'authorized' => isset($_POST['authorized']) && $_POST['authorized'] === 'on' ? true : false
];

$documentInfo['name'] = trim((string) $documentInfo['name']);
$documentInfo['documentNumber'] = trim((string) $documentInfo['documentNumber']);
$documentInfo['propertyId'] = trim((string) $documentInfo['propertyId']);
$documentInfo['ownerName'] = trim((string) $documentInfo['ownerName']);
$documentInfo['issuingAuthority'] = trim((string) $documentInfo['issuingAuthority']);
$documentInfo['description'] = trim((string) $documentInfo['description']);
$documentInfo['issueDate'] = trim((string) $documentInfo['issueDate']);
$fieldLimits = [
    'name' => 255,
    'documentNumber' => 100,
    'propertyId' => 100,
    'ownerName' => 255,
    'issuingAuthority' => 255,
];
$invalidMetadata = $documentInfo['name'] === '';
foreach ($fieldLimits as $field => $limit) {
    if (mb_strlen((string) $documentInfo[$field], 'UTF-8') > $limit) {
        $invalidMetadata = true;
        break;
    }
}
if (mb_strlen($documentInfo['description'], 'UTF-8') > 10000) {
    $invalidMetadata = true;
}
if (
    $documentInfo['issueDate'] !== '' &&
    (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $documentInfo['issueDate']) ||
     DateTimeImmutable::createFromFormat('!Y-m-d', $documentInfo['issueDate']) === false)
) {
    $invalidMetadata = true;
}
if ($invalidMetadata) {
    @unlink($storagePath);
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The document name or metadata is invalid or exceeds the allowed length.'
    ]));
}

// Database connection
try {
    $pdo = securelandDatabaseConnection();

    // Insert document record
    $stmt = $pdo->prepare(
        'INSERT INTO secureland_documents (
            id, user_id, filename, document_number, property_id, owner_name,
            issuing_authority, issue_date, description, actual_filename, sha256_hash,
            upload_date, processing_status, approval_status, integrity_status
        ) VALUES (
            :id, :user_id, :filename, :document_number, :property_id, :owner_name,
            :issuing_authority, :issue_date, :description, :actual_filename, :sha256_hash,
            CURRENT_TIMESTAMP, :processing_status, :approval_status, :integrity_status
        )'
    );

    $stmt->execute([
        'id' => $documentId,
        'user_id' => $_SESSION['user_id'],
        'filename' => $documentInfo['name'],
        'document_number' => $documentInfo['documentNumber'] !== '' ? $documentInfo['documentNumber'] : null,
        'property_id' => $documentInfo['propertyId'] !== '' ? $documentInfo['propertyId'] : null,
        'owner_name' => $documentInfo['ownerName'] !== '' ? $documentInfo['ownerName'] : null,
        'issuing_authority' => $documentInfo['issuingAuthority'] !== '' ? $documentInfo['issuingAuthority'] : null,
        'issue_date' => $documentInfo['issueDate'] !== '' ? $documentInfo['issueDate'] : null,
        'description' => $documentInfo['description'] !== '' ? $documentInfo['description'] : null,
        'actual_filename' => $storedFilename . $extension, // stored filename with extension
        'sha256_hash' => $sha256Hash,
        'processing_status' => 'processed',
        'approval_status' => 'pending',
        'integrity_status' => null
    ]);

    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'documentId' => $documentId,
            'sha256Hash' => $sha256Hash,
            'timestamp' => date('Y-m-d H:i:s')
        ],
        'error' => null
    ]);
    exit;
} catch (PDOException $exception) {
    // Clean up stored file on database error
    @unlink($storagePath);
    error_log('SecureLand upload database error: ' . $exception->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The upload service is temporarily unavailable.'
    ]));
}
?>