<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
session_start();

try {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    // Ambil role pengguna dari session
    $role = strtolower($_SESSION['role'] ?? '');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $pbk_id = $input['pbk_id'] ?? null;

    if (!$pbk_id || !is_numeric($pbk_id)) {
        echo json_encode(['success' => false, 'message' => 'PBK ID tidak valid']);
        exit;
    }

    // Ambil PBK dan cek kepemilikan + status
    $stmt = $pdo->prepare("SELECT id, user_id, status, pbk_number FROM pbk_requests WHERE id = ?");
    $stmt->execute([$pbk_id]);
    $pbk = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$pbk) {
        echo json_encode(['success' => false, 'message' => 'PBK tidak ditemukan']);
        exit;
    }

    // Non-admin harus pemiliknya
    if ($role !== 'admin' && (int)$pbk['user_id'] !== (int)$_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'Anda tidak memiliki izin menghapus PBK ini']);
        exit;
    }

    // Non-admin hanya boleh hapus status Pending
    if ($role !== 'admin' && strcasecmp($pbk['status'], 'Pending') !== 0) {
        echo json_encode(['success' => false, 'message' => 'Hanya PBK berstatus Pending yang bisa dihapus']);
        exit;
    }

    // Hapus PBK
    $del = $pdo->prepare("DELETE FROM pbk_requests WHERE id = ?");
    $ok = $del->execute([$pbk_id]);

    if (!$ok) {
        throw new Exception('Gagal menghapus PBK');
    }

    // Catat log aktivitas (opsional)
    try {
        $log = $pdo->prepare("INSERT INTO activity_logs (user_id, activity_type, description, reference_table, reference_id, created_at) VALUES (?, 'PBK_DELETE', ?, 'pbk_requests', ?, NOW())");
        $log->execute([
            $_SESSION['user_id'],
            'PBK deleted: ' . $pbk['pbk_number'],
            $pbk_id
        ]);
    } catch (Exception $ignored) {
        // Abaikan jika tabel log tidak tersedia
    }

    echo json_encode(['success' => true, 'message' => 'PBK berhasil dihapus']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}