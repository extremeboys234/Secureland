<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    header('Content-Type: application/json');
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

if ((string) ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Only administrators can change trusted reference activation.'
    ]));
}

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if ($csrfToken === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $csrfToken)) {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid CSRF token'
    ]));
}

$referenceId = trim((string) ($_POST['reference_id'] ?? $_POST['referenceId'] ?? ''));
if (!preg_match('/^[A-Za-z0-9_-]+$/', $referenceId)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid reference ID'
    ]));
}

$activeValue = $_POST['is_active'] ?? null;
$isActive = is_string($activeValue)
    ? filter_var($activeValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
    : null;
if ($isActive === null) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'A valid is_active value is required.'
    ]));
}

$referenceCatalog = [
    'SL-REF-0001' => 'SL-REF-0001_Demo_Property_Record.pdf',
    'SL-REF-0002' => 'SL-REF-0002_Demo_Property_Record.pdf',
    'SL-REF-0003' => 'SL-REF-0003_Demo_Property_Record.pdf',
];

try {
    $pdo = securelandDatabaseConnection();

    $lookup = $pdo->prepare(
        'SELECT id, actual_filename, sha256_hash, is_active, is_validated
         FROM secureland_trusted_references
         WHERE id = :id
         LIMIT 1'
    );
    $lookup->execute(['id' => $referenceId]);
    $reference = $lookup->fetch();

    if (!$reference) {
        http_response_code(404);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Trusted reference not found.'
        ]));
    }

    if ($isActive) {
        $expectedFilename = $referenceCatalog[$referenceId] ?? null;
        if (
            $expectedFilename === null ||
            !hash_equals($expectedFilename, (string) $reference['actual_filename']) ||
            (int) $reference['is_validated'] !== 1
        ) {
            http_response_code(409);
            header('Content-Type: application/json');
            exit(json_encode([
                'success' => false,
                'data' => null,
                'error' => 'The reference is not eligible for activation.'
            ]));
        }

        $expectedHash = strtolower((string) $reference['sha256_hash']);
        if (!preg_match('/^[a-f0-9]{64}$/', $expectedHash)) {
            http_response_code(409);
            header('Content-Type: application/json');
            exit(json_encode([
                'success' => false,
                'data' => null,
                'error' => 'The stored trusted reference hash is invalid.'
            ]));
        }

        $referenceRoot = realpath(dirname(__DIR__) . '/../secureland-private/references');
        if ($referenceRoot === false) {
            error_log('SecureLand reference activation: trusted reference directory unavailable.');
            http_response_code(500);
            header('Content-Type: application/json');
            exit(json_encode([
                'success' => false,
                'data' => null,
                'error' => 'The trusted reference storage location is unavailable.'
            ]));
        }

        $referencePath = realpath($referenceRoot . DIRECTORY_SEPARATOR . $expectedFilename);
        if (
            $referencePath === false ||
            !is_file($referencePath) ||
            !is_readable($referencePath) ||
            strncmp($referencePath, $referenceRoot . DIRECTORY_SEPARATOR, strlen($referenceRoot . DIRECTORY_SEPARATOR)) !== 0
        ) {
            http_response_code(409);
            header('Content-Type: application/json');
            exit(json_encode([
                'success' => false,
                'data' => null,
                'error' => 'The trusted reference file is missing or unreadable.'
            ]));
        }

        $actualHash = @hash_file('sha256', $referencePath);
        if ($actualHash === false || !hash_equals($expectedHash, strtolower($actualHash))) {
            error_log('SecureLand reference activation: reference file hash validation failed for ' . $referenceId . '.');
            http_response_code(409);
            header('Content-Type: application/json');
            exit(json_encode([
                'success' => false,
                'data' => null,
                'error' => 'The trusted reference file no longer matches its validated hash.'
            ]));
        }
    }

    $deactivationReason = trim((string) ($_POST['deactivation_reason'] ?? ''));
    if (!$isActive && strlen($deactivationReason) > 1000) {
        http_response_code(400);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Deactivation reason must not exceed 1000 characters.'
        ]));
    }

    if ((int) $reference['is_active'] === (int) $isActive) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => [
                'reference_id' => $referenceId,
                'is_active' => $isActive,
                'changed' => false,
            ],
            'error' => null,
        ]);
        exit;
    }

    $pdo->beginTransaction();
    if ($isActive) {
        $update = $pdo->prepare(
            'UPDATE secureland_trusted_references
             SET is_active = 1, deactivated_by = NULL, deactivated_at = NULL, deactivation_reason = NULL
             WHERE id = :id AND is_validated = 1'
        );
        $update->execute(['id' => $referenceId]);
    } else {
        $update = $pdo->prepare(
            'UPDATE secureland_trusted_references
             SET is_active = 0, deactivated_by = :admin_id, deactivated_at = CURRENT_TIMESTAMP, deactivation_reason = :reason
             WHERE id = :id'
        );
        $update->execute([
            'admin_id' => $_SESSION['user_id'],
            'reason' => $deactivationReason !== '' ? $deactivationReason : null,
            'id' => $referenceId,
        ]);
    }

    $audit = $pdo->prepare(
        'INSERT INTO secureland_admin_audit_log (admin_user_id, action, target_type, target_id, action_details)
         VALUES (:admin_user_id, :action, :target_type, :target_id, :action_details)'
    );
    $audit->execute([
        'admin_user_id' => $_SESSION['user_id'],
        'action' => $isActive ? 'trusted_reference_activated' : 'trusted_reference_deactivated',
        'target_type' => 'trusted_reference',
        'target_id' => $referenceId,
        'action_details' => json_encode([
            'is_active' => $isActive,
            'deactivation_reason' => !$isActive && $deactivationReason !== '' ? $deactivationReason : null,
        ], JSON_THROW_ON_ERROR),
    ]);
    $pdo->commit();

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'reference_id' => $referenceId,
            'is_active' => $isActive,
            'changed' => true,
        ],
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('SecureLand trusted reference activation database error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference activation service is temporarily unavailable.'
    ]);
    exit;
} catch (JsonException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('SecureLand trusted reference activation audit serialization failed.');
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference activation service is temporarily unavailable.'
    ]);
    exit;
}
