<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $stmt = $pdo->query("
        SELECT * FROM inventory_items 
        WHERE status = 'Active' 
        ORDER BY item_name ASC
    ");
    $inventory_items = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $inventory_items
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("Get inventory error: " . $e->getMessage());
}
?>