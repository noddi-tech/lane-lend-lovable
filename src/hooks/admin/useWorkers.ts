import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_workers')
        .select('*')
        .order('first_name');

      if (error) throw error;
      return data as Worker[];
    },
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (worker: Partial<Worker>) => {
      const { data, error } = await supabase
        .from('service_workers')
        .insert(worker as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create worker: ${error.message}`);
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Worker> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_workers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update worker: ${error.message}`);
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_workers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Worker deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete worker: ${error.message}`);
    },
  });
}
