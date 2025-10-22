<?php
session_start();
require_once '../config/database.php';

// Determine if request expects JSON (AJAX/fetch) or normal navigation
$isAjax = (
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) || (
    isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
) || (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST');

// Update session record if available
if (isset($_SESSION['session_token'])) {
    try {
        $stmt = $pdo->prepare("UPDATE user_sessions SET logout_time = NOW(), is_active = 0 WHERE session_token = ?");
        $stmt->execute([$_SESSION['session_token']]);
    } catch (Exception $e) {
        // Silent fail, continue logout
    }
}

// Clear session data and cookie
$_SESSION = [];
if (session_id()) {
    session_unset();
    session_destroy();
}
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

if ($isAjax) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit;
}

// Non-AJAX access: redirect to login page
header('Location: ../login.html');
exit;
?>