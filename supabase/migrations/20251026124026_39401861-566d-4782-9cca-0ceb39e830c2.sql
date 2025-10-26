-- Drop the incorrect foreign key that points to auth.users
ALTER TABLE bookings
  DROP CONSTRAINT bookings_user_id_fkey;

-- Add the correct foreign key pointing to profiles table
ALTER TABLE bookings
  ADD CONSTRAINT bookings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;