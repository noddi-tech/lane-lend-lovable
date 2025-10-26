import { supabase } from '@/integrations/supabase/client';

export interface CapabilityMismatch {
  bookingId: string;
  laneId: string;
  requiredCapabilities: string[];
  availableCapabilities: string[];
  missingCapabilities: string[];
}

export async function detectCapabilityMismatches(): Promise<CapabilityMismatch[]> {
  const mismatches: CapabilityMismatch[] = [];
  
  // Get all bookings with their lanes and services
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      lane_id,
      booking_sales_items(
        sales_item:sales_items(
          id,
          sales_item_capabilities(capability_id)
        )
      )
    `)
    .eq('status', 'confirmed');
  
  if (!bookings) return mismatches;
  
  for (const booking of bookings) {
    // Get lane capabilities
    const { data: laneCapabilities } = await supabase
      .from('lane_capabilities')
      .select('capability_id')
      .eq('lane_id', booking.lane_id);
    
    const availableCapIds = laneCapabilities?.map(lc => lc.capability_id) || [];
    
    // Get required capabilities from all sales items
    const requiredCapIds = new Set<string>();
    for (const bsi of booking.booking_sales_items as any[]) {
      if (bsi.sales_item?.sales_item_capabilities) {
        for (const sic of bsi.sales_item.sales_item_capabilities) {
          requiredCapIds.add(sic.capability_id);
        }
      }
    }
    
    const required = Array.from(requiredCapIds);
    const missing = required.filter(cap => !availableCapIds.includes(cap));
    
    if (missing.length > 0) {
      mismatches.push({
        bookingId: booking.id,
        laneId: booking.lane_id,
        requiredCapabilities: required,
        availableCapabilities: availableCapIds,
        missingCapabilities: missing,
      });
    }
  }
  
  return mismatches;
}
