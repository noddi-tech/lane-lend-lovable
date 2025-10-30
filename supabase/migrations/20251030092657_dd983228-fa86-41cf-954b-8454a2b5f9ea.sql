-- Reset corrupted room dimensions
UPDATE rooms 
SET 
  grid_width = 30,
  grid_height = 20,
  grid_position_x = 60,
  grid_position_y = 5
WHERE id = 'ce4c59aa-465f-4517-99e8-1f63ddf80f4e';