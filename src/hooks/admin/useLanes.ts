import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lane {
  id: string;
  driving_gate_id: string;
  name: string;
  position_order: number;
  grid_position_y: number;
  grid_height: number;
  open_time: string | null;
  close_time: string | null;
  closed_for_new_bookings_at: string | null;
  closed_for_cancellations_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaneWithCapabilities extends Lane {
  driving_gate: { id: string; name: string } | null;
  stations: Array<{ id: string; name: string; station_type: string }>;
}

export function useLanes(drivingGateId?: string) {
  return useQuery({
    queryKey: ['lanes', drivingGateId],
    queryFn: async () => {
      let query = supabase
        .from('lanes_new' as any)
        .select(`
          *,
          driving_gate:driving_gates!driving_gate_id(id, name),
          stations!lane_id(id, name, station_type)
        `)
        .order('position_order');

      if (drivingGateId) {
        query = query.eq('driving_gate_id', drivingGateId);
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

// Lane capabilities are now managed at station level
// These functions are deprecated but kept for backward compatibility
