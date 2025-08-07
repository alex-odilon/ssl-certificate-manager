-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS security_question VARCHAR,
ADD COLUMN IF NOT EXISTS hashed_security_answer VARCHAR;

-- Update existing users to have role 'user'
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create admin user if not exists
-- Password: admin123
-- You should change this after first login!
INSERT INTO users (email, username, hashed_password, role, is_active, security_question, hashed_security_answer, created_at)
VALUES (
    'admin@sslmanager.local',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJRjyVqC', -- admin123
    'admin',
    TRUE,
    'What is the default admin password?',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJRjyVqC', -- admin123
    NOW()
)
ON CONFLICT (username) DO NOTHING;