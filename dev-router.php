<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($path) || str_contains(rawurldecode($path), "\0")) {
    http_response_code(400);
    exit;
}

$path = rawurldecode($path);
$allowedEndpoints = [
    '/admin/stats.php',
    '/auth/csrf-token.php',
    '/auth/login.php',
    '/auth/logout.php',
    '/auth/me.php',
    '/documents/download.php',
    '/documents/get.php',
    '/documents/list.php',
    '/documents/pending-review.php',
    '/documents/review.php',
    '/documents/upload.php',
    '/documents/verification-history.php',
    '/documents/verify.php',
    '/references/activate.php',
    '/references/get.php',
    '/references/list.php',
    '/references/register.php',
];

if (!in_array($path, $allowedEndpoints, true)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'data' => null, 'error' => 'Not Found']);
    exit;
}

return false;
