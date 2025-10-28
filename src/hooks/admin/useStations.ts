import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Station {
  id: string;
  lane_id: string;
  name: string;
  description: string | null;
  station_type: string;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  open_time: string | null;
  close_time: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StationWithCapabilities extends Station {
  capabilities: Array<{ id: string; name: string }>;
  lane: { id: string; name: string; facility_id: string } | null;
}

export function useStations(laneId?: string) {
  return useQuery({
    queryKey: ['stations', laneId],
    queryFn: async () => {
      let query = supabase
        .from('stations' as any)
        .select(`
          *,
          station_capabilities(
            capability_id,
            capabilities(id, name)
          ),
          lane:lanes_new!lane_id(
            id,
            name,
            facility_id
          )
        `)
        .order('lane_id')
        .order('grid_position_y')
        .order('grid_position_x');

      if (laneId) {
        query = query.eq('lane_id', laneId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data.map((station: any) => ({
        ...station,
        capabilities: station.station_capabilities?.map((sc: any) => sc.capabilities).filter(Boolean) || [],
      })) as any as StationWithCapabilities[];
    },
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (station: Partial<Station>) => {
      const { data, error } = await supabase
        .from('stations' as any)
        .insert(station as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create station: ${error.message}`);
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Station> & { id: string }) => {
      const { data, error } = await supabase
        .from('stations' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update station: ${error.message}`);
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete station: ${error.message}`);
    },
  });
}

export function useAssignCapabilityToStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stationId, capabilityId }: { stationId: string; capabilityId: string }) => {
      const { error } = await supabase
        .from('station_capabilities' as any)
        .insert({ station_id: stationId, capability_id: capabilityId } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Capability assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign capability: ${error.message}`);
    },
  });
}

export function useRemoveCapabilityFromStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stationId, capabilityId }: { stationId: string; capabilityId: string }) => {
      const { error } = await supabase
        .from('station_capabilities' as any)
        .delete()
        .eq('station_id', stationId)
        .eq('capability_id', capabilityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Capability removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove capability: ${error.message}`);
    },
  });
}

// Library management hooks
export function useLibraryStations() {
  return useQuery({
    queryKey: ['library-stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations' as any)
        .select(`
          *,
          station_capabilities(
            capability_id,
            capabilities(id, name)
          )
        `)
        .is('lane_id', null)
        .order('name');

      if (error) throw error;
      
      return data.map((station: any) => ({
        ...station,
        capabilities: station.station_capabilities?.map((sc: any) => sc.capabilities).filter(Boolean) || [],
      })) as any as StationWithCapabilities[];
    },
  });
}

export function useAssignStationToLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      stationId, 
      laneId, 
      roomId, 
      gridX, 
      gridY 
    }: { 
      stationId: string; 
      laneId: string; 
      roomId?: string | null;
      gridX: number; 
      gridY: number;
    }) => {
      const { data, error } = await supabase
        .from('stations' as any)
        .update({ 
          lane_id: laneId,
          room_id: roomId || null,
          grid_position_x: gridX,
          grid_position_y: gridY
        })
        .eq('id', stationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['library-stations'] });
      toast.success('Station assigned to lane');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign station: ${error.message}`);
    },
  });
}

export function useUnassignStationFromLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationId: string) => {
      const { data, error } = await supabase
        .from('stations' as any)
        .update({ 
          lane_id: null,
          room_id: null,
          grid_position_x: 0,
          grid_position_y: 0
        })
        .eq('id', stationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['library-stations'] });
      toast.success('Station returned to library');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unassign station: ${error.message}`);
    },
  });
}
