-- Drop existing primary key if it exists
ALTER TABLE contribution_intervals DROP CONSTRAINT IF EXISTS contribution_intervals_pkey;

-- Add primary key to contribution_intervals
ALTER TABLE contribution_intervals 
ADD CONSTRAINT contribution_intervals_pkey PRIMARY KEY (contribution_id, interval_id);

-- Function to generate capacity intervals for a date range
CREATE OR REPLACE FUNCTION generate_capacity_intervals(start_date DATE, end_date DATE)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  iter_date DATE;
  iter_hour INT;
  interval_start TIMESTAMPTZ;
  interval_end TIMESTAMPTZ;
BEGIN
  iter_date := start_date;
  
  WHILE iter_date <= end_date LOOP
    FOR iter_hour IN 0..23 LOOP
      interval_start := (iter_date || ' ' || LPAD(iter_hour::TEXT, 2, '0') || ':00:00')::TIMESTAMPTZ AT TIME ZONE 'Europe/Oslo';
      interval_end := interval_start + INTERVAL '1 hour';
      
      INSERT INTO capacity_intervals (date, starts_at, ends_at)
      VALUES (iter_date, interval_start, interval_end)
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    iter_date := iter_date + 1;
  END LOOP;
END;
$$;

-- Function to sync contribution intervals
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
  
  -- Clear existing contribution_intervals
  DELETE FROM contribution_intervals;
  
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

-- Trigger function to auto-sync on contribution changes
CREATE OR REPLACE FUNCTION trigger_sync_contribution_intervals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete intervals for the affected worker
  DELETE FROM contribution_intervals
  WHERE contribution_id IN (
    SELECT id FROM worker_contributions 
    WHERE worker_id = COALESCE(NEW.worker_id, OLD.worker_id)
  );
  
  -- Regenerate all intervals
  PERFORM sync_contribution_intervals();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on worker_contributions
DROP TRIGGER IF EXISTS sync_intervals_on_contribution_change ON worker_contributions;
CREATE TRIGGER sync_intervals_on_contribution_change
AFTER INSERT OR UPDATE OR DELETE ON worker_contributions
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_contribution_intervals();