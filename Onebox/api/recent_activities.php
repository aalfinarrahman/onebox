<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
session_start();

try {
    $limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 10;
    $userOnly = isset($_GET['user_only']) && ($_GET['user_only'] === 'true' || $_GET['user_only'] === '1');

    $sql = "
        SELECT al.id, al.user_id, al.activity_type, al.description, al.reference_table, al.reference_id,
               al.created_at, u.username, u.full_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
    ";

    $params = [];
    if ($userOnly && isset($_SESSION['user_id'])) {
        $sql .= " WHERE al.user_id = ? ";
        $params[] = $_SESSION['user_id'];
    }

    $sql .= " ORDER BY al.created_at DESC LIMIT ?";
    $params[] = $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map to UI-friendly structure
    $activities = array_map(function ($row) {
        $type = strtoupper($row['activity_type'] ?? '');
        $icon = 'fas fa-clock text-secondary';
        if (str_contains($type, 'PBK')) {
            $icon = 'fas fa-exclamation-triangle text-danger';
        } elseif (str_contains($type, 'SPARE_PART')) {
            if (str_contains($type, 'ISSUED')) {
                $icon = 'fas fa-box-open text-success';
            } elseif (str_contains($type, 'APPROVAL') || str_contains($type, 'APPROVED')) {
                $icon = 'fas fa-check-circle text-success';
            } else {
                $icon = 'fas fa-clipboard-list text-info';
            }
        } elseif (str_contains($type, 'INVENTORY')) {
            $icon = 'fas fa-boxes text-warning';
        } elseif (str_contains($type, 'LOGIN')) {
            $icon = 'fas fa-sign-in-alt text-primary';
        } elseif (str_contains($type, 'LOGOUT')) {
            $icon = 'fas fa-sign-out-alt text-primary';
        }

        return [
            'id' => (int)$row['id'],
            'icon' => $icon,
            'text' => $row['description'] ?? '',
            'user' => $row['full_name'] ?: ($row['username'] ?? 'Unknown'),
            'created_at' => $row['created_at']
        ];
    }, $rows);

    echo json_encode(['success' => true, 'data' => $activities]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred']);
    error_log('Recent activities error: ' . $e->getMessage());
}