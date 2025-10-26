import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SimulationReadinessStatus {
  hasLanes: boolean;
  lanesCount: number;
  hasWorkers: boolean;
  workersCount: number;
  hasCapacity: boolean;
  capacityCoverageStart: Date | null;
  capacityCoverageEnd: Date | null;
  hasBookingsForDate: boolean;
  bookingsCount: number;
  isReady: boolean;
  message: string;
}

export const useSimulationReadiness = (selectedDate: Date | null) => {
  return useQuery({
    queryKey: ['simulationReadiness', selectedDate?.toISOString()],
    queryFn: async (): Promise<SimulationReadinessStatus> => {
      // Check lanes
      const { data: lanes } = await supabase
        .from('lanes')
        .select('id')
        .limit(1);
      
      const hasLanes = (lanes?.length || 0) > 0;
      const { count: lanesCount } = await supabase
        .from('lanes')
        .select('*', { count: 'exact', head: true });

      // Check workers
      const { data: workers } = await supabase
        .from('service_workers')
        .select('id')
        .eq('active', true)
        .limit(1);
      
      const hasWorkers = (workers?.length || 0) > 0;
      const { count: workersCount } = await supabase
        .from('service_workers')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Check capacity coverage
      const { data: capacityIntervals } = await supabase
        .from('contribution_intervals')
        .select('interval_id, capacity_intervals(date, starts_at, ends_at)')
        .order('interval_id', { ascending: true })
        .limit(1000);

      let capacityCoverageStart: Date | null = null;
      let capacityCoverageEnd: Date | null = null;
      
      if (capacityIntervals && capacityIntervals.length > 0) {
        const dates = capacityIntervals
          .map(ci => {
            const interval = ci.capacity_intervals as any;
            return interval?.date ? new Date(interval.date) : null;
          })
          .filter((d): d is Date => d !== null)
          .sort((a, b) => a.getTime() - b.getTime());
        
        if (dates.length > 0) {
          capacityCoverageStart = dates[0];
          capacityCoverageEnd = dates[dates.length - 1];
        }
      }

      const hasCapacity = capacityCoverageStart !== null && capacityCoverageEnd !== null;

      // Check bookings for selected date
      let hasBookingsForDate = false;
      let bookingsCount = 0;

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('delivery_window_starts_at', startOfDay.toISOString())
          .lte('delivery_window_starts_at', endOfDay.toISOString());

        bookingsCount = count || 0;
        hasBookingsForDate = bookingsCount > 0;
      }

      // Determine overall readiness
      const isReady = hasLanes && hasWorkers && hasCapacity && hasBookingsForDate;

      let message = '';
      if (!hasLanes) {
        message = 'No lanes configured. Go to Setup to create lanes.';
      } else if (!hasWorkers) {
        message = 'No workers available. Add workers in Setup.';
      } else if (!hasCapacity) {
        message = 'No worker capacity. Generate capacity in Setup.';
      } else if (!selectedDate) {
        message = 'Select a date to simulate.';
      } else if (!hasBookingsForDate) {
        message = `No bookings on ${format(selectedDate, 'MMM d, yyyy')}. Generate bookings or select another date.`;
      } else {
        message = `Ready to simulate ${bookingsCount} bookings on ${format(selectedDate, 'MMM d, yyyy')}.`;
      }

      return {
        hasLanes,
        lanesCount: lanesCount || 0,
        hasWorkers,
        workersCount: workersCount || 0,
        hasCapacity,
        capacityCoverageStart,
        capacityCoverageEnd,
        hasBookingsForDate,
        bookingsCount,
        isReady,
        message,
      };
    },
    refetchInterval: 5000,
  });
};
