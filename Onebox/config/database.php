<?php
// Database configuration
$host = 'localhost';
$dbname = 'onebox_system';
$username = 'root';
$password = '';

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Set PDO attributes
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    
} catch(PDOException $e) {
    // Log error and respond with JSON to avoid breaking fetch callers
    error_log("Database connection failed: " . $e->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Function to get database connection
function getDBConnection() {
    global $pdo;
    return $pdo;
}

// Function to close database connection
function closeDBConnection() {
    global $pdo;
    $pdo = null;
}
?>