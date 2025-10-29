-- Create zones table for organizational containers within facilities/rooms
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT DEFAULT 'general',
  color TEXT DEFAULT '#8b5cf6',
  grid_position_x INTEGER NOT NULL DEFAULT 0,
  grid_position_y INTEGER NOT NULL DEFAULT 0,
  grid_width INTEGER NOT NULL DEFAULT 10,
  grid_height INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage zones"
  ON zones FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view zones"
  ON zones FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX idx_zones_facility ON zones(facility_id);
CREATE INDEX idx_zones_room ON zones(room_id);