<?php
require_once '../config/database.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        echo json_encode(['success' => false, 'error' => 'Field id is required']);
        exit;
    }

    $id = (int)$input['id'];

    // Pastikan item ada
    $stmt = $pdo->prepare('SELECT id FROM inventory_items WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Item not found']);
        exit;
    }

    // Soft delete: set status menjadi Inactive
    $stmt = $pdo->prepare("UPDATE inventory_items SET status = 'Inactive' WHERE id = ?");
    $result = $stmt->execute([$id]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Item deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to delete item']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    error_log('Delete inventory item error: ' . $e->getMessage());
}
?>