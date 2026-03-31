-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS security_question VARCHAR,
ADD COLUMN IF NOT EXISTS hashed_security_answer VARCHAR;

-- Update existing users to have role 'user'
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create admin user if not exists
-- This is now handled by create_admin.py using environment variables