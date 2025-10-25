import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AvailabilitySlot } from '@/types/booking';

interface UseAvailabilityParams {
  date: Date | null;
  salesItemIds: string[];
  laneIds?: string[];
}

export const useAvailability = ({ date, salesItemIds, laneIds }: UseAvailabilityParams) => {
  return useQuery({
    queryKey: ['availability', date?.toISOString().split('T')[0], salesItemIds, laneIds],
    queryFn: async () => {
      if (!date || salesItemIds.length === 0) {
        return { slots: [] as AvailabilitySlot[] };
      }

      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: {
          date: date.toISOString().split('T')[0],
          sales_item_ids: salesItemIds,
          lane_ids: laneIds,
        },
      });

      if (error) throw error;
      return data as { slots: AvailabilitySlot[] };
    },
    enabled: !!date && salesItemIds.length > 0,
  });
};
