<?php
session_start();
require_once '../config/database.php';

header('Content-Type: application/json');

try {
    // Get current user ID from session
    $user_id = $_SESSION['user_id'] ?? null;
    
    // PBK Pending
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM pbk_requests WHERE status = 'Pending'");
    $stmt->execute();
    $pending_pbk = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // PBK Completed
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM pbk_requests WHERE status = 'Completed'");
    $stmt->execute();
    $completed_pbk = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total PBK This Month
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM pbk_requests WHERE MONTH(request_date) = MONTH(CURRENT_DATE()) AND YEAR(request_date) = YEAR(CURRENT_DATE())");
    $stmt->execute();
    $monthly_pbk = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Urgent PBK
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM pbk_requests WHERE priority = 'urgent' AND status != 'Completed'");
    $stmt->execute();
    $urgent_pbk = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'pending_pbk' => (int)$pending_pbk,
            'completed_pbk' => (int)$completed_pbk,
            'monthly_pbk' => (int)$monthly_pbk,
            'urgent_pbk' => (int)$urgent_pbk
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>