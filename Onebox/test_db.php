<?php
require_once 'config/database.php';

try {
    // Test query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    
    echo "<h2>Database Connection Test</h2>";
    echo "<p style='color: green;'>✅ Database connection successful!</p>";
    echo "<p>Users table has {$result['count']} records</p>";
    
    // Test all tables
    $tables = ['users', 'pbk_requests', 'maintenance_tasks', 'inventory_items', 'spare_part_requests'];
    echo "<h3>Table Status:</h3>";
    echo "<ul>";
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $result = $stmt->fetch();
            echo "<li style='color: green;'>✅ Table '$table': {$result['count']} records</li>";
        } catch (Exception $e) {
            echo "<li style='color: red;'>❌ Table '$table': Error - {$e->getMessage()}</li>";
        }
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h2>Database Connection Test</h2>";
    echo "<p style='color: red;'>❌ Database connection failed!</p>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    
    echo "<h3>Troubleshooting Steps:</h3>";
    echo "<ol>";
    echo "<li>Make sure XAMPP MySQL is running</li>";
    echo "<li>Check if database 'onebox_system' exists</li>";
    echo "<li>Import database/database.sql file</li>";
    echo "<li>Verify database credentials in config/database.php</li>";
    echo "</ol>";
}
?>