<?php
declare(strict_types=1);

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit('Method Not Allowed');
}

// Check if authenticated
if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'data' => null,
        'error' => 'Unauthenticated'
    ]);
    exit;
}

// Return user data
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => [
        'user_id' => $_SESSION['user_id'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'role' => $_SESSION['role'] ?? null
    ],
    'error' => null
]);
exit;
