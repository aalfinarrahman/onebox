<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $stmt = $pdo->query("SELECT COUNT(*) as total_items FROM inventory_items WHERE status = 'Active'");
    $total_items = $stmt->fetch()['total_items'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as in_stock FROM inventory_items WHERE current_stock > minimum_stock AND status = 'Active'");
    $in_stock = $stmt->fetch()['in_stock'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as low_stock FROM inventory_items WHERE current_stock <= minimum_stock AND current_stock > 0 AND status = 'Active'");
    $low_stock = $stmt->fetch()['low_stock'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as out_of_stock FROM inventory_items WHERE current_stock = 0 AND status = 'Active'");
    $out_of_stock = $stmt->fetch()['out_of_stock'];
    
    echo json_encode([
        'success' => true,
        'total_items' => $total_items,
        'in_stock' => $in_stock,
        'low_stock' => $low_stock,
        'out_of_stock' => $out_of_stock
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("Inventory stats error: " . $e->getMessage());
}
?>