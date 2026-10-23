<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Method Not Allowed']));
}

if (empty($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Unauthenticated']));
}

if ((string) ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Administrator access is required.']));
}

try {
    $pdo = securelandDatabaseConnection();

    $stmt = $pdo->query(
        'SELECT d.id, d.user_id, d.filename, d.document_number, d.property_id, d.owner_name,
                d.issuing_authority, d.issue_date, d.description, d.upload_date,
                d.approval_status, d.integrity_status, d.sha256_hash,
                u.email AS submitting_user
         FROM secureland_documents d
         LEFT JOIN users u ON u.id = d.user_id
         WHERE d.approval_status = \'pending\'
         ORDER BY d.upload_date ASC, d.id ASC'
    );
    $documents = $stmt->fetchAll();

    foreach ($documents as &$document) {
        $document['upload_date'] = $document['upload_date']
            ? (new DateTimeImmutable((string) $document['upload_date']))->format('Y-m-d H:i:s')
            : null;
    }
    unset($document);

    echo json_encode(['success' => true, 'data' => $documents, 'error' => null]);
} catch (PDOException $exception) {
    error_log('SecureLand pending document review query failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'data' => null, 'error' => 'The pending review queue is temporarily unavailable.']);
}
