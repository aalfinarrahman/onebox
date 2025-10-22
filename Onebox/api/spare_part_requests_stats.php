<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM spare_part_requests GROUP BY status");
    $results = $stmt->fetchAll();
    
    $data = ['pending' => 0, 'processing' => 0, 'fulfilled' => 0, 'rejected' => 0];
    
    foreach ($results as $row) {
        $status = strtolower($row['status']);
        if ($status === 'approved' || $status === 'issued') {
            $data['processing'] += (int)$row['count'];
        } elseif ($status === 'completed' || $status === 'Completed') {
            $data['fulfilled'] += (int)$row['count'];
        } elseif (isset($data[$status])) {
            $data[$status] = (int)$row['count'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'pending' => $data['pending'],
        'processing' => $data['processing'],
        'fulfilled' => $data['fulfilled'],
        'rejected' => $data['rejected']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
    error_log("Spare part requests stats error: " . $e->getMessage());
}
?>