import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import type { BookingAnalytics, WorkerPerformance, CapacityInsight, PeakHourData, SystemInsight, AnalyticsFilters } from '@/types/analytics';

export function useBookingAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['booking-analytics', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*, lanes(name), profiles(full_name, email)')
        .gte('delivery_window_starts_at', filters.startDate)
        .lte('delivery_window_starts_at', filters.endDate);

      if (filters.laneId) {
        query = query.eq('lane_id', filters.laneId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data: bookings, error } = await query;

      if (error) throw error;

      // Group by period
      const groupBy = filters.groupBy || 'day';
      const periodMap = new Map<string, BookingAnalytics>();

      let periods: Date[] = [];
      if (groupBy === 'day') {
        periods = eachDayOfInterval({ start: parseISO(filters.startDate), end: parseISO(filters.endDate) });
      } else if (groupBy === 'week') {
        periods = eachWeekOfInterval({ start: parseISO(filters.startDate), end: parseISO(filters.endDate) });
      } else {
        periods = eachMonthOfInterval({ start: parseISO(filters.startDate), end: parseISO(filters.endDate) });
      }

      periods.forEach(period => {
        const key = groupBy === 'day' 
          ? format(period, 'yyyy-MM-dd')
          : groupBy === 'week'
          ? format(period, 'yyyy-MM-dd')
          : format(period, 'yyyy-MM');

        periodMap.set(key, {
          period: key,
          totalBookings: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          cancellationRate: 0,
          avgServiceTime: 0,
          totalServiceTime: 0
        });
      });

      bookings?.forEach(booking => {
        const date = parseISO(booking.delivery_window_starts_at);
        let key: string;

        if (groupBy === 'day') {
          key = format(date, 'yyyy-MM-dd');
        } else if (groupBy === 'week') {
          key = format(startOfWeek(date), 'yyyy-MM-dd');
        } else {
          key = format(startOfMonth(date), 'yyyy-MM');
        }

        const existing = periodMap.get(key);
        if (existing) {
          existing.totalBookings++;
          if (booking.status === 'confirmed') existing.confirmed++;
          if (booking.status === 'completed') existing.completed++;
          if (booking.status === 'cancelled') existing.cancelled++;
          existing.totalServiceTime += booking.service_time_seconds || 0;
        }
      });

      const analytics = Array.from(periodMap.values()).map(item => ({
        ...item,
        cancellationRate: item.totalBookings > 0 ? (item.cancelled / item.totalBookings) * 100 : 0,
        avgServiceTime: item.totalBookings > 0 ? item.totalServiceTime / item.totalBookings : 0
      }));

      return { analytics, rawBookings: bookings || [] };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useWorkerPerformance(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['worker-performance', filters],
    queryFn: async () => {
      let contributionsQuery = supabase
        .from('worker_contributions')
        .select(`
          *,
          service_workers(first_name, last_name),
          contribution_intervals(remaining_seconds)
        `)
        .gte('starts_at', filters.startDate)
        .lte('ends_at', filters.endDate);

      if (filters.workerId) {
        contributionsQuery = contributionsQuery.eq('worker_id', filters.workerId);
      }

      const { data: contributions, error } = await contributionsQuery;

      if (error) throw error;

      // Get bookings with intervals
      const { data: bookingIntervals } = await supabase
        .from('booking_intervals')
        .select(`
          booked_seconds,
          interval_id,
          bookings(id, lane_id, delivery_window_starts_at)
        `)
        .gte('bookings.delivery_window_starts_at', filters.startDate)
        .lte('bookings.delivery_window_starts_at', filters.endDate);

      const workerMap = new Map<string, WorkerPerformance>();

      contributions?.forEach(contribution => {
        const workerId = contribution.worker_id;
        const workerName = `${contribution.service_workers?.first_name} ${contribution.service_workers?.last_name}`;

        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            workerId,
            workerName,
            totalShifts: 0,
            totalAvailableSeconds: 0,
            totalUtilizedSeconds: 0,
            utilizationRate: 0,
            bookingsHandled: 0,
            idleSeconds: 0
          });
        }

        const worker = workerMap.get(workerId)!;
        worker.totalShifts++;
        worker.totalAvailableSeconds += contribution.available_seconds || 0;

        // Calculate utilized seconds from contribution_intervals
        const utilizedInContribution = (contribution.available_seconds || 0) - 
          (contribution.contribution_intervals?.reduce((sum: number, ci: any) => sum + (ci.remaining_seconds || 0), 0) || 0);
        
        worker.totalUtilizedSeconds += utilizedInContribution;
      });

      // Count bookings per worker
      const workerBookings = new Map<string, Set<string>>();
      bookingIntervals?.forEach((bi: any) => {
        const intervalId = bi.interval_id;
        const bookingId = bi.bookings?.id;
        
        contributions?.forEach(contribution => {
          const matchingInterval = contribution.contribution_intervals?.find(
            (ci: any) => ci.interval_id === intervalId
          );
          
          if (matchingInterval && bookingId) {
            if (!workerBookings.has(contribution.worker_id)) {
              workerBookings.set(contribution.worker_id, new Set());
            }
            workerBookings.get(contribution.worker_id)!.add(bookingId);
          }
        });
      });

      workerBookings.forEach((bookingSet, workerId) => {
        const worker = workerMap.get(workerId);
        if (worker) {
          worker.bookingsHandled = bookingSet.size;
        }
      });

      const workers = Array.from(workerMap.values()).map(worker => ({
        ...worker,
        utilizationRate: worker.totalAvailableSeconds > 0 
          ? (worker.totalUtilizedSeconds / worker.totalAvailableSeconds) * 100 
          : 0,
        idleSeconds: worker.totalAvailableSeconds - worker.totalUtilizedSeconds
      }));

      return workers;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCapacityInsights(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['capacity-insights', filters],
    queryFn: async () => {
      const { data: intervals, error } = await supabase
        .from('capacity_intervals')
        .select('*')
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
        .order('starts_at');

      if (error) throw error;

      const insights: CapacityInsight[] = [];

      for (const interval of intervals || []) {
        let capacityQuery = supabase
          .from('lane_interval_capacity')
          .select('*, lanes(name)')
          .eq('interval_id', interval.id);

        if (filters.laneId) {
          capacityQuery = capacityQuery.eq('lane_id', filters.laneId);
        }

      const { data: laneCapacities } = await capacityQuery;

        laneCapacities?.forEach((lc: any) => {
          // Use the total_booked_seconds from lane_interval_capacity
          const bookedSeconds = lc.total_booked_seconds || 0;

          // For now, use a simple calculation - in production you'd get actual capacity
          const totalCapacity = bookedSeconds > 0 ? bookedSeconds * 1.5 : 3600; // Placeholder
          const utilizationRate = totalCapacity > 0 ? (bookedSeconds / totalCapacity) * 100 : 0;

          insights.push({
            intervalId: interval.id,
            date: format(parseISO(interval.starts_at), 'yyyy-MM-dd'),
            startTime: format(parseISO(interval.starts_at), 'HH:mm'),
            endTime: format(parseISO(interval.ends_at), 'HH:mm'),
            laneId: lc.lane_id,
            laneName: lc.lanes?.name || 'Unknown',
            totalCapacity,
            bookedSeconds,
            utilizationRate,
            isOverbooking: utilizationRate > 100,
            isUnderUtilized: utilizationRate < 25 && totalCapacity > 0
          });
        });
      }

      return insights;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePeakHoursAnalysis(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['peak-hours', filters],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('delivery_window_starts_at')
        .gte('delivery_window_starts_at', filters.startDate)
        .lte('delivery_window_starts_at', filters.endDate);

      if (error) throw error;

      const peakHoursMap = new Map<string, number>();

      bookings?.forEach(booking => {
        const date = parseISO(booking.delivery_window_starts_at);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const key = `${dayOfWeek}-${hour}`;

        peakHoursMap.set(key, (peakHoursMap.get(key) || 0) + 1);
      });

      const peakHours: PeakHourData[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          peakHours.push({
            hour,
            dayOfWeek: day,
            bookingCount: peakHoursMap.get(`${day}-${hour}`) || 0
          });
        }
      }

      return peakHours;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSystemInsights(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['system-insights', filters],
    queryFn: async () => {
      const insights: SystemInsight[] = [];

      // Check for overbooking
      const { data: capacityData } = await supabase
        .from('lane_interval_capacity')
        .select(`
          *,
          lanes(name),
          capacity_intervals(starts_at, ends_at)
        `)
        .gte('capacity_intervals.starts_at', filters.startDate)
        .lte('capacity_intervals.starts_at', filters.endDate);

      capacityData?.forEach((lc: any) => {
        // This is a simplified check - you'd need to compare with actual capacity
        if ((lc.total_booked_seconds || 0) > 7200) { // Example threshold
          insights.push({
            id: `overbooking-${lc.lane_id}`,
            type: 'critical',
            category: 'overbooking',
            title: 'Potential Overbooking Detected',
            description: `Lane "${lc.lanes?.name}" may be overbooked`,
            affectedEntities: [lc.lanes?.name],
            recommendation: 'Review capacity allocation or redistribute bookings'
          });
        }
      });

      return insights;
    },
    staleTime: 5 * 60 * 1000,
  });
}
