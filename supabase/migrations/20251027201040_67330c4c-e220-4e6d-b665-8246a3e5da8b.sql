-- Phase 1.1: Update worker_contributions to use station_id (fixed version)
-- Add station_id column as nullable first
ALTER TABLE worker_contributions
ADD COLUMN station_id uuid REFERENCES stations(id);

-- For existing data, migrate by finding first active station in each lane
UPDATE worker_contributions wc
SET station_id = (
  SELECT id 
  FROM stations 
  WHERE lane_id = wc.lane_id 
    AND active = true 
  ORDER BY created_at 
  LIMIT 1
);

-- If any rows still have NULL station_id (no active stations found), delete them
DELETE FROM worker_contributions WHERE station_id IS NULL;

-- Now make station_id NOT NULL
ALTER TABLE worker_contributions
ALTER COLUMN station_id SET NOT NULL;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_worker_contributions_station_id 
ON worker_contributions(station_id);

-- Add comment
COMMENT ON COLUMN worker_contributions.station_id IS 'Worker contribution is now tied to specific station instead of lane';