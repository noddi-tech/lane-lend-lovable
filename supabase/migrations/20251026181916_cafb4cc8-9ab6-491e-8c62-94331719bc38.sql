-- Drop foreign key constraints that prevent dev/seed data creation
-- These constraints require all profile/role records to have corresponding auth.users
-- We need to allow test data creation without real auth users

-- Drop the foreign key from profiles to auth.users
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop the foreign key from user_roles to auth.users  
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;