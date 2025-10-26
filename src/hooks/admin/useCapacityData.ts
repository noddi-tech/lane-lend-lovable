import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CapacityInterval {
  interval_id: string;
  starts_at: string;
  ends_at: string;
  total_capacity: number;
  booked_seconds: number;
  remaining_capacity: number;
  utilization_percentage: number;
  bookings?: Array<{
    id: string;
    vehicle_registration: string | null;
    customer_name: string | null;
  }>;
}

export function useCapacityData(date: string, laneId: string) {
  return useQuery({
    queryKey: ['capacity-data', date, laneId],
    queryFn: async () => {
      // Fetch capacity intervals for the selected date
      const { data: intervals, error: intervalsError } = await supabase
        .from('capacity_intervals')
        .select('*')
        .eq('date', date)
        .order('starts_at');

      if (intervalsError) throw intervalsError;

      // Fetch lane capacity data
      const capacityData: CapacityInterval[] = [];

      for (const interval of intervals || []) {
        // Get total capacity from contribution_intervals
        const { data: contributions, error: contributionsError } = await supabase
          .from('contribution_intervals')
          .select(`
            remaining_seconds,
            worker_contributions (
              lane_id,
              available_seconds
            )
          `)
          .eq('interval_id', interval.id);

        if (contributionsError) throw contributionsError;

        // Filter for the specific lane
        const laneContributions = contributions?.filter(
          (c: any) => c.worker_contributions?.lane_id === laneId
        ) || [];

        const totalCapacity = laneContributions.reduce(
          (sum: number, c: any) => sum + (c.worker_contributions?.available_seconds || 0),
          0
        );

        const remainingCapacity = laneContributions.reduce(
          (sum: number, c: any) => sum + (c.remaining_seconds || 0),
          0
        );

        const bookedSeconds = totalCapacity - remainingCapacity;

        // Get bookings for this interval
        const { data: bookings, error: bookingsError } = await supabase
          .from('booking_intervals')
          .select(`
            booking:booking_id (
              id,
              vehicle_registration,
              profiles:user_id (full_name)
            )
          `)
          .eq('interval_id', interval.id);

        if (bookingsError) throw bookingsError;

        capacityData.push({
          interval_id: interval.id,
          starts_at: interval.starts_at,
          ends_at: interval.ends_at,
          total_capacity: totalCapacity,
          booked_seconds: bookedSeconds,
          remaining_capacity: remainingCapacity,
          utilization_percentage: totalCapacity > 0 ? (bookedSeconds / totalCapacity) * 100 : 0,
          bookings: bookings?.map((b: any) => ({
            id: b.booking?.id,
            vehicle_registration: b.booking?.vehicle_registration,
            customer_name: b.booking?.profiles?.full_name,
          })) || [],
        });
      }

      return capacityData;
    },
    enabled: !!date && !!laneId,
  });
}
