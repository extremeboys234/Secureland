<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
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

$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if ($csrfToken === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $csrfToken)) {
    http_response_code(403);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Invalid CSRF token']));
}

$documentId = trim((string) ($_POST['document_id'] ?? ''));
$decision = strtolower(trim((string) ($_POST['decision'] ?? '')));
$reviewNote = trim((string) ($_POST['review_note'] ?? ''));

if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $documentId)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Invalid document ID']));
}

if (!in_array($decision, ['approve', 'reject'], true)) {
    http_response_code(400);
    exit(json_encode(['success' => false, 'data' => null, 'error' => 'Decision must be approve or reject.']));
}

if (($decision === 'reject' && $reviewNote === '') || mb_strlen($reviewNote, 'UTF-8') > 5000) {
    http_response_code(400);
    exit(json_encode([
        'success' => false,
        'data' => null,
        'error' => $decision === 'reject'
            ? 'A rejection reason is required.'
            : 'The review note exceeds the maximum length.'
    ]));
}

$newStatus = $decision === 'approve' ? 'approved' : 'rejected';
try {
    $pdo = securelandDatabaseConnection();

    $pdo->beginTransaction();
    $documentStmt = $pdo->prepare(
        'SELECT id, approval_status FROM secureland_documents WHERE id = :id FOR UPDATE'
    );
    $documentStmt->execute(['id' => $documentId]);
    $document = $documentStmt->fetch();

    if (!$document) {
        $pdo->rollBack();
        http_response_code(404);
        exit(json_encode(['success' => false, 'data' => null, 'error' => 'Document not found.']));
    }

    if ((string) $document['approval_status'] !== 'pending') {
        $pdo->rollBack();
        http_response_code(409);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'This document has already been reviewed and cannot be changed.'
        ]));
    }

    $update = $pdo->prepare(
        'UPDATE secureland_documents
         SET approval_status = :status, reviewed_by = :reviewed_by,
             reviewed_at = CURRENT_TIMESTAMP, review_note = :review_note
         WHERE id = :id AND approval_status = \'pending\''
    );
    $update->execute([
        'status' => $newStatus,
        'reviewed_by' => (int) $_SESSION['user_id'],
        'review_note' => $reviewNote !== '' ? $reviewNote : null,
        'id' => $documentId,
    ]);

    if ($update->rowCount() !== 1) {
        $pdo->rollBack();
        http_response_code(409);
        exit(json_encode([
            'success' => false,
            'data' => null,
            'error' => 'This document was reviewed by another administrator. Refresh the queue.'
        ]));
    }

    $audit = $pdo->prepare(
        'INSERT INTO secureland_admin_audit_log (admin_user_id, action, target_type, target_id, action_details)
         VALUES (:admin_user_id, :action, \'document\', :target_id, :action_details)'
    );
    $audit->execute([
        'admin_user_id' => (int) $_SESSION['user_id'],
        'action' => 'document_' . $newStatus,
        'target_id' => $documentId,
        'action_details' => json_encode([
            'approval_status' => $newStatus,
            'review_note' => $reviewNote !== '' ? $reviewNote : null,
        ], JSON_THROW_ON_ERROR),
    ]);
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'data' => [
            'document_id' => $documentId,
            'approval_status' => $newStatus,
            'reviewed_at' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z'),
            'review_note' => $reviewNote !== '' ? $reviewNote : null,
        ],
        'error' => null,
    ]);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('SecureLand document review failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'data' => null, 'error' => 'The document review could not be completed.']);
} catch (JsonException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('SecureLand document review audit serialization failed: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'data' => null, 'error' => 'The document review could not be recorded.']);
}
