import { supabase } from '@/integrations/supabase/client';
import type { SalesItem } from '@/types/booking';
import type { VehicleInfo } from './vehicleGenerator';

export interface BookingData {
  userId: string;
  laneId: string;
  addressId: string;
  deliveryWindowStart: Date;
  deliveryWindowEnd: Date;
  serviceTimeSeconds: number;
  salesItems: SalesItem[];
  vehicle: VehicleInfo;
}

interface Interval {
  id: string;
  starts_at: string;
  ends_at: string;
}

interface IntervalAllocation {
  intervalId: string;
  bookedSeconds: number;
}

async function findOverlappingIntervals(startTime: Date, endTime: Date): Promise<Interval[]> {
  const { data, error } = await supabase
    .from('capacity_intervals')
    .select('id, starts_at, ends_at')
    .lt('starts_at', endTime.toISOString())
    .gt('ends_at', startTime.toISOString())
    .order('starts_at');
  
  if (error) throw error;
  return data || [];
}

function distributeServiceTime(
  intervals: Interval[],
  totalSeconds: number,
  windowStart: Date,
  windowEnd: Date
): IntervalAllocation[] {
  if (intervals.length === 0) return [];
  
  const allocations: IntervalAllocation[] = [];
  let remainingSeconds = totalSeconds;
  
  for (let i = 0; i < intervals.length && remainingSeconds > 0; i++) {
    const interval = intervals[i];
    const intervalStart = new Date(interval.starts_at);
    const intervalEnd = new Date(interval.ends_at);
    
    // Calculate overlap between booking window and interval
    const overlapStart = new Date(Math.max(windowStart.getTime(), intervalStart.getTime()));
    const overlapEnd = new Date(Math.min(windowEnd.getTime(), intervalEnd.getTime()));
    const overlapSeconds = Math.max(0, (overlapEnd.getTime() - overlapStart.getTime()) / 1000);
    
    if (overlapSeconds > 0) {
      const allocatedSeconds = Math.min(remainingSeconds, overlapSeconds);
      allocations.push({
        intervalId: interval.id,
        bookedSeconds: Math.floor(allocatedSeconds),
      });
      remainingSeconds -= allocatedSeconds;
    }
  }
  
  return allocations;
}

async function updateCapacityTables(
  bookingId: string,
  laneId: string,
  allocations: IntervalAllocation[]
): Promise<void> {
  // Insert booking_intervals
  const bookingIntervals = allocations.map(a => ({
    booking_id: bookingId,
    interval_id: a.intervalId,
    booked_seconds: a.bookedSeconds,
  }));
  
  const { error: biError } = await supabase
    .from('booking_intervals')
    .insert(bookingIntervals);
  
  if (biError) {
    console.error('Error inserting booking_intervals:', biError);
    throw biError;
  }
  
  // Update or insert lane_interval_capacity
  for (const allocation of allocations) {
    const { data: existing } = await supabase
      .from('lane_interval_capacity')
      .select('total_booked_seconds')
      .eq('lane_id', laneId)
      .eq('interval_id', allocation.intervalId)
      .maybeSingle();
    
    if (existing) {
      // Update existing
      await supabase
        .from('lane_interval_capacity')
        .update({ total_booked_seconds: existing.total_booked_seconds + allocation.bookedSeconds })
        .eq('lane_id', laneId)
        .eq('interval_id', allocation.intervalId);
    } else {
      // Insert new
      await supabase
        .from('lane_interval_capacity')
        .insert({
          lane_id: laneId,
          interval_id: allocation.intervalId,
          total_booked_seconds: allocation.bookedSeconds,
        });
    }
  }
  
  // Update contribution_intervals (decrement remaining_seconds)
  for (const allocation of allocations) {
    const { data: contributions } = await supabase
      .from('contribution_intervals')
      .select('contribution_id, remaining_seconds, contribution:worker_contributions!inner(lane_id)')
      .eq('interval_id', allocation.intervalId)
      .eq('contribution.lane_id', laneId);
    
    if (contributions && contributions.length > 0) {
      // Distribute the booked seconds among contributors proportionally
      const totalRemaining = contributions.reduce((sum, c) => sum + c.remaining_seconds, 0);
      
      for (const contrib of contributions) {
        if (totalRemaining > 0) {
          const proportion = contrib.remaining_seconds / totalRemaining;
          const deduction = Math.floor(allocation.bookedSeconds * proportion);
          const newRemaining = Math.max(0, contrib.remaining_seconds - deduction);
          
          await supabase
            .from('contribution_intervals')
            .update({ remaining_seconds: newRemaining })
            .eq('contribution_id', contrib.contribution_id)
            .eq('interval_id', allocation.intervalId);
        }
      }
    }
  }
}

export async function createBooking(bookingData: BookingData): Promise<string> {
  // 1. Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: bookingData.userId,
      lane_id: bookingData.laneId,
      address_id: bookingData.addressId,
      delivery_window_starts_at: bookingData.deliveryWindowStart.toISOString(),
      delivery_window_ends_at: bookingData.deliveryWindowEnd.toISOString(),
      service_time_seconds: bookingData.serviceTimeSeconds,
      vehicle_make: bookingData.vehicle.make,
      vehicle_model: bookingData.vehicle.model,
      vehicle_year: bookingData.vehicle.year,
      vehicle_registration: bookingData.vehicle.registration,
      customer_notes: bookingData.vehicle.notes,
      status: 'confirmed',
    })
    .select('id')
    .single();
  
  if (bookingError || !booking) throw bookingError;
  
  const bookingId = booking.id;
  
  // 2. Find overlapping intervals
  const intervals = await findOverlappingIntervals(
    bookingData.deliveryWindowStart,
    bookingData.deliveryWindowEnd
  );
  
  // 3. Distribute service time
  const allocations = distributeServiceTime(
    intervals,
    bookingData.serviceTimeSeconds,
    bookingData.deliveryWindowStart,
    bookingData.deliveryWindowEnd
  );
  
  // 4. Update capacity tables
  if (allocations.length > 0) {
    await updateCapacityTables(bookingId, bookingData.laneId, allocations);
  }
  
  // 5. Link sales items
  const bookingSalesItems = bookingData.salesItems.map(item => ({
    booking_id: bookingId,
    sales_item_id: item.id,
  }));
  
  const { error: bsiError } = await supabase
    .from('booking_sales_items')
    .insert(bookingSalesItems);
  
  if (bsiError) {
    console.error('Error inserting booking_sales_items:', bsiError);
  }
  
  return bookingId;
}
