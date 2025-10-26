import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lane {
  id: string;
  name: string;
  open_time: string;
  close_time: string;
  time_zone: string;
  closed_for_new_bookings_at: string | null;
  closed_for_cancellations_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaneWithCapabilities extends Lane {
  capabilities: Array<{ id: string; name: string }>;
}

export function useLanes() {
  return useQuery({
    queryKey: ['lanes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lanes')
        .select(`
          *,
          lane_capabilities(
            capability_id,
            capabilities(id, name)
          )
        `)
        .order('name');

      if (error) throw error;
      
      return data.map(lane => ({
        ...lane,
        capabilities: lane.lane_capabilities?.map((lc: any) => lc.capabilities).filter(Boolean) || [],
      })) as LaneWithCapabilities[];
    },
  });
}

export function useCreateLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lane: Partial<Lane>) => {
      const { data, error } = await supabase
        .from('lanes')
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
        .from('lanes')
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
        .from('lanes')
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

export function useLaneCapabilities(laneId: string) {
  return useQuery({
    queryKey: ['lane-capabilities', laneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lane_capabilities')
        .select('capability_id, capabilities(id, name)')
        .eq('lane_id', laneId);

      if (error) throw error;
      return data.map((lc: any) => lc.capabilities).filter(Boolean) as Array<{ id: string; name: string }>;
    },
    enabled: !!laneId,
  });
}

export function useAssignCapabilityToLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ laneId, capabilityId }: { laneId: string; capabilityId: string }) => {
      const { error } = await supabase
        .from('lane_capabilities')
        .insert({ lane_id: laneId, capability_id: capabilityId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      queryClient.invalidateQueries({ queryKey: ['lane-capabilities'] });
      toast.success('Capability assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign capability: ${error.message}`);
    },
  });
}

export function useRemoveCapabilityFromLane() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ laneId, capabilityId }: { laneId: string; capabilityId: string }) => {
      const { error } = await supabase
        .from('lane_capabilities')
        .delete()
        .eq('lane_id', laneId)
        .eq('capability_id', capabilityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lanes'] });
      queryClient.invalidateQueries({ queryKey: ['lane-capabilities'] });
      toast.success('Capability removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove capability: ${error.message}`);
    },
  });
}
