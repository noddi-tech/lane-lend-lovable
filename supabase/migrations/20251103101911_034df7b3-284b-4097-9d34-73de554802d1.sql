-- Add missing grid_position_x column and ensure all necessary columns exist in lanes_new table
-- This fixes the lane placement and horizontal movement issues

-- Add grid_position_x if it doesn't exist (critical missing column)
ALTER TABLE lanes_new 
ADD COLUMN IF NOT EXISTS grid_position_x integer NOT NULL DEFAULT 0;

-- Add grid_width if it doesn't exist
ALTER TABLE lanes_new 
ADD COLUMN IF NOT EXISTS grid_width integer NOT NULL DEFAULT 173;

-- Ensure facility_id exists (for facility-based lanes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lanes_new' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE lanes_new 
    ADD COLUMN facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure room_id exists (for room-based lanes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lanes_new' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE lanes_new 
    ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure zone_id exists (for zone-based lanes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lanes_new' AND column_name = 'zone_id'
  ) THEN
    ALTER TABLE lanes_new 
    ADD COLUMN zone_id uuid REFERENCES zones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure lane_type exists
ALTER TABLE lanes_new 
ADD COLUMN IF NOT EXISTS lane_type text DEFAULT 'service';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lanes_new_facility_id ON lanes_new(facility_id);
CREATE INDEX IF NOT EXISTS idx_lanes_new_room_id ON lanes_new(room_id);
CREATE INDEX IF NOT EXISTS idx_lanes_new_zone_id ON lanes_new(zone_id);

-- Add helpful comments
COMMENT ON COLUMN lanes_new.grid_position_x IS 'X position in grid cells';
COMMENT ON COLUMN lanes_new.grid_position_y IS 'Y position in grid cells';
COMMENT ON COLUMN lanes_new.grid_width IS 'Width in grid cells';
COMMENT ON COLUMN lanes_new.grid_height IS 'Height in grid cells';

-- Update existing lanes that are in rooms to have proper X positions
UPDATE lanes_new l
SET grid_position_x = r.grid_position_x + 5
FROM rooms r
WHERE l.room_id = r.id
  AND l.grid_position_x = 0
  AND r.grid_position_x IS NOT NULL;