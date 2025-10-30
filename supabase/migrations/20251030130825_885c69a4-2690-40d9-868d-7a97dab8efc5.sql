-- Fix zones RLS policy to allow INSERT operations
DROP POLICY IF EXISTS "Admins can manage zones" ON public.zones;

-- Create properly configured policy with both USING and WITH CHECK
CREATE POLICY "Admins can manage zones"
ON public.zones
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));