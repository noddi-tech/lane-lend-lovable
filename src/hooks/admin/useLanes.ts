import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lane {
  id: string;
  facility_id: string | null;
  room_id: string | null;
  name: string;
  position_order: number;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  open_time: string | null;
  close_time: string | null;
  lane_type: 'service' | 'storage' | 'staging';
  closed_for_new_bookings_at: string | null;
  closed_for_cancellations_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaneWithCapabilities extends Lane {
  facility: { id: string; name: string } | null;
  stations: Array<{ id: string; name: string; station_type: string }>;
}

export function useLanes(facilityId?: string) {
  return useQuery({
    queryKey: ['lanes', facilityId],
    queryFn: async () => {
      let query = supabase
        .from('lanes_new' as any)
        .select(`
          *,
          facility:facilities!facility_id(id, name),
          stations!lane_id(id, name, station_type)
        `)
        .order('position_order');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as any as LaneWithCapabilities[];
    },
  });
}

export function useCreateLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lane: Partial<Lane>) => {
      const { data, error } = await supabase
        .from('lanes_new' as any)
        .insert(lane as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      toast.success('Lane created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create lane: ${error.message}`);
    },
  });
}

export function useUpdateLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lane> & { id: string }) => {
      const { data, error } = await supabase
        .from('lanes_new' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      toast.success('Lane updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update lane: ${error.message}`);
    },
  });
}

export function useDeleteLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lanes_new' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      toast.success('Lane deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete lane: ${error.message}`);
    },
  });
}

// Library management hooks
export function useLibraryLanes() {
  return useQuery({
    queryKey: ['library-lanes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lanes_new' as any)
        .select('*')
        .is('facility_id', null)
        .order('name');

      if (error) throw error;
      
      return data as any as Lane[];
    },
  });
}

export function useAssignLaneToFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      laneId, 
      facilityId, 
      roomId, 
      gridY,
      positionOrder
    }: { 
      laneId: string; 
      facilityId: string; 
      roomId?: string | null;
      gridY: number;
      positionOrder: number;
    }) => {
      const { data, error } = await supabase
        .from('lanes_new' as any)
        .update({ 
          facility_id: facilityId,
          room_id: roomId || null,
          grid_position_y: gridY,
          position_order: positionOrder
        })
        .eq('id', laneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      queryClient.invalidateQueries({ queryKey: ['library-lanes'] });
      toast.success('Lane assigned to facility');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign lane: ${error.message}`);
    },
  });
}

export function useUnassignLaneFromFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (laneId: string) => {
      const { data, error } = await supabase
        .from('lanes_new' as any)
        .update({ 
          facility_id: null,
          room_id: null,
          grid_position_y: 0,
          position_order: 0
        })
        .eq('id', laneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      queryClient.invalidateQueries({ queryKey: ['library-lanes'] });
      toast.success('Lane returned to library');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unassign lane: ${error.message}`);
    },
  });
}
