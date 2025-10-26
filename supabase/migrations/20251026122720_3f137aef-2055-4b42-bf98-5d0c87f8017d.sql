-- Fix the sync_contribution_intervals function to use WHERE clause in DELETE
CREATE OR REPLACE FUNCTION sync_contribution_intervals()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  min_date DATE;
  max_date DATE;
  contribution_rec RECORD;
  interval_rec RECORD;
  overlap_start TIMESTAMPTZ;
  overlap_end TIMESTAMPTZ;
  overlap_seconds INT;
  available_capacity INT;
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
  
  -- Clear existing contribution_intervals (with WHERE clause for RLS)
  DELETE FROM contribution_intervals WHERE true;
  
  -- For each worker contribution
  FOR contribution_rec IN 
    SELECT id, starts_at, ends_at, available_seconds, performance_factor, travel_factor
    FROM worker_contributions
  LOOP
    -- Find overlapping capacity intervals
    FOR interval_rec IN
      SELECT id, starts_at, ends_at
      FROM capacity_intervals
      WHERE starts_at < contribution_rec.ends_at
        AND ends_at > contribution_rec.starts_at
    LOOP
      -- Calculate overlap
      overlap_start := GREATEST(contribution_rec.starts_at, interval_rec.starts_at);
      overlap_end := LEAST(contribution_rec.ends_at, interval_rec.ends_at);
      overlap_seconds := EXTRACT(EPOCH FROM (overlap_end - overlap_start))::INT;
      
      -- Calculate available capacity with factors
      available_capacity := FLOOR(
        overlap_seconds * 
        COALESCE(contribution_rec.performance_factor, 1.0) * 
        COALESCE(contribution_rec.travel_factor, 1.0)
      )::INT;
      
      -- Insert contribution interval
      INSERT INTO contribution_intervals (contribution_id, interval_id, remaining_seconds)
      VALUES (contribution_rec.id, interval_rec.id, available_capacity);
    END LOOP;
  END LOOP;
END;
$$;