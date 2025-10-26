import { supabase } from '@/integrations/supabase/client';

export interface WorkerRemovalImpact {
  workerId: string;
  affectedIntervals: number;
  affectedBookings: string[];
  capacityReduction: number;
}

export async function simulateWorkerUnavailability(
  workerId: string,
  startTime: Date,
  endTime: Date
): Promise<WorkerRemovalImpact> {
  // Get worker contributions in the time range
  const { data: contributions } = await supabase
    .from('worker_contributions')
    .select('id')
    .eq('worker_id', workerId)
    .lt('starts_at', endTime.toISOString())
    .gt('ends_at', startTime.toISOString());
  
  if (!contributions || contributions.length === 0) {
    return {
      workerId,
      affectedIntervals: 0,
      affectedBookings: [],
      capacityReduction: 0,
    };
  }
  
  // Get contribution intervals
  const contributionIds = contributions.map(c => c.id);
  const { data: intervals } = await supabase
    .from('contribution_intervals')
    .select('interval_id, remaining_seconds')
    .in('contribution_id', contributionIds);
  
  const affectedIntervals = intervals?.length || 0;
  const capacityReduction = intervals?.reduce((sum, i) => sum + i.remaining_seconds, 0) || 0;
  
  // Find bookings that would be affected
  const intervalIds = intervals?.map(i => i.interval_id) || [];
  const { data: bookingIntervals } = await supabase
    .from('booking_intervals')
    .select('booking_id')
    .in('interval_id', intervalIds);
  
  const affectedBookings = Array.from(new Set(bookingIntervals?.map(bi => bi.booking_id) || []));
  
  return {
    workerId,
    affectedIntervals,
    affectedBookings,
    capacityReduction,
  };
}
