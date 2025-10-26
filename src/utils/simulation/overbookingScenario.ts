import { supabase } from '@/integrations/supabase/client';

export interface OverbookingResult {
  isOverbooked: boolean;
  utilizationPercent: number;
  excessSeconds: number;
  affectedBookings: string[];
}

export async function detectOverbooking(
  intervalId: string,
  laneId: string
): Promise<OverbookingResult> {
  // Get total worker capacity for this interval
  const { data: contributions } = await supabase
    .from('contribution_intervals')
    .select('remaining_seconds, contribution:worker_contributions!inner(lane_id)')
    .eq('interval_id', intervalId)
    .eq('contribution.lane_id', laneId);
  
  const totalCapacity = contributions?.reduce((sum, c) => sum + c.remaining_seconds, 0) || 0;
  
  // Get total booked seconds
  const { data: capacity } = await supabase
    .from('lane_interval_capacity')
    .select('total_booked_seconds')
    .eq('lane_id', laneId)
    .eq('interval_id', intervalId)
    .maybeSingle();
  
  const bookedSeconds = capacity?.total_booked_seconds || 0;
  
  // Get affected bookings
  const { data: bookingIntervals } = await supabase
    .from('booking_intervals')
    .select('booking_id')
    .eq('interval_id', intervalId);
  
  const affectedBookings = bookingIntervals?.map(bi => bi.booking_id) || [];
  
  const utilizationPercent = totalCapacity > 0 ? (bookedSeconds / totalCapacity) * 100 : 0;
  const excessSeconds = Math.max(0, bookedSeconds - totalCapacity);
  
  return {
    isOverbooked: utilizationPercent >= 100,
    utilizationPercent,
    excessSeconds,
    affectedBookings,
  };
}

export async function createOverbookingScenario(
  laneId: string,
  targetHour: number,
  date: Date
): Promise<{ created: number; overbooked: boolean }> {
  // Implementation for creating intentional overbooking
  // This would be used in simulation mode
  return { created: 0, overbooked: false };
}
