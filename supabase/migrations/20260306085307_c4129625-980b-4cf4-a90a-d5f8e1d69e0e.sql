
-- 1. Insert new skills
INSERT INTO skills (name, description) VALUES
  ('Wheel Mounting', 'Certified for wheel mounting, dismounting, and torque procedures'),
  ('Storage Handling', 'Qualified to handle and organize seasonal tire/wheel storage');

-- 2. Insert new capabilities
INSERT INTO capabilities (name, description) VALUES
  ('Wheel Change Service', 'Full wheel swap including mounting and balancing'),
  ('Wheel Storage Service', 'Seasonal wheel intake, labeling, and storage');

-- 3. Link capabilities to required skills
INSERT INTO capability_skills (capability_id, skill_id)
SELECT c.id, s.id FROM capabilities c, skills s
WHERE (c.name = 'Wheel Change Service' AND s.name = 'Tire Specialist')
   OR (c.name = 'Wheel Change Service' AND s.name = 'Wheel Mounting')
   OR (c.name = 'Wheel Storage Service' AND s.name = 'Storage Handling');

-- 4. Insert new sales items
INSERT INTO sales_items (name, description, price_cents, service_time_seconds) VALUES
  ('Wheel Change', 'Swap and balance all 4 wheels', 129900, 2700),
  ('Wheel Storage', 'Seasonal storage for 4 wheels/tires', 79900, 1200);

-- 5. Link ALL sales items to capabilities
INSERT INTO sales_item_capabilities (sales_item_id, capability_id)
SELECT si.id, c.id FROM sales_items si, capabilities c
WHERE (si.name = 'Wheel Change' AND c.name = 'Wheel Change Service')
   OR (si.name = 'Wheel Storage' AND c.name = 'Wheel Storage Service')
   OR (si.name = 'Oil Change' AND c.name = 'Basic Service')
   OR (si.name = 'Tire Rotation' AND c.name = 'Tire Service')
   OR (si.name = 'Full Diagnostic' AND c.name = 'Advanced Diagnostics')
   OR (si.name = 'EV Battery Check' AND c.name = 'Advanced Diagnostics')
   OR (si.name = 'Heavy Vehicle Inspection' AND c.name = 'Advanced Diagnostics');
