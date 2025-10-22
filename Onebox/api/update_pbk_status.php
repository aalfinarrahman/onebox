<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $pbk_id = $input['pbk_id'] ?? null;
    $new_status = $input['status'] ?? null;
    $action_type = $input['action_type'] ?? null; // 'accept', 'approve', 'reject', 'complete'
    $reject_reason = $input['reject_reason'] ?? null;
    $reject_category = $input['reject_category'] ?? null;
    
    if (!$pbk_id || !$new_status || !$action_type) {
        echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
        exit;
    }
    
    // Validate status
    $valid_statuses = ['Pending', 'In Progress', 'Completed', 'Rejected'];
    if (!in_array($new_status, $valid_statuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit;
    }

    // Start transaction
    $pdo->beginTransaction();
    
    // Update PBK status
    $update_sql = "UPDATE pbk_requests SET status = ?, updated_at = NOW()";
    $params = [$new_status, $pbk_id];

    // Deteksi kolom completed_by/completed_at bila aksi complete
    $completedByExists = false;
    $completedAtExists = false;
    if ($action_type === 'complete') {
        try {
            $checkCompletedBy = $pdo->query("SHOW COLUMNS FROM pbk_requests LIKE 'completed_by'");
            $completedByExists = $checkCompletedBy && $checkCompletedBy->rowCount() > 0;
            $checkCompletedAt = $pdo->query("SHOW COLUMNS FROM pbk_requests LIKE 'completed_at'");
            $completedAtExists = $checkCompletedAt && $checkCompletedAt->rowCount() > 0;
        } catch (Exception $e) {
            // abaikan jika gagal cek kolom
        }
    }
    
    // Add additional fields based on action type
    if ($action_type === 'accept') {
        $update_sql .= ", accepted_by = ?, accepted_at = NOW()";
        $params = [$new_status, $_SESSION['user_id'], $pbk_id];
    } else if ($action_type === 'approve') {
        $update_sql .= ", approved_by = ?, approved_at = NOW()";
        $params = [$new_status, $_SESSION['user_id'], $pbk_id];
    } else if ($action_type === 'reject') {
        $update_sql .= ", rejected_by = ?, rejected_at = NOW(), reject_reason = ?, reject_category = ?";
        $params = [$new_status, $_SESSION['user_id'], $reject_reason, $reject_category, $pbk_id];
    } else if ($action_type === 'complete') {
        // Jika kolom completed_by tersedia, catat pengguna dan waktu
        if ($completedByExists) {
            $update_sql .= ", completed_by = ?, completed_at = NOW()";
            $params = [$new_status, $_SESSION['user_id'], $pbk_id];
        } // jika tidak ada, biarkan hanya status yang diperbarui
    }
    
    $update_sql .= " WHERE id = ?";
    
    $stmt = $pdo->prepare($update_sql);
    $result = $stmt->execute($params);
    
    if (!$result) {
        throw new Exception('Failed to update PBK status');
    }
    
    // Log the activity
    $log_stmt = $pdo->prepare("\n        INSERT INTO activity_logs (user_id, activity_type, description, reference_table, reference_id, created_at) \n        VALUES (?, ?, ?, 'pbk_requests', ?, NOW())\n    ");
    
    $activity_description = "";
    switch ($action_type) {
        case 'accept':
            $activity_description = "PBK accepted and status changed to {$new_status}";
            break;
        case 'approve':
            $activity_description = "PBK approved and status changed to {$new_status}";
            break;
        case 'reject':
            $activity_description = "PBK rejected with reason: {$reject_reason}";
            break;
        case 'complete':
            $activity_description = "PBK completed and status changed to {$new_status}";
            break;
        default:
            $activity_description = "PBK status changed to {$new_status}";
            break;
    }
    
    $log_stmt->execute([
        $_SESSION['user_id'],
        'PBK_STATUS_UPDATE',
        $activity_description,
        $pbk_id
    ]);
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'PBK status updated successfully',
        'new_status' => $new_status,
        'action_type' => $action_type
    ]);
    
} catch (Exception $e) {
    // Rollback transaction
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Error updating PBK status: ' . $e->getMessage()
    ]);
}
?>