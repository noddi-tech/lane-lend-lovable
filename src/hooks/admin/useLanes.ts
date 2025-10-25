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

export function useLanes() {
  return useQuery({
    queryKey: ['lanes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lanes')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Lane[];
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
