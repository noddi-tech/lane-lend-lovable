import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemReadinessStatus {
  lanes: { count: number; ready: boolean };
  salesItems: { count: number; ready: boolean };
  workers: { count: number; ready: boolean };
  capacity: {
    coverageStart: Date | null;
    coverageEnd: Date | null;
    contributionIntervalCount: number;
    ready: boolean;
    recommendation: string;
  };
  overallReady: boolean;
}

export const useSystemReadiness = () => {
  return useQuery({
    queryKey: ['system-readiness'],
    queryFn: async (): Promise<SystemReadinessStatus> => {
      // Check lanes
      const { count: lanesCount, error: lanesError } = await supabase
        .from('lanes')
        .select('id', { count: 'exact', head: true });

      // Check active sales items
      const { count: salesItemsCount, error: salesError } = await supabase
        .from('sales_items')
        .select('id', { count: 'exact', head: true })
        .eq('active', true);

      // Check workers
      const { count: workersCount, error: workersError } = await supabase
        .from('service_workers')
        .select('id', { count: 'exact', head: true })
        .eq('active', true);

      // Check contribution intervals and their date range
      const { data: contributionIntervals, error: intervalsError } = await supabase
        .from('contribution_intervals')
        .select('interval_id(starts_at, ends_at)', { count: 'exact' });

      let coverageStart: Date | null = null;
      let coverageEnd: Date | null = null;
      let recommendation = '';

      if (contributionIntervals && contributionIntervals.length > 0) {
        const intervals = contributionIntervals
          .map((ci: any) => ci.interval_id)
          .filter(Boolean);

        if (intervals.length > 0) {
          const dates = intervals.map((i: any) => new Date(i.starts_at));
          const endDates = intervals.map((i: any) => new Date(i.ends_at));
          coverageStart = new Date(Math.min(...dates.map(d => d.getTime())));
          coverageEnd = new Date(Math.max(...endDates.map(d => d.getTime())));

          const today = new Date();
          const daysFromNow = Math.ceil((coverageEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysFromNow < 7) {
            recommendation = 'Worker capacity covers less than 7 days. Re-seed base data for extended coverage.';
          } else if (daysFromNow < 30) {
            recommendation = `Worker capacity covers ${daysFromNow} days. Consider re-seeding for longer coverage.`;
          } else {
            recommendation = `Worker capacity covers ${daysFromNow} days. Ready for booking generation!`;
          }
        }
      } else {
        recommendation = 'No worker capacity found. Please seed base data first (Lanes & Workers tab).';
      }

      const lanesReady = (lanesCount || 0) > 0;
      const salesItemsReady = (salesItemsCount || 0) > 0;
      const workersReady = (workersCount || 0) > 0;
      const capacityReady = (contributionIntervals?.length || 0) > 0;

      return {
        lanes: { count: lanesCount || 0, ready: lanesReady },
        salesItems: { count: salesItemsCount || 0, ready: salesItemsReady },
        workers: { count: workersCount || 0, ready: workersReady },
        capacity: {
          coverageStart,
          coverageEnd,
          contributionIntervalCount: contributionIntervals?.length || 0,
          ready: capacityReady,
          recommendation,
        },
        overallReady: lanesReady && salesItemsReady && workersReady && capacityReady,
      };
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};
