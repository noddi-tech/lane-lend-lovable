import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Lane {
  id: string;
  name: string;
}

export function useCompatibleLanes(salesItemIds: string[]) {
  return useQuery({
    queryKey: ['compatible-lanes', salesItemIds],
    queryFn: async (): Promise<Lane[]> => {
      // If no sales items selected, return all lanes
      if (salesItemIds.length === 0) {
        const { data, error } = await supabase
          .from('lanes')
          .select('id, name')
          .order('name');
        if (error) throw error;
        return data;
      }

      // Step 1: Get required capability IDs for selected sales items
      const { data: requiredCaps, error: capsError } = await supabase
        .from('sales_item_capabilities')
        .select('capability_id')
        .in('sales_item_id', salesItemIds);
      if (capsError) throw capsError;

      const uniqueCapIds = [...new Set(requiredCaps.map(r => r.capability_id))];

      // If no capabilities required, return all lanes
      if (uniqueCapIds.length === 0) {
        const { data, error } = await supabase
          .from('lanes')
          .select('id, name')
          .order('name');
        if (error) throw error;
        return data;
      }

      // Step 2: Get lanes that have ALL required capabilities
      const { data: laneCaps, error: laneError } = await supabase
        .from('lane_capabilities')
        .select('lane_id')
        .in('capability_id', uniqueCapIds);
      if (laneError) throw laneError;

      // Count capabilities per lane, keep only those with all required
      const laneCapCount = new Map<string, number>();
      for (const lc of laneCaps) {
        laneCapCount.set(lc.lane_id, (laneCapCount.get(lc.lane_id) || 0) + 1);
      }

      const compatibleLaneIds = [...laneCapCount.entries()]
        .filter(([, count]) => count >= uniqueCapIds.length)
        .map(([id]) => id);

      if (compatibleLaneIds.length === 0) return [];

      // Step 3: Fetch lane details
      const { data: lanes, error: lanesError } = await supabase
        .from('lanes')
        .select('id, name')
        .in('id', compatibleLaneIds)
        .order('name');
      if (lanesError) throw lanesError;

      return lanes;
    },
  });
}
