-- Drop foreign key constraint from addresses to allow seed data creation
-- This mirrors the approach taken with profiles.id and user_roles.user_id
-- RLS policies maintain data integrity and security

ALTER TABLE public.addresses
DROP CONSTRAINT IF EXISTS addresses_user_id_fkey;