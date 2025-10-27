import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RealMetricsData {
  totalCapacitySeconds: number;
  totalBookedSeconds: number;
  averageUtilization: number;
  peakUtilization: number;
  peakHour: number;
  workersOnShift: number;
  avgWorkerUtilization: number;
  hourlyUtilization: Record<number, number>;
  workers: Array<{
    workerId: string;
    workerName: string;
    totalCapacity: number;
    totalBooked: number;
    utilization: number;
    shiftStart: string;
    shiftEnd: string;
  }>;
}

export const useRealMetrics = (selectedDate: Date | null) => {
  return useQuery({
    queryKey: ['realMetrics', selectedDate?.toISOString()],
    queryFn: async (): Promise<RealMetricsData | null> => {
      if (!selectedDate) return null;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all capacity intervals for this date
      const { data: intervals } = await supabase
        .from('capacity_intervals')
        .select(`
          id,
          starts_at,
          ends_at,
          contribution_intervals(
            remaining_seconds,
            contribution:worker_contributions!inner(
              available_seconds,
              worker_id
            )
          )
        `)
        .gte('starts_at', startOfDay.toISOString())
        .lte('starts_at', endOfDay.toISOString());

      if (!intervals || intervals.length === 0) return null;

      // Get all bookings for this date with their intervals
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          service_time_seconds,
          delivery_window_starts_at,
          booking_intervals(interval_id, booked_seconds)
        `)
        .gte('delivery_window_starts_at', startOfDay.toISOString())
        .lte('delivery_window_starts_at', endOfDay.toISOString());

      // Calculate total capacity and booked time per hour
      const hourlyData: Record<number, { capacity: number; booked: number }> = {};

      intervals.forEach((interval: any) => {
        const startTime = new Date(interval.starts_at);
        const hour = startTime.getHours();

        if (!hourlyData[hour]) {
          hourlyData[hour] = { capacity: 0, booked: 0 };
        }

        // Sum ORIGINAL capacity from worker_contributions (not remaining_seconds)
        const contributions = interval.contribution_intervals as any[];
        const intervalCapacity = contributions?.reduce(
          (sum, contrib) => sum + (contrib.contribution?.available_seconds || 0),
          0
        ) || 0;

        hourlyData[hour].capacity += intervalCapacity;
      });

      // Calculate booked time per hour
      bookings?.forEach((booking: any) => {
        const startTime = new Date(booking.delivery_window_starts_at);
        const hour = startTime.getHours();

        if (!hourlyData[hour]) {
          hourlyData[hour] = { capacity: 0, booked: 0 };
        }

        // Sum booked seconds from booking_intervals
        const bookingIntervals = booking.booking_intervals as any[];
        const bookedSeconds = bookingIntervals?.reduce(
          (sum, bi) => sum + (bi.booked_seconds || 0),
          0
        ) || 0;

        hourlyData[hour].booked += bookedSeconds;
      });

      // Calculate metrics
      let totalCapacity = 0;
      let totalBooked = 0;
      let peakUtilization = 0;
      let peakHour = 8;
      const hourlyUtilization: Record<number, number> = {};

      Object.entries(hourlyData).forEach(([hourStr, data]) => {
        const hour = parseInt(hourStr);
        totalCapacity += data.capacity;
        totalBooked += data.booked;

        const utilization = data.capacity > 0 ? (data.booked / data.capacity) * 100 : 0;
        hourlyUtilization[hour] = utilization;

        if (utilization > peakUtilization) {
          peakUtilization = utilization;
          peakHour = hour;
        }
      });

      const averageUtilization = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

      // Count unique workers on shift
      const { data: contributions } = await supabase
        .from('worker_contributions')
        .select('worker_id')
        .gte('starts_at', startOfDay.toISOString())
        .lte('ends_at', endOfDay.toISOString());

      const uniqueWorkers = new Set(contributions?.map(c => c.worker_id) || []);
      const workersOnShift = uniqueWorkers.size;

      // Calculate per-worker utilization
      const avgWorkerUtilization = workersOnShift > 0 ? averageUtilization : 0;

      // Calculate detailed worker statistics
      const workerStats = new Map();
      
      for (const interval of intervals) {
        const contributions = interval.contribution_intervals as any[];
        
        contributions?.forEach((c: any) => {
          const contribution = c.contribution;
          const worker = contribution?.worker;
          const workerId = contribution?.worker_id;
          
          if (!workerId || !worker) return;
          
          if (!workerStats.has(workerId)) {
            workerStats.set(workerId, {
              workerId,
              workerName: `${worker.first_name} ${worker.last_name}`,
              totalCapacity: 0,
              totalBooked: 0,
              shiftStart: new Date(contribution.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              shiftEnd: new Date(contribution.ends_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            });
          }
          
          const stats = workerStats.get(workerId);
          stats.totalCapacity += contribution.available_seconds || 0;
          stats.totalBooked += (contribution.available_seconds - c.remaining_seconds) || 0;
        });
      }
      
      const workers = Array.from(workerStats.values()).map(w => ({
        ...w,
        utilization: w.totalCapacity > 0 ? (w.totalBooked / w.totalCapacity) * 100 : 0,
      }));

      return {
        totalCapacitySeconds: totalCapacity,
        totalBookedSeconds: totalBooked,
        averageUtilization,
        peakUtilization,
        peakHour,
        workersOnShift,
        avgWorkerUtilization,
        hourlyUtilization,
        workers,
      };
    },
    enabled: !!selectedDate,
  });
};
