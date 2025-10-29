-- Add horizontal positioning columns to lanes_new table
ALTER TABLE lanes_new 
  ADD COLUMN grid_position_x INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN grid_width INTEGER DEFAULT 100 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN lanes_new.grid_position_x IS 'Horizontal position of lane on the grid';
COMMENT ON COLUMN lanes_new.grid_width IS 'Width of lane on the grid (allows variable-width lanes)';