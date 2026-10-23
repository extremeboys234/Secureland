<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
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

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (empty($csrfToken) || !hash_equals($_SESSION['csrf_token'] ?? '', $csrfToken)) {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid CSRF token'
    ]));
}

$documentId = trim((string) ($_POST['document_id'] ?? $_POST['documentId'] ?? ''));
$referenceId = trim((string) ($_POST['reference_id'] ?? $_POST['referenceId'] ?? ''));

if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $documentId)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid document ID'
    ]));
}

if ($referenceId === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $referenceId)) {
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

    $documentStmt = $pdo->prepare('SELECT id, user_id, filename, actual_filename, sha256_hash FROM secureland_documents WHERE id = :id LIMIT 1');
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

    $referenceStmt = $pdo->prepare('SELECT id, sha256_hash, is_active, is_validated FROM secureland_trusted_references WHERE id = :id LIMIT 1');
    $referenceStmt->execute(['id' => $referenceId]);
    $reference = $referenceStmt->fetch();

    $result = 'ERROR';
    $logStatus = 'REFERENCE_ERROR';
    $integrityStatus = 'REFERENCE_ERROR';
    $reason = 'Verification could not be completed.';
    $reasonCode = 'VERIFICATION_ERROR';
    $calculatedHash = null;
    $expectedHash = null;
    $fileSize = null;
    $signatureStatus = 'VALIDATION_UNAVAILABLE';
    $signatureValidationMessage = 'Digital signature inspection is not implemented; no signature result is available.';

    if (!$reference) {
        $result = 'REFERENCE_UNAVAILABLE';
        $logStatus = 'NO_TRUSTED_REFERENCE';
        $integrityStatus = 'NO_TRUSTED_REFERENCE';
        $reason = 'The selected reference does not exist or is unavailable.';
        $reasonCode = 'REFERENCE_NOT_FOUND';
    } else {
        $candidateExpectedHash = strtolower((string) $reference['sha256_hash']);
        if (preg_match('/^[a-f0-9]{64}$/', $candidateExpectedHash)) {
            $expectedHash = $candidateExpectedHash;
        }

        if ((int) ($reference['is_active'] ?? 0) !== 1) {
            $result = 'REFERENCE_UNAVAILABLE';
            $logStatus = 'INACTIVE_REFERENCE';
            $integrityStatus = 'INACTIVE_REFERENCE';
            $reason = 'The selected reference is inactive.';
            $reasonCode = 'REFERENCE_INACTIVE';
        } elseif ((int) ($reference['is_validated'] ?? 0) !== 1) {
            $result = 'REFERENCE_UNAVAILABLE';
            $logStatus = 'INVALID_REFERENCE';
            $integrityStatus = 'INVALID_REFERENCE';
            $reason = 'The selected reference has not been validated.';
            $reasonCode = 'REFERENCE_UNVALIDATED';
        } elseif ($expectedHash === null) {
            $result = 'ERROR';
            $logStatus = 'REFERENCE_ERROR';
            $integrityStatus = 'ERROR';
            $reason = 'The trusted reference hash is invalid.';
            $reasonCode = 'REFERENCE_HASH_INVALID';
        } else {
            $storageRoot = realpath(dirname(__DIR__) . '/../storage');
            if ($storageRoot === false) {
                $result = 'ERROR';
                $logStatus = 'REFERENCE_ERROR';
                $integrityStatus = 'ERROR';
                $reason = 'The protected storage directory is unavailable.';
                $reasonCode = 'STORAGE_UNAVAILABLE';
            } else {
                $storedFilename = (string) ($document['actual_filename'] ?? '');
                $safeFileName = basename($storedFilename);
                $candidatePath = $storageRoot . DIRECTORY_SEPARATOR . $safeFileName;
                $realPath = realpath($candidatePath);

                if (
                    $storedFilename === '' ||
                    $safeFileName !== $storedFilename ||
                    $realPath === false ||
                    !is_file($realPath) ||
                    !is_readable($realPath) ||
                    strncmp($realPath, $storageRoot . DIRECTORY_SEPARATOR, strlen($storageRoot . DIRECTORY_SEPARATOR)) !== 0
                ) {
                    $result = 'DOCUMENT_UNAVAILABLE';
                    $logStatus = 'DOCUMENT_UNAVAILABLE';
                    $integrityStatus = 'DOCUMENT_UNAVAILABLE';
                    $reason = 'The stored document file is missing or unreadable.';
                    $reasonCode = 'DOCUMENT_UNAVAILABLE';
                } else {
                    $hashResult = hash_file('sha256', $realPath);
                    if ($hashResult === false) {
                        $result = 'ERROR';
                        $logStatus = 'REFERENCE_ERROR';
                        $integrityStatus = 'ERROR';
                        $reason = 'The document hash could not be calculated.';
                        $reasonCode = 'HASH_CALCULATION_FAILED';
                    } else {
                        $calculatedHash = strtolower($hashResult);
                        clearstatcache(true, $realPath);
                        $fileSize = filesize($realPath);

                        if ($fileSize === false) {
                            $result = 'ERROR';
                            $logStatus = 'REFERENCE_ERROR';
                            $integrityStatus = 'ERROR';
                            $reason = 'The document metadata could not be read.';
                            $reasonCode = 'DOCUMENT_METADATA_UNAVAILABLE';
                        } elseif (hash_equals($expectedHash, $calculatedHash)) {
                            $result = 'MATCH';
                            $logStatus = 'MATCH';
                            $integrityStatus = 'MATCH';
                            $reason = 'The document hash matches the active trusted reference.';
                            $reasonCode = 'HASH_MATCH';
                        } else {
                            $result = 'MISMATCH';
                            $logStatus = 'MISMATCH';
                            $integrityStatus = 'MISMATCH';
                            $reason = 'The document hash differs from the active trusted reference.';
                            $reasonCode = 'HASH_MISMATCH';
                        }
                    }
                }
            }
        }
    }

    $pdo->beginTransaction();
    $loggedReferenceId = $reference ? $referenceId : null;
    $logInsert = $pdo->prepare(
        'INSERT INTO secureland_verification_logs (
            document_id, reference_id, verification_status, verified_by, file_name, file_size,
            calculated_sha256, expected_sha256, signature_status, reason_code
         ) VALUES (
            :document_id, :reference_id, :verification_status, :verified_by, :file_name, :file_size,
            :calculated_sha256, :expected_sha256, :signature_status, :reason_code
         )'
    );
    $logInsert->execute([
        'document_id' => $documentId,
        'reference_id' => $loggedReferenceId,
        'verification_status' => $logStatus,
        'verified_by' => $_SESSION['user_id'],
        'file_name' => $document['filename'] ?? null,
        'file_size' => $fileSize,
        'calculated_sha256' => $calculatedHash,
        'expected_sha256' => $expectedHash,
        'signature_status' => $signatureStatus,
        'reason_code' => $reasonCode,
    ]);

    $pdo->prepare('UPDATE secureland_documents SET integrity_status = :integrity_status WHERE id = :id')->execute([
        'integrity_status' => $integrityStatus,
        'id' => $documentId,
    ]);
    $pdo->commit();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'document_id' => $documentId,
            'reference_id' => $referenceId,
            'result' => $result,
            'status' => $result,
            'reason' => $reason,
            'reason_code' => $reasonCode,
            'signature_status' => $signatureStatus,
            'signature_validation_message' => $signatureValidationMessage,
            'calculated_sha256' => $calculatedHash,
            'expected_sha256' => $expectedHash,
            'verified_at' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z'),
        ],
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('SecureLand verification database error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The document verification service is temporarily unavailable.'
    ]);
    exit;
}
