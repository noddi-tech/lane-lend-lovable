-- Fix RLS policies to support dev mode and add admin access to addresses

-- Step 1: Update profiles SELECT policy to use TO public
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Step 2: Add comprehensive admin policies for addresses
CREATE POLICY "Admins can view all addresses"
ON public.addresses
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert addresses"
ON public.addresses
FOR INSERT
TO public
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update addresses"
ON public.addresses
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete addresses"
ON public.addresses
FOR DELETE
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));