<?php
session_start();
require_once 'config/database.php';

header('Content-Type: application/json');

try {
    // Get current user ID from session
    $user_id = $_SESSION['user_id'] ?? null;
    
    if (!$user_id) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }
    
    // Get PBK history for current user
    $stmt = $pdo->prepare("\n        SELECT pbk_number, request_date, line_name, machine_name, \n               problem_description, status, priority, COALESCE(created_by, user_id) AS created_by\n        FROM pbk_requests \n        WHERE COALESCE(created_by, user_id) = ? \n        ORDER BY request_date DESC, created_at DESC\n        LIMIT 50\n    ");
    $stmt->execute([$user_id]);
    $pbk_requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $pbk_requests
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>