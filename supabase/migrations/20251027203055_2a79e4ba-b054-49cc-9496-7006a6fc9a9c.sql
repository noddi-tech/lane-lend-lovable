-- Phase 1: Create facilities table
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  grid_width INTEGER NOT NULL DEFAULT 100,
  grid_height INTEGER NOT NULL DEFAULT 100,
  time_zone TEXT DEFAULT 'Europe/Oslo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on facilities
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for facilities
CREATE POLICY "Admins can manage facilities"
ON public.facilities
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view facilities"
ON public.facilities
FOR SELECT
TO authenticated
USING (true);

-- Add facility_id and position columns to driving_gates
ALTER TABLE public.driving_gates
ADD COLUMN facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
ADD COLUMN grid_position_x INTEGER DEFAULT 0,
ADD COLUMN grid_position_y INTEGER DEFAULT 0;

-- Create default facility
INSERT INTO public.facilities (name, description, grid_width, grid_height)
VALUES ('Main Service Center', 'Default facility for existing driving gates', 100, 100);

-- Migrate existing driving gates to default facility with a CTE
WITH numbered_gates AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS row_num
  FROM public.driving_gates
)
UPDATE public.driving_gates AS dg
SET 
  facility_id = (SELECT id FROM public.facilities LIMIT 1),
  grid_position_x = 0,
  grid_position_y = ng.row_num * 25
FROM numbered_gates AS ng
WHERE dg.id = ng.id;

-- Make facility_id required after migration
ALTER TABLE public.driving_gates
ALTER COLUMN facility_id SET NOT NULL;

-- Add trigger for updated_at on facilities
CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for facility queries
CREATE INDEX idx_driving_gates_facility_id ON public.driving_gates(facility_id);