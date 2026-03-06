-- Add RLS policies for sales_item_capabilities (currently has none, blocking reads)
ALTER TABLE public.sales_item_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sales item capabilities"
  ON public.sales_item_capabilities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view sales item capabilities"
  ON public.sales_item_capabilities FOR SELECT
  TO authenticated
  USING (true);