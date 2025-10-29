import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook to assign zones to facilities or rooms
export function useAssignZoneToFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      zoneId, 
      facilityId, 
      roomId, 
      gridX, 
      gridY 
    }: { 
      zoneId: string; 
      facilityId: string; 
      roomId?: string | null; 
      gridX: number; 
      gridY: number;
    }) => {
      const { error } = await supabase
        .from('zones' as any)
        .update({ 
          facility_id: facilityId,
          room_id: roomId || null,
          grid_position_x: gridX, 
          grid_position_y: gridY 
        })
        .eq('id', zoneId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['library-zones'] });
    }
  });
}

// Hook to assign stations to zones
export function useAssignStationToZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      stationId, 
      zoneId, 
      gridX, 
      gridY 
    }: { 
      stationId: string; 
      zoneId: string; 
      gridX: number; 
      gridY: number;
    }) => {
      const { error } = await supabase
        .from('stations')
        .update({ 
          zone_id: zoneId,
          lane_id: null, // Clear lane_id when assigning to zone
          grid_position_x: gridX, 
          grid_position_y: gridY 
        })
        .eq('id', stationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    }
  });
}

// Hook to assign storage to zones
export function useAssignStorageToZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      storageId, 
      zoneId, 
      gridX, 
      gridY 
    }: { 
      storageId: string; 
      zoneId: string; 
      gridX: number; 
      gridY: number;
    }) => {
      const { error } = await supabase
        .from('storage_locations' as any)
        .update({ 
          zone_id: zoneId,
          lane_id: null, // Clear lane_id when assigning to zone
          grid_position_x: gridX, 
          grid_position_y: gridY 
        })
        .eq('id', storageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    }
  });
}
