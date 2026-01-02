-- ============================================
-- Users Table for Role-Based Access Control
-- ============================================

-- Create users table to store user roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read own role" ON user_roles;

-- Simple policy: Authenticated users can read their own role
CREATE POLICY "Allow authenticated users to read own role" ON user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Grant permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT UPDATE ON user_roles TO authenticated;

-- ============================================
-- Function to auto-create user_roles entry on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (id, email, role)
    VALUES (NEW.id, NEW.email, 'viewer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Create initial admin user (run after first signup)
-- Replace 'your-admin-email@example.com' with actual admin email
-- ============================================
-- UPDATE user_roles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

