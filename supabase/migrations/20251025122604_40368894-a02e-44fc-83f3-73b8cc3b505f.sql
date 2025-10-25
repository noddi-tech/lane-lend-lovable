-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'customer');

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service departments
CREATE TABLE service_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  time_zone TEXT DEFAULT 'Europe/Oslo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lanes (capacity areas)
CREATE TABLE lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_department_id UUID REFERENCES service_departments(id),
  open_time TIME NOT NULL DEFAULT '08:00',
  close_time TIME NOT NULL DEFAULT '17:00',
  time_zone TEXT DEFAULT 'Europe/Oslo',
  closed_for_new_bookings_at TIMESTAMPTZ,
  closed_for_cancellations_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capabilities
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capability-Skill mapping
CREATE TABLE capability_skills (
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (capability_id, skill_id)
);

-- Lane capabilities
CREATE TABLE lane_capabilities (
  lane_id UUID REFERENCES lanes(id) ON DELETE CASCADE,
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (lane_id, capability_id)
);

-- Service workers
CREATE TABLE service_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker skills
CREATE TABLE worker_skills (
  worker_id UUID REFERENCES service_workers(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (worker_id, skill_id)
);

-- Worker capabilities (computed)
CREATE TABLE worker_capabilities (
  worker_id UUID REFERENCES service_workers(id) ON DELETE CASCADE,
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (worker_id, capability_id)
);

-- Worker lane assignments
CREATE TABLE worker_lanes (
  worker_id UUID REFERENCES service_workers(id) ON DELETE CASCADE,
  lane_id UUID REFERENCES lanes(id) ON DELETE CASCADE,
  PRIMARY KEY (worker_id, lane_id)
);

-- Sales items (services)
CREATE TABLE sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  service_time_seconds INTEGER NOT NULL DEFAULT 3600,
  price_cents INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales item capabilities
CREATE TABLE sales_item_capabilities (
  sales_item_id UUID REFERENCES sales_items(id) ON DELETE CASCADE,
  capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  PRIMARY KEY (sales_item_id, capability_id)
);

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'NO',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capacity intervals (15-minute slots)
CREATE TABLE capacity_intervals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  date DATE NOT NULL,
  UNIQUE(starts_at, ends_at)
);

CREATE INDEX idx_intervals_date ON capacity_intervals(date);
CREATE INDEX idx_intervals_time_range ON capacity_intervals(starts_at, ends_at);

-- Worker contributions (shifts)
CREATE TABLE worker_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES service_workers(id) ON DELETE CASCADE NOT NULL,
  lane_id UUID REFERENCES lanes(id) ON DELETE CASCADE NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  available_seconds INTEGER NOT NULL,
  travel_factor DECIMAL(3,2) DEFAULT 1.0,
  performance_factor DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributions_worker ON worker_contributions(worker_id);
CREATE INDEX idx_contributions_lane ON worker_contributions(lane_id);
CREATE INDEX idx_contributions_time ON worker_contributions(starts_at, ends_at);

-- Contribution intervals (remaining capacity per interval)
CREATE TABLE contribution_intervals (
  contribution_id UUID REFERENCES worker_contributions(id) ON DELETE CASCADE,
  interval_id UUID REFERENCES capacity_intervals(id) ON DELETE CASCADE,
  remaining_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (contribution_id, interval_id)
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lane_id UUID REFERENCES lanes(id) NOT NULL,
  address_id UUID REFERENCES addresses(id),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  delivery_window_starts_at TIMESTAMPTZ NOT NULL,
  delivery_window_ends_at TIMESTAMPTZ NOT NULL,
  service_time_seconds INTEGER NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_registration TEXT,
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_lane ON bookings(lane_id);
CREATE INDEX idx_bookings_window ON bookings(delivery_window_starts_at, delivery_window_ends_at);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Booking sales items
CREATE TABLE booking_sales_items (
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sales_item_id UUID REFERENCES sales_items(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, sales_item_id)
);

-- Booking intervals (capacity consumed)
CREATE TABLE booking_intervals (
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  interval_id UUID REFERENCES capacity_intervals(id) ON DELETE CASCADE,
  booked_seconds INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (booking_id, interval_id)
);

-- Lane interval capacity (aggregated)
CREATE TABLE lane_interval_capacity (
  lane_id UUID REFERENCES lanes(id) ON DELETE CASCADE,
  interval_id UUID REFERENCES capacity_intervals(id) ON DELETE CASCADE,
  total_booked_seconds INTEGER DEFAULT 0,
  PRIMARY KEY (lane_id, interval_id)
);

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update worker capabilities from skills
CREATE OR REPLACE FUNCTION sync_worker_capabilities()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM worker_capabilities WHERE worker_id = COALESCE(NEW.worker_id, OLD.worker_id);
  
  INSERT INTO worker_capabilities (worker_id, capability_id)
  SELECT DISTINCT ws.worker_id, cs.capability_id
  FROM worker_skills ws
  JOIN capability_skills cs ON ws.skill_id = cs.skill_id
  WHERE ws.worker_id = COALESCE(NEW.worker_id, OLD.worker_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_worker_capabilities_on_skill_change
  AFTER INSERT OR DELETE ON worker_skills
  FOR EACH ROW EXECUTE FUNCTION sync_worker_capabilities();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_lanes_timestamp BEFORE UPDATE ON lanes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_timestamp BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_workers_timestamp BEFORE UPDATE ON service_workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contributions_timestamp BEFORE UPDATE ON worker_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lanes" ON lanes FOR SELECT USING (true);
CREATE POLICY "Admins can manage lanes" ON lanes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE service_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active workers" ON service_workers FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage workers" ON service_workers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view capabilities" ON capabilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage capabilities" ON capabilities FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Admins can manage skills" ON skills FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active sales items" ON sales_items FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage sales items" ON sales_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage bookings" ON bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE capacity_intervals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view intervals" ON capacity_intervals FOR SELECT USING (true);
CREATE POLICY "Admins can manage intervals" ON capacity_intervals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE lane_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lane capabilities" ON lane_capabilities FOR SELECT USING (true);
CREATE POLICY "Admins can manage lane capabilities" ON lane_capabilities FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE worker_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contributions" ON worker_contributions FOR SELECT USING (true);
CREATE POLICY "Admins can manage contributions" ON worker_contributions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE booking_sales_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own booking items" ON booking_sales_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert booking items" ON booking_sales_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage booking items" ON booking_sales_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed data
INSERT INTO service_departments (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Main Garage');

INSERT INTO capabilities (id, name, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Heavy Lift', 'Can service heavy vehicles'),
  ('10000000-0000-0000-0000-000000000002', 'EV Charging', 'Electric vehicle service capability'),
  ('10000000-0000-0000-0000-000000000003', 'Diagnostics', 'Advanced diagnostic equipment'),
  ('10000000-0000-0000-0000-000000000004', 'Tire Service', 'Tire replacement and balancing');

INSERT INTO skills (id, name, description) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Heavy Vehicle Certification', 'Certified for heavy vehicles'),
  ('20000000-0000-0000-0000-000000000002', 'EV Specialist', 'Electric vehicle specialist'),
  ('20000000-0000-0000-0000-000000000003', 'Diagnostic Technician', 'Advanced diagnostics'),
  ('20000000-0000-0000-0000-000000000004', 'Tire Technician', 'Tire service specialist');

INSERT INTO capability_skills (capability_id, skill_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004');

INSERT INTO lanes (id, name, service_department_id, open_time, close_time) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Bay 1 - Heavy Duty', '00000000-0000-0000-0000-000000000001', '08:00', '17:00'),
  ('30000000-0000-0000-0000-000000000002', 'Bay 2 - EV Station', '00000000-0000-0000-0000-000000000001', '08:00', '17:00'),
  ('30000000-0000-0000-0000-000000000003', 'Bay 3 - General Service', '00000000-0000-0000-0000-000000000001', '08:00', '17:00');

INSERT INTO lane_capabilities (lane_id, capability_id) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004');

INSERT INTO sales_items (id, name, description, service_time_seconds, price_cents) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Oil Change', 'Standard oil and filter change', 1800, 79900),
  ('40000000-0000-0000-0000-000000000002', 'Tire Rotation', 'Rotate and balance all tires', 2700, 49900),
  ('40000000-0000-0000-0000-000000000003', 'Full Diagnostic', 'Complete vehicle diagnostic scan', 3600, 129900),
  ('40000000-0000-0000-0000-000000000004', 'EV Battery Check', 'Electric vehicle battery health check', 2700, 99900),
  ('40000000-0000-0000-0000-000000000005', 'Heavy Vehicle Inspection', 'Full inspection for heavy vehicles', 5400, 199900);

INSERT INTO sales_item_capabilities (sales_item_id, capability_id) VALUES
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'),
  ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001');