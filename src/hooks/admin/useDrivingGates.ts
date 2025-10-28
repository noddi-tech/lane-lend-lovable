import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DrivingGate {
  id: string;
  name: string;
  description: string | null;
  time_zone: string;
  grid_width: number;
  grid_height: number;
  grid_position_x: number;
  grid_position_y: number;
  facility_id: string;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

export interface DrivingGateWithLanes extends DrivingGate {
  // Gates no longer contain lanes directly - lanes belong to facilities
}

export function useDrivingGates() {
  return useQuery({
    queryKey: ['driving-gates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driving_gates' as any)
        .select('*')
        .order('name');

      if (error) throw error;
      
      return data as any as DrivingGateWithLanes[];
    },
  });
}

export function useCreateDrivingGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gate: Partial<DrivingGate>) => {
      const { data, error } = await supabase
        .from('driving_gates' as any)
        .insert(gate as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driving-gates'] });
      toast.success('Driving gate created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create driving gate: ${error.message}`);
    },
  });
}

export function useUpdateDrivingGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DrivingGate> & { id: string }) => {
      const { data, error } = await supabase
        .from('driving_gates' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driving-gates'] });
      toast.success('Driving gate updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update driving gate: ${error.message}`);
    },
  });
}

export function useDeleteDrivingGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('driving_gates' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driving-gates'] });
      toast.success('Driving gate deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete driving gate: ${error.message}`);
    },
  });
}
