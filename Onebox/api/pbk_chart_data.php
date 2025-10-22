<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM pbk_requests GROUP BY status");
    $results = $stmt->fetchAll();
    
    $data = ['pending' => 0, 'in_progress' => 0, 'completed' => 0, 'cancelled' => 0];
    
    foreach ($results as $row) {
        $status = strtolower(str_replace(' ', '_', $row['status']));
        if (isset($data[$status])) {
            $data[$status] = (int)$row['count'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("PBK chart data error: " . $e->getMessage());
}
?>