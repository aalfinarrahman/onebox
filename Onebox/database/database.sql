-- Database untuk Onebox System
CREATE DATABASE IF NOT EXISTS onebox_system;
USE onebox_system;

-- Tabel Users untuk login system
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'user', 'maintenance', 'engineering') DEFAULT 'user',
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabel PBK (Permintaan Bantuan Kerusakan) untuk user-production
CREATE TABLE pbk_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    pbk_number VARCHAR(20) UNIQUE NOT NULL,
    line_name VARCHAR(50) NOT NULL,
    machine_name VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    request_date DATE NOT NULL,
    shift ENUM('1', '2', '3') NOT NULL,
    time_reported TIME NOT NULL,
    damage_type ENUM('Mechanical', 'Electrical', 'Pneumatic', 'Hydraulic', 'Software') NOT NULL,
    submission_type ENUM('Emergency', 'Normal', 'Preventive') NOT NULL,
    problem_description TEXT NOT NULL,
    what_problem TEXT,
    when_occurred DATETIME,
    where_location VARCHAR(100),
    who_reported VARCHAR(100),
    which_component VARCHAR(100),
    how_happened TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Tabel Maintenance Tasks
CREATE TABLE maintenance_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pbk_id INT,
    task_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_technician INT,
    status ENUM('Pending', 'In Progress', 'Completed', 'On Hold') DEFAULT 'Pending',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    start_date DATETIME,
    completion_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pbk_id) REFERENCES pbk_requests(id),
    FOREIGN KEY (assigned_technician) REFERENCES users(id)
);

-- Tabel Inventory untuk Engineering Store
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    unit_of_measure VARCHAR(20),
    current_stock INT DEFAULT 0,
    minimum_stock INT DEFAULT 0,
    maximum_stock INT DEFAULT 0,
    unit_price DECIMAL(10,2),
    location VARCHAR(50),
    supplier VARCHAR(100),
    status ENUM('Active', 'Inactive', 'Discontinued') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Spare Part Requests
CREATE TABLE spare_part_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_number VARCHAR(20) UNIQUE NOT NULL,
    pbk_id INT,
    maintenance_task_id INT,
    requested_by INT,
    item_id INT,
    quantity_requested INT NOT NULL,
    quantity_approved INT,
    quantity_issued INT,
    urgency ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    justification TEXT,
    status ENUM('Pending', 'Approved', 'Rejected', 'Issued', 'Completed') DEFAULT 'Pending',
    approved_by INT,
    approved_date DATETIME,
    issued_by INT,
    issued_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pbk_id) REFERENCES pbk_requests(id),
    FOREIGN KEY (maintenance_task_id) REFERENCES maintenance_tasks(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- Tabel Stock Movements untuk tracking inventory
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    movement_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    reference_type ENUM('Purchase', 'Issue', 'Return', 'Adjustment', 'Transfer'),
    reference_id INT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabel User Sessions untuk login tracking
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel untuk Activity Logs
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_table VARCHAR(50),
    reference_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabel untuk System Settings
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes untuk optimasi performa
CREATE INDEX idx_pbk_status ON pbk_requests(status);
CREATE INDEX idx_pbk_user ON pbk_requests(user_id);
CREATE INDEX idx_pbk_date ON pbk_requests(request_date);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_technician ON maintenance_tasks(assigned_technician);
CREATE INDEX idx_inventory_code ON inventory_items(item_code);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_spare_part_status ON spare_part_requests(status);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_date ON activity_logs(created_at);

-- Views untuk reporting
CREATE VIEW v_pbk_summary AS
SELECT 
    p.id,
    p.pbk_number,
    p.line_name,
    p.machine_name,
    p.status,
    p.priority,
    p.request_date,
    u.full_name as requester_name,
    a.full_name as assigned_name,
    p.created_at
FROM pbk_requests p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN users a ON p.assigned_to = a.id;

CREATE VIEW v_inventory_status AS
SELECT 
    i.id,
    i.item_code,
    i.item_name,
    i.category,
    i.current_stock,
    i.minimum_stock,
    i.maximum_stock,
    CASE 
        WHEN i.current_stock <= i.minimum_stock THEN 'Low Stock'
        WHEN i.current_stock >= i.maximum_stock THEN 'Overstock'
        ELSE 'Normal'
    END as stock_status,
    i.unit_price,
    i.location
FROM inventory_items i
WHERE i.status = 'Active';

CREATE VIEW v_maintenance_workload AS
SELECT 
    u.id as technician_id,
    u.full_name as technician_name,
    COUNT(m.id) as total_tasks,
    SUM(CASE WHEN m.status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
    SUM(CASE WHEN m.status = 'In Progress' THEN 1 ELSE 0 END) as active_tasks,
    SUM(CASE WHEN m.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
FROM users u
LEFT JOIN maintenance_tasks m ON u.id = m.assigned_technician
WHERE u.role = 'maintenance' AND u.is_active = 1
GROUP BY u.id, u.full_name;



ALTER TABLE pbk_requests ADD COLUMN accepted_by INT;
ALTER TABLE pbk_requests ADD COLUMN accepted_at TIMESTAMP NULL;
ALTER TABLE pbk_requests ADD COLUMN approved_by INT;
ALTER TABLE pbk_requests ADD COLUMN approved_at TIMESTAMP NULL;
ALTER TABLE pbk_requests ADD COLUMN rejected_by INT;
ALTER TABLE pbk_requests ADD COLUMN rejected_at TIMESTAMP NULL;
ALTER TABLE pbk_requests ADD COLUMN reject_reason TEXT;
ALTER TABLE pbk_requests ADD COLUMN reject_category VARCHAR(100);

ALTER TABLE pbk_requests ADD FOREIGN KEY (accepted_by) REFERENCES users(id);
ALTER TABLE pbk_requests ADD FOREIGN KEY (approved_by) REFERENCES users(id);
ALTER TABLE pbk_requests ADD FOREIGN KEY (rejected_by) REFERENCES users(id);



ALTER TABLE spare_part_requests 
ADD COLUMN part_name VARCHAR(100) AFTER item_id,
ADD COLUMN part_code VARCHAR(50) AFTER part_name,
ADD COLUMN description TEXT AFTER quantity_issued,
ADD COLUMN request_type VARCHAR(50) AFTER description,
ADD COLUMN requested_by_name VARCHAR(100) AFTER requested_by,
ADD COLUMN request_date DATETIME AFTER requested_by_name;


INSERT INTO users (username, password, email, role, full_name, is_active) VALUES 
('admin', MD5('admin123'), 'admin@onebox.com', 'admin', 'System Administrator', 1),
('user1', MD5('user123'), 'user1@onebox.com', 'user', 'Production User 1', 1),
('user2', MD5('user123'), 'user2@onebox.com', 'user', 'Production User 2', 1),
('user3', MD5('user123'), 'user3@onebox.com', 'user', 'Production User 3', 1),
('maintenance1', MD5('maint123'), 'maint1@onebox.com', 'maintenance', 'Maintenance Technician 1', 1),
('maintenance2', MD5('maint123'), 'maint2@onebox.com', 'maintenance', 'Maintenance Technician 2', 1),
('maintenance3', MD5('maint123'), 'maint3@onebox.com', 'maintenance', 'Maintenance Technician 3', 1),
('engineer1', MD5('eng123'), 'engineer1@onebox.com', 'engineering', 'Engineering Staff 1', 1),
('engineer2', MD5('eng123'), 'engineer2@onebox.com', 'engineering', 'Engineering Staff 2', 1),
('engineer3', MD5('eng123'), 'engineer3@onebox.com', 'engineering', 'Engineering Staff 3', 1);