-- Add missing admin UPDATE policy for profiles to support upsert operations

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));