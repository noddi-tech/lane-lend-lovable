-- Add zone_id column to stations table for hierarchical relationships
ALTER TABLE stations ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

-- Add zone_id column to storage_locations table for hierarchical relationships
ALTER TABLE storage_locations ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id);

-- Add index for zone_id lookups
CREATE INDEX IF NOT EXISTS idx_stations_zone_id ON stations(zone_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_zone_id ON storage_locations(zone_id);