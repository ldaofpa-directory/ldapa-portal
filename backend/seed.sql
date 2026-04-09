-- Default admin user (password: admin123 - change in production!)
-- bcrypt hash of 'admin123'
INSERT OR IGNORE INTO admin_users (id, email, password_hash, name) VALUES
('admin1', 'admin@ldapa.org', '$2b$12$UztW.0/LOix.pUQCWUsX6uEhrePdvnDf2WgXr9CZebWSvrr8x8JNS', 'LDAPA Admin');
