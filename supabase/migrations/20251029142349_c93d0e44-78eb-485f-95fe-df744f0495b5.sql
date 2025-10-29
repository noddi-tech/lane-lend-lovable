-- Make facility grid dimensions optional during design phase
ALTER TABLE facilities 
  ALTER COLUMN grid_width DROP NOT NULL,
  ALTER COLUMN grid_height DROP NOT NULL;

-- Set default values for NULL cases
ALTER TABLE facilities 
  ALTER COLUMN grid_width SET DEFAULT 100,
  ALTER COLUMN grid_height SET DEFAULT 100;

-- Add metadata columns for boundary management
ALTER TABLE facilities 
  ADD COLUMN IF NOT EXISTS is_bounded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS boundary_margin INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS boundary_mode TEXT DEFAULT 'auto' CHECK (boundary_mode IN ('auto', 'manual', 'none'));

-- Update existing facilities to be marked as bounded
UPDATE facilities 
SET is_bounded = TRUE 
WHERE grid_width IS NOT NULL AND grid_height IS NOT NULL;

COMMENT ON COLUMN facilities.is_bounded IS 'Whether the facility has a defined boundary';
COMMENT ON COLUMN facilities.boundary_margin IS 'Margin in grid units around elements when auto-fitting';
COMMENT ON COLUMN facilities.boundary_mode IS 'How the boundary was defined: auto, manual, or none';