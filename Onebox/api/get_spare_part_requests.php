<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

try {
    $pbkId = isset($_GET['pbk_id']) ? intval($_GET['pbk_id']) : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $userOnly = isset($_GET['user_only']) && ($_GET['user_only'] === 'true' || $_GET['user_only'] === '1');
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : null;

    $sql = "
        SELECT spr.*, 
               u.username AS requested_by_name,
               i.item_name,
               p.pbk_number
        FROM spare_part_requests spr
        LEFT JOIN users u ON spr.requested_by = u.id
        LEFT JOIN inventory_items i ON spr.item_id = i.id
        LEFT JOIN pbk_requests p ON spr.pbk_id = p.id
        WHERE 1=1
    ";

    $params = [];

    if ($pbkId) {
        $sql .= " AND spr.pbk_id = ?";
        $params[] = $pbkId;
    }

    if ($status) {
        $sql .= " AND spr.status = ?";
        $params[] = $status;
    }

    if ($userOnly && isset($_SESSION['user_id'])) {
        $sql .= " AND spr.requested_by = ?";
        $params[] = $_SESSION['user_id'];
    }

    $sql .= " ORDER BY spr.created_at DESC";
    if ($limit) {
        $sql .= " LIMIT ?";
        $params[] = $limit;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $spare_requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $spare_requests
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log('Get spare part requests error: ' . $e->getMessage());
}
?>