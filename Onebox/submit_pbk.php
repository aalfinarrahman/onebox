<?php
header('Content-Type: application/json');
require_once 'config/database.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }
    
    // Get form data
    $line = $_POST['line'] ?? '';
    $mesin = $_POST['mesin'] ?? '';
    $unit = $_POST['unit'] ?? '';
    $tanggal = $_POST['tanggal'] ?? '';
    $shift = $_POST['shift'] ?? '';
    $jam = $_POST['jam'] ?? '';
    $tipeKerusakan = $_POST['tipeKerusakan'] ?? '';
    $pengajuan = $_POST['pengajuan'] ?? '';
    $deskripsi = $_POST['deskripsi'] ?? '';
    
    // 5W1H fields
    $what = $_POST['what'] ?? '';
    $when = $_POST['when'] ?? '';
    $where = $_POST['where'] ?? '';
    $who = $_POST['who'] ?? '';
    $which = $_POST['which'] ?? '';
    $how = $_POST['how'] ?? '';

    // Normalize and fallback mapping for 5W1H
    $line = trim($line);
    $mesin = trim($mesin);
    $deskripsi = trim($deskripsi);
    $what = trim($what);
    $where = trim($where);
    $which = trim($which);

    if ($what === '') { $what = $deskripsi; }
    if ($where === '') { $where = $line; }
    if ($which === '') { $which = $mesin; }
    
    // Validate required fields
    $required_fields = ['line', 'mesin', 'unit', 'tanggal', 'shift', 'jam', 'tipeKerusakan', 'pengajuan', 'deskripsi', 'who', 'how'];
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Field {$field} is required");
        }
    }

    // Normalize and validate enum fields
    // Shift: only '1','2','3' allowed
    $shiftLower = strtolower(trim($shift));
    if ($shiftLower === 'pagi' || $shiftLower === 'shift 1') { $shift = '1'; }
    elseif ($shiftLower === 'siang' || $shiftLower === 'shift 2') { $shift = '2'; }
    elseif ($shiftLower === 'malam' || $shiftLower === 'shift 3') { $shift = '3'; }
    elseif (in_array($shiftLower, ['1','2','3'])) { $shift = $shiftLower; }
    else { throw new Exception('Shift harus 1, 2, atau 3'); }

    // Tipe Kerusakan mapping to ENUM
    $damageMap = [
        'mechanical' => 'Mechanical',
        'electrical' => 'Electrical',
        'pneumatic' => 'Pneumatic',
        'hydraulic' => 'Hydraulic',
        'software'   => 'Software',
        'mekanik'    => 'Mechanical',
        'elektrikal' => 'Electrical',
        'pneumatik'  => 'Pneumatic',
        'hidrolik'   => 'Hydraulic'
    ];
    $tipeKey = strtolower(trim($tipeKerusakan));
    if (isset($damageMap[$tipeKey])) {
        $tipeKerusakan = $damageMap[$tipeKey];
    } else {
        throw new Exception('Tipe Kerusakan tidak valid');
    }

    // Jenis Pengajuan mapping to ENUM
    $submissionMap = [
        'emergency' => 'Emergency',
        'darurat'   => 'Emergency',
        'normal'    => 'Normal',
        'preventive'=> 'Preventive',
        'preventif' => 'Preventive'
    ];
    $pengajuanKey = strtolower(trim($pengajuan));
    if (isset($submissionMap[$pengajuanKey])) {
        $pengajuan = $submissionMap[$pengajuanKey];
    } else {
        throw new Exception('Jenis Pengajuan tidak valid');
    }

    // Generate PBK number
    $pbk_number = 'PBK' . date('Ymd') . sprintf('%04d', rand(1, 9999));
    
    // Combine date and time for when_occurred
    $when_occurred = $tanggal . ' ' . $jam;
    
    // Insert into database dengan fallback bila kolom created_by belum ada
    $hasCreatedBy = false;
    $colStmt = $pdo->query("SHOW COLUMNS FROM pbk_requests LIKE 'created_by'");
    if ($colStmt && $colStmt->fetch()) {
        $hasCreatedBy = true;
    }

    if ($hasCreatedBy) {
        $stmt = $pdo->prepare("\n            INSERT INTO pbk_requests (
                pbk_number, user_id, created_by, line_name, machine_name, unit, 
                request_date, shift, time_reported, damage_type, submission_type, 
                problem_description, what_problem, when_occurred, 
                where_location, who_reported, which_component, how_happened,
                status, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW()
            )
        ");
        $result = $stmt->execute([
            $pbk_number,
            $_SESSION['user_id'],
            $_SESSION['user_id'],
            $line,
            $mesin,
            $unit,
            $tanggal,
            $shift,
            $jam,
            $tipeKerusakan,
            $pengajuan,
            $deskripsi,
            $what,
            $when_occurred,
            $where,
            $who,
            $which,
            $how
        ]);
    } else {
        $stmt = $pdo->prepare("\n            INSERT INTO pbk_requests (
                pbk_number, user_id, line_name, machine_name, unit, 
                request_date, shift, time_reported, damage_type, submission_type, 
                problem_description, what_problem, when_occurred, 
                where_location, who_reported, which_component, how_happened,
                status, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW()
            )
        ");
        $result = $stmt->execute([
            $pbk_number,
            $_SESSION['user_id'],
            $line,
            $mesin,
            $unit,
            $tanggal,
            $shift,
            $jam,
            $tipeKerusakan,
            $pengajuan,
            $deskripsi,
            $what,
            $when_occurred,
            $where,
            $who,
            $which,
            $how
        ]);
    }
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'PBK submitted successfully',
            'pbk_number' => $pbk_number
        ]);
        exit;
    } else {
        throw new Exception('Failed to submit PBK');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit;
}
?>