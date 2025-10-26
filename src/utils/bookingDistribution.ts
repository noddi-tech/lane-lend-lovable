import { supabase } from '@/integrations/supabase/client';

export interface PeakHours {
  morning: number;   // 9-11 AM weight
  midday: number;    // 11-14 PM weight
  afternoon: number; // 14-17 PM weight
}

export interface BookingSlot {
  date: Date;
  hour: number;
  minute: number;
  laneId: string;
}

export function calculateDailyBookingCount(date: Date, density: number): number {
  const dayOfWeek = date.getDay();
  
  // Base bookings per day
  const baseCount = Math.floor(Math.random() * 7) + 2; // 2-8
  
  // Weekday factor
  let weekdayFactor = 1.0;
  if (dayOfWeek === 0) { // Sunday
    weekdayFactor = 0.3;
  } else if (dayOfWeek === 6) { // Saturday
    weekdayFactor = 0.6;
  }
  
  return Math.max(1, Math.floor(baseCount * density * weekdayFactor));
}

export function selectTimeSlot(date: Date, peakHours: PeakHours): { hour: number; minute: number } {
  const totalWeight = peakHours.morning + peakHours.midday + peakHours.afternoon;
  const random = Math.random() * totalWeight;
  
  let hour: number;
  if (random < peakHours.morning) {
    // Morning: 9-11
    hour = 9 + Math.floor(Math.random() * 2);
  } else if (random < peakHours.morning + peakHours.midday) {
    // Midday: 11-14
    hour = 11 + Math.floor(Math.random() * 3);
  } else {
    // Afternoon: 14-17
    hour = 14 + Math.floor(Math.random() * 3);
  }
  
  // Random minute: 0 or 30
  const minute = Math.random() > 0.5 ? 0 : 30;
  
  return { hour, minute };
}

export async function checkCapacityAvailable(
  laneId: string,
  startTime: Date,
  durationSeconds: number
): Promise<boolean> {
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
  
  // Find overlapping capacity intervals
  const { data: intervals, error } = await supabase
    .from('capacity_intervals')
    .select('id, starts_at, ends_at')
    .lt('starts_at', endTime.toISOString())
    .gt('ends_at', startTime.toISOString());
  
  if (error || !intervals || intervals.length === 0) return false;
  
  // Check lane capacity for each interval
  for (const interval of intervals) {
    const { data: capacity } = await supabase
      .from('lane_interval_capacity')
      .select('total_booked_seconds')
      .eq('lane_id', laneId)
      .eq('interval_id', interval.id)
      .maybeSingle();
    
    // Get total worker capacity for this interval
    const { data: contributions } = await supabase
      .from('contribution_intervals')
      .select('remaining_seconds, contribution:worker_contributions!inner(lane_id)')
      .eq('interval_id', interval.id)
      .eq('contribution.lane_id', laneId);
    
    const totalWorkerCapacity = contributions?.reduce((sum, c) => sum + c.remaining_seconds, 0) || 0;
    const bookedSeconds = capacity?.total_booked_seconds || 0;
    
    // If any interval is at or over capacity, return false
    if (bookedSeconds >= totalWorkerCapacity) {
      return false;
    }
  }
  
  return true;
}

export async function findNextAvailableSlot(
  laneId: string,
  preferredTime: Date,
  durationSeconds: number,
  maxAttempts: number = 3
): Promise<Date | null> {
  // Try preferred time first
  if (await checkCapacityAvailable(laneId, preferredTime, durationSeconds)) {
    return preferredTime;
  }
  
  // Try adjacent slots (±30 min)
  const offsets = [30, -30, 60, -60, 90, -90];
  
  for (let i = 0; i < Math.min(maxAttempts, offsets.length); i++) {
    const adjustedTime = new Date(preferredTime.getTime() + offsets[i] * 60 * 1000);
    
    // Keep within working hours (8 AM - 6 PM)
    const hour = adjustedTime.getHours();
    if (hour < 8 || hour >= 17) continue;
    
    if (await checkCapacityAvailable(laneId, adjustedTime, durationSeconds)) {
      return adjustedTime;
    }
  }
  
  return null;
}
