-- Fix sync_contribution_intervals to correctly initialize remaining_seconds
-- The bug was using factored capacity instead of actual available_seconds
CREATE OR REPLACE FUNCTION sync_contribution_intervals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_date DATE;
  max_date DATE;
  contribution_rec RECORD;
  interval_rec RECORD;
  overlap_start TIMESTAMPTZ;
  overlap_end TIMESTAMPTZ;
  overlap_seconds INT;
BEGIN
  -- Get date range from worker_contributions
  SELECT 
    MIN(DATE(starts_at AT TIME ZONE 'Europe/Oslo')),
    MAX(DATE(ends_at AT TIME ZONE 'Europe/Oslo'))
  INTO min_date, max_date
  FROM worker_contributions;
  
  -- Generate capacity intervals if we have contributions
  IF min_date IS NOT NULL AND max_date IS NOT NULL THEN
    PERFORM generate_capacity_intervals(min_date, max_date);
  END IF;
  
  -- Clear existing contribution_intervals
  DELETE FROM contribution_intervals WHERE true;
  
  -- For each worker contribution
  FOR contribution_rec IN 
    SELECT id, starts_at, ends_at, available_seconds
    FROM worker_contributions
  LOOP
    -- Find overlapping capacity intervals
    FOR interval_rec IN
      SELECT id, starts_at, ends_at
      FROM capacity_intervals
      WHERE starts_at < contribution_rec.ends_at
        AND ends_at > contribution_rec.starts_at
    LOOP
      -- Calculate overlap in seconds
      overlap_start := GREATEST(contribution_rec.starts_at, interval_rec.starts_at);
      overlap_end := LEAST(contribution_rec.ends_at, interval_rec.ends_at);
      overlap_seconds := EXTRACT(EPOCH FROM (overlap_end - overlap_start))::INT;
      
      -- Insert contribution interval with actual available seconds (no factors applied)
      -- The remaining_seconds equals the overlap portion of the worker's contribution
      INSERT INTO contribution_intervals (contribution_id, interval_id, remaining_seconds)
      VALUES (
        contribution_rec.id, 
        interval_rec.id, 
        LEAST(overlap_seconds, contribution_rec.available_seconds)
      );
    END LOOP;
  END LOOP;
END;
$$;