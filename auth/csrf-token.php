<?php
declare(strict_types=1);

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit('Method Not Allowed');
}

// If no CSRF token in session, generate one
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Return CSRF token
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => [
        'csrf_token' => $_SESSION['csrf_token']
    ],
    'error' => null
]);
exit;
