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
    
    // Validasi input
    $required_fields = ['item_code', 'item_name', 'category', 'current_stock', 'minimum_stock'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            echo json_encode(['success' => false, 'error' => "Field $field is required"]);
            exit;
        }
    }
    
    // Cek apakah item_code sudah ada
    $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE item_code = ?");
    $stmt->execute([$input['item_code']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Item code already exists']);
        exit;
    }
    
    // Insert item baru
    $stmt = $pdo->prepare("
        INSERT INTO inventory_items 
        (item_code, item_name, category, description, current_stock, minimum_stock, 
         maximum_stock, unit_price, location, supplier, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    ");
    
    $result = $stmt->execute([
        $input['item_code'],
        $input['item_name'],
        $input['category'],
        $input['description'] ?? '',
        $input['current_stock'],
        $input['minimum_stock'],
        $input['maximum_stock'] ?? 0,
        $input['unit_price'] ?? 0,
        $input['location'] ?? '',
        $input['supplier'] ?? ''
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Item added successfully',
            'item_id' => $pdo->lastInsertId()
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to add item']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    error_log("Add inventory item error: " . $e->getMessage());
}
?>