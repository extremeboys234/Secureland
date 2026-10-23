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

// Require CSRF token for state-changing operation
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

$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$password = $_POST['password'] ?? '';
$role = $_POST['role'] ?? '';

if (
    $email === false ||
    !is_string($email) ||
    !is_string($password) ||
    $password === '' ||
    !is_string($role) ||
    !in_array($role, ['user', 'admin'], true)
) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Enter a valid email, password, and account role.'
    ]));
}

try {
    $pdo = securelandDatabaseConnection();

    $query = $pdo->prepare(
        'SELECT id, email, password_hash, role
         FROM users
         WHERE email = :email
         LIMIT 1'
    );
    $query->execute(['email' => strtolower(trim($email))]);
    $user = $query->fetch();

    $credentialsMatch = is_array($user)
        && isset($user['password_hash'])
        && password_verify($password, (string) $user['password_hash']);
    $roleMatches = $credentialsMatch
        && isset($user['role'])
        && hash_equals((string) $user['role'], $role);

    if (!$credentialsMatch || !$roleMatches) {
        http_response_code(401);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => !$credentialsMatch
                ? 'Invalid email or password.'
                : 'This account is not authorized for the selected role.'
        ]));
    }

    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['email'] = (string) $user['email'];
    $_SESSION['role'] = $role;

    // Generate a new CSRF token for the new session
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'user_id' => (int) $user['id'],
            'email' => (string) $user['email'],
            'role' => $role
        ],
        'error' => null
    ]);
    exit;
} catch (PDOException $exception) {
    error_log('SecureLand login database error: ' . $exception->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'The login service is temporarily unavailable.'
    ]));
}
?>