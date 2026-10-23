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

if ((string) ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Only administrators can register trusted references.'
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

$referenceId = trim((string) ($_POST['reference_id'] ?? $_POST['referenceId'] ?? ''));
if ($referenceId === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $referenceId)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid reference ID'
    ]));
}

$name = trim((string) ($_POST['name'] ?? 'Demo Property Record'));
if ($name === '' || strlen($name) > 255) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Reference name must contain 1 to 255 characters.'
    ]));
}

$hashValue = strtolower(trim((string) ($_POST['sha256_hash'] ?? $_POST['hash'] ?? '')));
if (!preg_match('/^[a-f0-9]{64}$/', $hashValue)) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Trusted reference hashes must be valid SHA-256 hex strings.'
    ]));
}

$isActive = false;
if (array_key_exists('is_active', $_POST)) {
    $activeValue = $_POST['is_active'];
    if (
        !is_string($activeValue) ||
        filter_var($activeValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null
    ) {
        http_response_code(400);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Invalid active state.'
        ]));
    }
    $isActive = filter_var($activeValue, FILTER_VALIDATE_BOOLEAN);
}

$referenceCatalog = [
    'SL-REF-0001' => 'SL-REF-0001_Demo_Property_Record.pdf',
    'SL-REF-0002' => 'SL-REF-0002_Demo_Property_Record.pdf',
    'SL-REF-0003' => 'SL-REF-0003_Demo_Property_Record.pdf',
];

if (!isset($referenceCatalog[$referenceId])) {
    http_response_code(400);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'This reference ID is not recognized by the SecureLand reference catalog.'
    ]));
}

$referenceRoot = dirname(__DIR__) . '/../secureland-private/references';
$referenceRoot = realpath($referenceRoot);
if ($referenceRoot === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference storage location is unavailable.'
    ]));
}

$referenceFile = $referenceRoot . '/' . $referenceCatalog[$referenceId];
if (!is_file($referenceFile) || !is_readable($referenceFile)) {
    http_response_code(404);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Trusted reference file is missing or unreadable.'
    ]));
}

$hashResult = @hash_file('sha256', $referenceFile);
if ($hashResult === false) {
    error_log('SecureLand trusted reference registration: failed to calculate reference file hash.');
    http_response_code(500);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference file could not be validated.'
    ]));
}

$actualHash = strtolower($hashResult);
if (!hash_equals($actualHash, $hashValue)) {
    http_response_code(409);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Reference hash does not match the stored trusted file.'
    ]));
}

try {
    $pdo = securelandDatabaseConnection();

    $stmt = $pdo->prepare(
        'SELECT id, name, filename, actual_filename, sha256_hash, is_active, is_validated, is_demo, registered_by
         FROM secureland_trusted_references
         WHERE id = :id
         LIMIT 1'
    );
    $stmt->execute(['id' => $referenceId]);
    $existingReference = $stmt->fetch();
    if ($existingReference) {
        $sameRegistration = (string) $existingReference['name'] === $name
            && (string) $existingReference['filename'] === basename($referenceFile)
            && (string) $existingReference['actual_filename'] === basename($referenceFile)
            && hash_equals((string) $existingReference['sha256_hash'], $actualHash)
            && (int) $existingReference['is_active'] === (int) $isActive
            && (int) $existingReference['is_validated'] === 1
            && (int) $existingReference['is_demo'] === 1;

        if ($sameRegistration) {
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => [
                    'reference_id' => $referenceId,
                    'sha256_hash' => $actualHash,
                    'is_active' => (bool) $isActive,
                    'registered_by' => $existingReference['registered_by'],
                ],
                'error' => null,
            ]);
            exit;
        }

        http_response_code(409);
        header('Content-Type: application/json');
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'A reference with this ID already exists with different registration details.'
        ]));
    }

    $insert = $pdo->prepare(
        'INSERT INTO secureland_trusted_references (
            id, name, filename, actual_filename, sha256_hash, is_active, is_validated, is_demo,
            registered_by, registered_at, validated_by, validated_at
        ) VALUES (
            :id, :name, :filename, :actual_filename, :sha256_hash, :is_active, :is_validated, :is_demo,
            :registered_by, CURRENT_TIMESTAMP, :validated_by, CURRENT_TIMESTAMP
        )'
    );

    $insert->execute([
        'id' => $referenceId,
        'name' => $name,
        'filename' => basename($referenceFile),
        'actual_filename' => basename($referenceFile),
        'sha256_hash' => $actualHash,
        'is_active' => $isActive ? 1 : 0,
        'is_validated' => 1,
        'is_demo' => 1,
        'registered_by' => $_SESSION['user_id'],
        'validated_by' => $_SESSION['user_id'],
    ]);

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'reference_id' => $referenceId,
            'sha256_hash' => $actualHash,
            'is_active' => (bool) $isActive,
            'registered_by' => $_SESSION['user_id'],
        ],
        'error' => null,
    ]);
    exit;
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        http_response_code(409);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'data' => null,
            'error' => 'Duplicate trusted reference ID.'
        ]);
        exit;
    }

    error_log('SecureLand trusted reference registration error: ' . $exception->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The trusted reference registration service is temporarily unavailable.'
    ]);
    exit;
}
