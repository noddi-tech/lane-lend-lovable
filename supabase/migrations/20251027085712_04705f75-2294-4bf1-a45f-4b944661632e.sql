-- Add function to enable/disable triggers during bulk operations
CREATE OR REPLACE FUNCTION public.set_trigger_enabled(
  trigger_name text,
  table_name text,
  enabled boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF enabled THEN
    EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I', table_name, trigger_name);
  ELSE
    EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I', table_name, trigger_name);
  END IF;
END;
$$;