<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header('Cross-Origin-Opener-Policy: same-origin');
header('Cross-Origin-Resource-Policy: same-origin');
header('X-Permitted-Cross-Domain-Policies: none');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'self'; base-uri 'none'");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed.'], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

try {
    $limit = max(1, min(12, (int)($_GET['limit'] ?? 6)));
    $offset = max(0, min(1000, (int)($_GET['offset'] ?? 0)));
    $pdo = database();
    $stmt = $pdo->prepare(
        'SELECT name, message, created_at
         FROM birthday_messages
         ORDER BY created_at DESC, id DESC
         LIMIT :limit OFFSET :offset'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countStmt = $pdo->query('SELECT COUNT(*) FROM birthday_messages');
    $total = (int)$countStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => $messages,
        'meta' => [
            'total' => $total,
            'returned' => count($messages),
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + count($messages)) < $total,
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    error_log('Khushi Birthday public messages failed: ' . $e->getMessage());
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'Messages are temporarily unavailable.'], JSON_UNESCAPED_UNICODE);
}
