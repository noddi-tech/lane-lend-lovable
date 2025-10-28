-- Phase 1: Library-First Architecture with Rooms

-- 1.1: Make foreign keys nullable to support library elements
ALTER TABLE driving_gates 
ALTER COLUMN facility_id DROP NOT NULL;

ALTER TABLE lanes_new 
ALTER COLUMN facility_id DROP NOT NULL;

ALTER TABLE stations 
ALTER COLUMN lane_id DROP NOT NULL;

-- Add indexes for efficient library queries
CREATE INDEX idx_gates_library ON driving_gates (facility_id) WHERE facility_id IS NULL;
CREATE INDEX idx_lanes_library ON lanes_new (facility_id) WHERE facility_id IS NULL;
CREATE INDEX idx_stations_library ON stations (lane_id) WHERE lane_id IS NULL;

-- 1.2: Create rooms table (sub-facilities)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  grid_position_x INTEGER NOT NULL DEFAULT 0,
  grid_position_y INTEGER NOT NULL DEFAULT 0,
  grid_width INTEGER NOT NULL DEFAULT 20,
  grid_height INTEGER NOT NULL DEFAULT 20,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms
CREATE POLICY "Admins can manage rooms"
  ON rooms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

-- Add trigger for updated_at on rooms
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 1.3: Add room associations to existing elements
ALTER TABLE driving_gates
ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

ALTER TABLE lanes_new
ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

ALTER TABLE stations
ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Add indexes for room associations
CREATE INDEX idx_gates_room ON driving_gates (room_id);
CREATE INDEX idx_lanes_room ON lanes_new (room_id);
CREATE INDEX idx_stations_room ON stations (room_id);