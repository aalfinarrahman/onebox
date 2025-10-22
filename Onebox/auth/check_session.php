<?php
session_start(); // Tambahkan ini di baris pertama
require_once '../config/database.php';

header('Content-Type: application/json');

function checkSession() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    // Basic session check - user_id exists
    return true;
    
    // Optional: Advanced session check with database
    /*
    if (!isset($_SESSION['session_token'])) {
        return false;
    }
    
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT id FROM user_sessions WHERE session_token = ? AND is_active = 1");
        $stmt->execute([$_SESSION['session_token']]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        return false;
    }
    */
}

// Check session and return JSON response
if (checkSession()) {
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'] ?? '',
            'role' => $_SESSION['role'] ?? '',
            'full_name' => $_SESSION['full_name'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Session not found or expired'
    ]);
}

function requireLogin() {
    if (!checkSession()) {
        header('Location: login.html');
        exit;
    }
}
?>