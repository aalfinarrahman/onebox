<?php
session_start(); // Tambahkan ini di baris pertama
require_once '../config/database.php';

header('Content-Type: application/json');

// Enable error logging
error_log("Login attempt started");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    error_log("Login attempt for username: " . $username);
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password are required']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id, username, password, role, full_name, is_active FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("User found: " . ($user ? 'Yes' : 'No'));
        
        if ($user) {
            $input_hash = md5($password);
            $stored_hash = $user['password'];
            error_log("Password check - Input: $input_hash, Stored: $stored_hash");
            
            if ($input_hash === $stored_hash) {
                // Create session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role'] = $user['role'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['login_time'] = time();
                
                error_log("Login successful for user: " . $username);
                
                // Log session to database (optional)
                try {
                    $session_token = bin2hex(random_bytes(32));
                    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
                    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
                    
                    $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$user['id'], $session_token, $ip_address, $user_agent]);
                    
                    $_SESSION['session_token'] = $session_token;
                } catch (Exception $e) {
                    error_log("Session logging failed: " . $e->getMessage());
                    // Continue anyway
                }
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login successful',
                    'user' => [
                        'username' => $user['username'],
                        'role' => $user['role'],
                        'full_name' => $user['full_name']
                    ]
                ]);
            } else {
                error_log("Password mismatch for user: " . $username);
                echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
            }
        } else {
            error_log("User not found: " . $username);
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Database error occurred']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>