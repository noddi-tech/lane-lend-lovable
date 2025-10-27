-- Create driving_gates table
CREATE TABLE IF NOT EXISTS driving_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  grid_width integer NOT NULL DEFAULT 20,
  grid_height integer NOT NULL DEFAULT 10,
  open_time time NOT NULL DEFAULT '08:00:00',
  close_time time NOT NULL DEFAULT '17:00:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lanes_new table (renamed to avoid conflict)
CREATE TABLE IF NOT EXISTS lanes_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driving_gate_id uuid NOT NULL REFERENCES driving_gates(id) ON DELETE CASCADE,
  name text NOT NULL,
  position_order integer NOT NULL DEFAULT 0,
  grid_position_y integer NOT NULL DEFAULT 0,
  grid_height integer NOT NULL DEFAULT 2,
  open_time time,
  close_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id uuid NOT NULL REFERENCES lanes_new(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  station_type text NOT NULL DEFAULT 'general',
  grid_position_x integer NOT NULL DEFAULT 0,
  grid_position_y integer NOT NULL DEFAULT 0,
  grid_width integer NOT NULL DEFAULT 2,
  grid_height integer NOT NULL DEFAULT 2,
  open_time time,
  close_time time,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create station_capabilities junction table
CREATE TABLE IF NOT EXISTS station_capabilities (
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  capability_id uuid NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (station_id, capability_id)
);

-- Enable RLS
ALTER TABLE driving_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lanes_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_capabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driving_gates
CREATE POLICY "Anyone can view driving gates" ON driving_gates FOR SELECT USING (true);
CREATE POLICY "Admins can manage driving gates" ON driving_gates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lanes_new
CREATE POLICY "Anyone can view lanes" ON lanes_new FOR SELECT USING (true);
CREATE POLICY "Admins can manage lanes" ON lanes_new FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for stations
CREATE POLICY "Anyone can view active stations" ON stations FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage stations" ON stations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for station_capabilities
CREATE POLICY "Anyone can view station capabilities" ON station_capabilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage station capabilities" ON station_capabilities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create booking_stations table for sequential station visits
CREATE TABLE IF NOT EXISTS booking_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  estimated_start_time timestamptz,
  estimated_end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, sequence_order)
);

-- Enable RLS
ALTER TABLE booking_stations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own booking stations"
  ON booking_stations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_stations.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage booking stations"
  ON booking_stations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_stations_booking_id ON booking_stations(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_stations_station_id ON booking_stations(station_id);
CREATE INDEX IF NOT EXISTS idx_lanes_new_driving_gate ON lanes_new(driving_gate_id);
CREATE INDEX IF NOT EXISTS idx_stations_lane ON stations(lane_id);