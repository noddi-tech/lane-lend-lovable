-- Add lane_type to lanes_new for service vs storage lanes
ALTER TABLE lanes_new ADD COLUMN lane_type TEXT DEFAULT 'service' CHECK (lane_type IN ('service', 'storage', 'staging'));

-- Create outside_areas table for marking exterior regions
CREATE TABLE outside_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area_type TEXT NOT NULL DEFAULT 'other' CHECK (area_type IN ('parking', 'grass', 'container_storage', 'loading_zone', 'other')),
  grid_position_x INTEGER NOT NULL DEFAULT 0,
  grid_position_y INTEGER NOT NULL DEFAULT 0,
  grid_width INTEGER NOT NULL DEFAULT 10,
  grid_height INTEGER NOT NULL DEFAULT 10,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for outside_areas
ALTER TABLE outside_areas ENABLE ROW LEVEL SECURITY;

-- RLS policies for outside_areas
CREATE POLICY "Admins can manage outside areas"
  ON outside_areas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view outside areas"
  ON outside_areas FOR SELECT
  USING (true);

-- Create storage_locations table for micro storage elements
CREATE TABLE storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id UUID REFERENCES lanes_new(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  storage_type TEXT DEFAULT 'general' CHECK (storage_type IN ('general', 'parts', 'tools', 'hazmat', 'other')),
  grid_position_x INTEGER NOT NULL DEFAULT 0,
  grid_position_y INTEGER NOT NULL DEFAULT 0,
  grid_width INTEGER NOT NULL DEFAULT 1,
  grid_height INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for storage_locations
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for storage_locations
CREATE POLICY "Admins can manage storage locations"
  ON storage_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view storage locations"
  ON storage_locations FOR SELECT
  USING (true);

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_outside_areas_updated_at
  BEFORE UPDATE ON outside_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_storage_locations_updated_at
  BEFORE UPDATE ON storage_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for performance
CREATE INDEX idx_outside_areas_facility_id ON outside_areas(facility_id);
CREATE INDEX idx_storage_locations_lane_id ON storage_locations(lane_id);
CREATE INDEX idx_storage_locations_room_id ON storage_locations(room_id);