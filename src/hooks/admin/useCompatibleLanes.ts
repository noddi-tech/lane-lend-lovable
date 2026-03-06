import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Lane {
  id: string;
  name: string;
}

interface CompatibleLanesResult {
  lanes: Lane[];
  allLanes: Lane[];
  isFiltered: boolean;
}

export function useCompatibleLanes(salesItemIds: string[], override = false) {
  return useQuery({
    queryKey: ['compatible-lanes', salesItemIds, override],
    queryFn: async (): Promise<CompatibleLanesResult> => {
      // Always fetch all lanes
      const { data: allLanes, error: allError } = await supabase
        .from('lanes')
        .select('id, name')
        .order('name');
      if (allError) throw allError;

      // If no sales items selected or override active, return all lanes
      if (salesItemIds.length === 0 || override) {
        return { lanes: allLanes, allLanes, isFiltered: false };
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
        return { lanes: allLanes, allLanes, isFiltered: false };
      }

      // Step 2: Get lanes that have ALL required capabilities
      const { data: laneCaps, error: laneError } = await supabase
        .from('lane_capabilities')
        .select('lane_id')
        .in('capability_id', uniqueCapIds);
      if (laneError) throw laneError;

      const laneCapCount = new Map<string, number>();
      for (const lc of laneCaps) {
        laneCapCount.set(lc.lane_id, (laneCapCount.get(lc.lane_id) || 0) + 1);
      }

      const compatibleLaneIds = [...laneCapCount.entries()]
        .filter(([, count]) => count >= uniqueCapIds.length)
        .map(([id]) => id);

      const filtered = allLanes.filter(l => compatibleLaneIds.includes(l.id));
      return { lanes: filtered, allLanes, isFiltered: true };
    },
  });
}
