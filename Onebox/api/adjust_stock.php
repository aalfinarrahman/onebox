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
    
    $required_fields = ['item_id', 'adjustment_type'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            echo json_encode(['success' => false, 'error' => "Field $field is required"]);
            exit;
        }
    }

    $itemId = (int)$input['item_id'];
    $type = strtolower(trim($input['adjustment_type']));
    $quantity = isset($input['quantity']) ? (int)$input['quantity'] : null;

    // Validasi tipe dan quantity
    if (!in_array($type, ['add', 'remove', 'set'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid adjustment type']);
        exit;
    }
    if ($type !== 'set' && ($quantity === null || $quantity < 0)) {
        echo json_encode(['success' => false, 'error' => 'Invalid quantity']);
        exit;
    }
    if ($type === 'set' && ($quantity === null || $quantity < 0)) {
        echo json_encode(['success' => false, 'error' => 'Invalid target stock for set type']);
        exit;
    }

    // Ambil stok saat ini
    $stmt = $pdo->prepare('SELECT current_stock FROM inventory_items WHERE id = ? AND status = "Active"');
    $stmt->execute([$itemId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Item not found or inactive']);
        exit;
    }

    $current = (int)$row['current_stock'];
    $newStock = $current;

    if ($type === 'add') {
        $newStock = $current + $quantity;
    } elseif ($type === 'remove') {
        $newStock = max(0, $current - $quantity);
    } elseif ($type === 'set') {
        $newStock = $quantity;
    }

    // Update stok
    $stmt = $pdo->prepare('UPDATE inventory_items SET current_stock = ? WHERE id = ?');
    $result = $stmt->execute([$newStock, $itemId]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Stock adjusted successfully',
            'previous_stock' => $current,
            'new_stock' => $newStock
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to adjust stock']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    error_log('Adjust stock error: ' . $e->getMessage());
}
?>