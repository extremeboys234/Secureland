<?php
declare(strict_types=1);

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method Not Allowed');
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
if ($csrfToken === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $csrfToken)) {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Invalid CSRF token'
    ]));
}

// Regenerate session ID and destroy session
session_regenerate_id(true);
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}
session_destroy();

// Return JSON response
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => null,
    'error' => null
]);
exit;
