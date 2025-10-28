-- Migration: Lanes belong to Facilities, not Gates
-- Gates are entry/exit points, lanes are service areas within facilities

-- Step 1: Add facility_id column to lanes_new
ALTER TABLE public.lanes_new 
ADD COLUMN facility_id UUID;

-- Step 2: Populate facility_id from the driving_gates table
UPDATE public.lanes_new
SET facility_id = dg.facility_id
FROM public.driving_gates dg
WHERE lanes_new.driving_gate_id = dg.id;

-- Step 3: Make facility_id NOT NULL (now that it's populated)
ALTER TABLE public.lanes_new 
ALTER COLUMN facility_id SET NOT NULL;

-- Step 4: Add foreign key constraint to facilities
ALTER TABLE public.lanes_new
ADD CONSTRAINT lanes_new_facility_id_fkey 
FOREIGN KEY (facility_id) 
REFERENCES public.facilities(id) 
ON DELETE CASCADE;

-- Step 5: Drop the old driving_gate_id column
ALTER TABLE public.lanes_new
DROP COLUMN driving_gate_id;

-- Step 6: Add index for better query performance
CREATE INDEX idx_lanes_new_facility_id ON public.lanes_new(facility_id);