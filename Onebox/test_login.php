<?php
session_start();
require_once 'config/database.php';

// Test koneksi database
echo "Database connection: " . ($pdo ? "OK" : "Failed") . "<br>";

// Test user data
try {
    $stmt = $pdo->query("SELECT username, role FROM users WHERE is_active = 1");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Available users:<br>";
    foreach ($users as $user) {
        echo "- {$user['username']} ({$user['role']})<br>";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}

// Test session
echo "<br>Session status: " . (session_status() === PHP_SESSION_ACTIVE ? "Active" : "Inactive");
?>