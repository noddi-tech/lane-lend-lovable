-- Drop existing RLS policies on facilities
DROP POLICY IF EXISTS "Admins can manage facilities" ON public.facilities;
DROP POLICY IF EXISTS "Anyone can view facilities" ON public.facilities;

-- Recreate policies with TO public for dev mode support
CREATE POLICY "Admins can manage facilities"
ON public.facilities
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view facilities"
ON public.facilities
FOR SELECT
TO public
USING (true);