-- Add zone_id columns to support nesting in zones
ALTER TABLE driving_gates ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);
ALTER TABLE lanes_new ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);