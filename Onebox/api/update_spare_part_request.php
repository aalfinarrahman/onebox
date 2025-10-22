<?php
require_once '../config/database.php';
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['request_id']) || empty($input['action'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }
    
    $request_id = $input['request_id'];
    $action = $input['action'];
    $user_id = $_SESSION['user_id'] ?? 1;
    
    switch ($action) {
        case 'approve':
            $stmt = $pdo->prepare("
                UPDATE spare_part_requests 
                SET status = 'Approved', 
                    approved_by = ?, 
                    approved_date = NOW() 
                WHERE id = ?
            ");
            $result = $stmt->execute([$user_id, $request_id]);
            $message = 'Request approved successfully';
            break;
            
        case 'reject':
            $reason = $input['reason'] ?? 'No reason provided';
            $stmt = $pdo->prepare("
                UPDATE spare_part_requests 
                SET status = 'Rejected', 
                    approved_by = ?, 
                    approved_date = NOW(),
                    notes = CONCAT(COALESCE(notes, ''), '\nRejection Reason: ', ?)
                WHERE id = ?
            ");
            $result = $stmt->execute([$user_id, $reason, $request_id]);
            $message = 'Request rejected successfully';
            break;
            
        case 'fulfill':
            // Check if request is approved first
            $checkStmt = $pdo->prepare("SELECT status, item_id, quantity_requested FROM spare_part_requests WHERE id = ?");
            $checkStmt->execute([$request_id]);
            $request = $checkStmt->fetch();
            
            if (!$request) {
                echo json_encode(['success' => false, 'message' => 'Request not found']);
                exit;
            }
            
            if ($request['status'] !== 'Approved') {
                echo json_encode(['success' => false, 'message' => 'Request must be approved first']);
                exit;
            }
            
            // Check inventory stock
            $stockStmt = $pdo->prepare("SELECT current_stock FROM inventory_items WHERE id = ?");
            $stockStmt->execute([$request['item_id']]);
            $inventory = $stockStmt->fetch();
            
            if (!$inventory || $inventory['current_stock'] < $request['quantity_requested']) {
                echo json_encode(['success' => false, 'message' => 'Insufficient stock']);
                exit;
            }
            
            // Start transaction
            $pdo->beginTransaction();
            
            // Update request status
            $stmt = $pdo->prepare("
                UPDATE spare_part_requests 
                SET status = 'Issued', 
                    quantity_issued = quantity_requested,
                    issued_by = ?, 
                    issued_date = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([$user_id, $request_id]);
            
            // Update inventory stock
            $updateStockStmt = $pdo->prepare("
                UPDATE inventory_items 
                SET current_stock = current_stock - ?, 
                    last_updated = NOW() 
                WHERE id = ?
            ");
            $updateStockStmt->execute([$request['quantity_requested'], $request['item_id']]);
            
            // Record stock movement
            $movementStmt = $pdo->prepare("
                INSERT INTO stock_movements 
                (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes) 
                VALUES (?, 'OUT', ?, 'Issue', ?, ?, 'Spare part issued for maintenance')
            ");
            $movementStmt->execute([$request['item_id'], $request['quantity_requested'], $request_id, $user_id]);
            
            $pdo->commit();
            $message = 'Request fulfilled successfully';
            $result = true;
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            exit;
    }
    
    if ($result) {
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update request']);
    }
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage()
    ]);
    error_log("Update spare part request error: " . $e->getMessage());
}
?>