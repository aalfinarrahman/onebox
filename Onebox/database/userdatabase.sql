-- Insert default users untuk sistem (tambahkan setelah baris 230)

-- Insert default users
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

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', 'Onebox System', 'Nama sistem aplikasi'),
('company_name', 'PT. Manufacturing Indonesia', 'Nama perusahaan'),
('pbk_number_prefix', 'PBK', 'Prefix untuk nomor PBK'),
('task_number_prefix', 'TSK', 'Prefix untuk nomor task maintenance'),
('spare_part_prefix', 'SPR', 'Prefix untuk nomor permintaan spare part'),
('auto_assign_maintenance', '1', 'Auto assign maintenance task ke technician'),
('email_notifications', '1', 'Aktifkan notifikasi email'),
('session_timeout', '3600', 'Session timeout dalam detik (1 jam)'),
('max_login_attempts', '5', 'Maksimal percobaan login'),
('backup_retention_days', '30', 'Lama penyimpanan backup dalam hari'),
('maintenance_auto_numbering', '1', 'Auto generate nomor untuk maintenance task'),
('pbk_auto_numbering', '1', 'Auto generate nomor untuk PBK'),
('spare_part_auto_numbering', '1', 'Auto generate nomor untuk spare part request');