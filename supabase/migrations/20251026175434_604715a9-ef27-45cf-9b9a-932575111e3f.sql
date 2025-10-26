-- Add INSERT policies for profiles table to allow customer seeding and user signup

-- Allow admins to insert any profile (needed for seeding test customers)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);