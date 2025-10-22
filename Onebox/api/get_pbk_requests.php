<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Cek apakah kolom created_by ada di tabel pbk_requests
    $hasCreatedBy = false;
    $colStmt = $pdo->query("SHOW COLUMNS FROM pbk_requests LIKE 'created_by'");
    if ($colStmt && $colStmt->fetch()) {
        $hasCreatedBy = true;
    }

    if ($hasCreatedBy) {
        $sql = "
            SELECT p.*, COALESCE(u1.username, u2.username) as user_name
            FROM pbk_requests p
            LEFT JOIN users u1 ON p.user_id = u1.id
            LEFT JOIN users u2 ON p.created_by = u2.id
            ORDER BY p.created_at DESC
        ";
    } else {
        $sql = "
            SELECT p.*, COALESCE(u1.username, p.who_reported) as user_name
            FROM pbk_requests p
            LEFT JOIN users u1 ON p.user_id = u1.id
            ORDER BY p.created_at DESC
        ";
    }

    $stmt = $pdo->query($sql);
    $pbk_requests = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $pbk_requests
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("Get PBK requests error: " . $e->getMessage());
}
?>