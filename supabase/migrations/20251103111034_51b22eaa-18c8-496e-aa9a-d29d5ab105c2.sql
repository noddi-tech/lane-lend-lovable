-- Fix existing lane position to be inside its room
-- Room "Workshop Main" is at X=61, so lane should be at X=66 (room_x + 5 offset)

UPDATE lanes_new
SET grid_position_x = 66
WHERE id = 'eeb21072-6ecf-4f35-8657-4add93caf57b'
  AND grid_position_x = 0;

-- Verify the update
COMMENT ON TABLE lanes_new IS 'Lanes with corrected grid positions for proper room placement';