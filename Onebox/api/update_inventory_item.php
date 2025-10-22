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
    $required_fields = ['id', 'item_code', 'item_name', 'category', 'current_stock', 'minimum_stock'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || ($field !== 'id' && empty($input[$field]) && $input[$field] !== 0)) {
            echo json_encode(['success' => false, 'error' => "Field $field is required"]);
            exit;
        }
    }

    $id = (int)$input['id'];

    // Pastikan item ada
    $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Item not found']);
        exit;
    }

    // Cek unik kode untuk item lain
    $stmt = $pdo->prepare("SELECT id FROM inventory_items WHERE item_code = ? AND id <> ?");
    $stmt->execute([$input['item_code'], $id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Item code already exists for another item']);
        exit;
    }

    // Update item
    $stmt = $pdo->prepare("
        UPDATE inventory_items SET
            item_code = ?,
            item_name = ?,
            category = ?,
            description = ?,
            current_stock = ?,
            minimum_stock = ?,
            maximum_stock = ?,
            unit_price = ?,
            location = ?,
            supplier = ?
        WHERE id = ?
    ");

    $result = $stmt->execute([
        $input['item_code'],
        $input['item_name'],
        $input['category'],
        $input['description'] ?? '',
        (int)$input['current_stock'],
        (int)$input['minimum_stock'],
        isset($input['maximum_stock']) ? (int)$input['maximum_stock'] : 0,
        isset($input['unit_price']) ? (float)$input['unit_price'] : 0.0,
        $input['location'] ?? '',
        $input['supplier'] ?? '',
        $id
    ]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Item updated successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to update item']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    error_log("Update inventory item error: " . $e->getMessage());
}
?>