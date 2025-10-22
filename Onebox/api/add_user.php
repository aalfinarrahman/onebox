<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$full_name = trim($_POST['full_name'] ?? '');
$email     = trim($_POST['email'] ?? '');
$role      = trim($_POST['role'] ?? '');
$password  = trim($_POST['password'] ?? '');
$is_active = isset($_POST['is_active']) ? (intval($_POST['is_active']) ? 1 : 0) : 1;

// Basic validation
if ($username === '' || $full_name === '' || $role === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Required fields: username, full_name, role, password']);
    exit;
}

// Validate role
$allowed_roles = ['admin', 'user', 'maintenance', 'engineering'];
if (!in_array($role, $allowed_roles, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid role provided']);
    exit;
}

try {
    // Check duplicate username
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Username already exists']);
        exit;
    }

    // Optional: check duplicate email if provided
    if ($email !== '') {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            exit;
        }
    }

    // Hash password with MD5 to match existing schema (login uses MD5)
    $password_hash = md5($password);

    // Insert user
    $stmt = $pdo->prepare('INSERT INTO users (username, password, email, role, full_name, is_active) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$username, $password_hash, $email, $role, $full_name, $is_active]);
    
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'data' => [
            'id' => $pdo->lastInsertId(),
            'username' => $username,
            'email' => $email,
            'role' => $role,
            'full_name' => $full_name,
            'is_active' => (bool)$is_active
        ]
    ]);
} catch (PDOException $e) {
    error_log('Add user DB error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
}