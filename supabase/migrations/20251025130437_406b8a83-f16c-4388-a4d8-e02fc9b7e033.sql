-- Fix RLS policy on service_workers to include WITH CHECK expression
DROP POLICY IF EXISTS "Admins can manage workers" ON public.service_workers;

CREATE POLICY "Admins can manage workers"
ON public.service_workers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update has_role function to include dev mode users
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
  -- Allow dev mode users
  OR (_user_id = '00000000-0000-0000-0000-000000000001'::uuid AND _role = 'admin'::app_role)
  OR (_user_id = '00000000-0000-0000-0000-000000000002'::uuid AND _role = 'customer'::app_role)
$$;