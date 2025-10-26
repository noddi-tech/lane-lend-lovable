import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CapacityCoverageParams {
  startDate: Date | null;
  endDate: Date | null;
}

export const useCapacityCoverage = ({ startDate, endDate }: CapacityCoverageParams) => {
  return useQuery({
    queryKey: ['capacity-coverage', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!startDate || !endDate) {
        return { hasCapacity: false, message: 'Please select date range' };
      }

      const { data, error } = await supabase
        .from('contribution_intervals')
        .select('interval_id(starts_at, ends_at)')
        .gte('interval_id.starts_at', startDate.toISOString())
        .lte('interval_id.ends_at', endDate.toISOString())
        .limit(1);

      if (error) throw error;

      const hasCapacity = !!data && data.length > 0;

      let message = '';
      if (!hasCapacity) {
        message = `⚠️ No worker capacity found for ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}. Re-seed base data first.`;
      } else {
        message = `✅ Worker capacity available for selected date range`;
      }

      return { hasCapacity, message };
    },
    enabled: !!startDate && !!endDate,
  });
};
