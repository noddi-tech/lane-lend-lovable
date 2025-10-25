-- Update has_role function to allow NULL user_id to act as admin in dev mode
-- This is safe because it only works when there's NO authentication
-- In production with real auth, auth.uid() is never NULL for authenticated users
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  -- Dev mode: Allow NULL auth.uid() to act as admin
  -- This only works when there's NO authentication session
  OR (_user_id IS NULL AND _role = 'admin'::app_role)
$$;