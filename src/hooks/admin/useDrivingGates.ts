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
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

export interface DrivingGateWithLanes extends DrivingGate {
  lanes: Array<{ id: string; name: string; position_order: number }>;
}

export function useDrivingGates() {
  return useQuery({
    queryKey: ['driving-gates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driving_gates' as any)
        .select(`
          *,
          lanes_new!driving_gate_id(
            id,
            name,
            position_order
          )
        `)
        .order('name');

      if (error) throw error;
      
      return data.map((gate: any) => ({
        ...gate,
        lanes: gate.lanes_new || [],
      })) as DrivingGateWithLanes[];
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
