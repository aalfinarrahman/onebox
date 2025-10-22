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
    
    // Validation
    if (empty($input['inventory_item_id']) || empty($input['part_name']) || 
        empty($input['quantity']) || empty($input['urgency']) || empty($input['justification'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }
    
    // Generate request number
    $request_number = 'SPR-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Get user info from session
    $user_id = $_SESSION['user_id'] ?? 1;
    
    // Insert spare part request - sesuaikan dengan struktur tabel yang benar
    $stmt = $pdo->prepare("
        INSERT INTO spare_part_requests 
        (request_number, item_id, quantity_requested, urgency, justification, 
         requested_by, status, notes) 
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
    ");
    
    // Gabungkan informasi part dalam notes
    $notes = "Part Name: " . $input['part_name'];
    if (!empty($input['part_code'])) {
        $notes .= "\nPart Code: " . $input['part_code'];
    }
    if (!empty($input['description'])) {
        $notes .= "\nDescription: " . $input['description'];
    }
    if (!empty($input['request_type'])) {
        $notes .= "\nRequest Type: " . $input['request_type'];
    }
    
    $result = $stmt->execute([
        $request_number,
        $input['inventory_item_id'], // ini akan menjadi item_id
        $input['quantity'],
        $input['urgency'],
        $input['justification'],
        $user_id,
        $notes
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Spare part request submitted successfully',
            'request_number' => $request_number
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit request']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage() // Tampilkan error untuk debugging
    ]);
    error_log("Submit spare part request error: " . $e->getMessage());
}
?>