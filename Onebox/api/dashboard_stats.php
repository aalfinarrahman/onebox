<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Get PBK statistics
    $stmt = $pdo->query("SELECT COUNT(*) as pending_pbk FROM pbk_requests WHERE status = 'Pending'");
    $pending_pbk = $stmt->fetch()['pending_pbk'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as active_maintenance FROM maintenance_tasks WHERE status = 'In Progress'");
    $active_maintenance = $stmt->fetch()['active_maintenance'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as low_stock FROM inventory_items WHERE current_stock <= minimum_stock AND status = 'Active'");
    $low_stock = $stmt->fetch()['low_stock'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as spare_requests FROM spare_part_requests WHERE status = 'Pending'");
    $spare_requests = $stmt->fetch()['spare_requests'];
    
    echo json_encode([
        'success' => true,
        'pending_pbk' => $pending_pbk,
        'active_maintenance' => $active_maintenance,
        'low_stock' => $low_stock,
        'spare_requests' => $spare_requests
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("Dashboard stats error: " . $e->getMessage());
}
?>