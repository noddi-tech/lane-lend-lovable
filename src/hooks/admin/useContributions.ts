import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkerContribution {
  id: string;
  worker_id: string;
  lane_id: string;
  station_id: string;
  starts_at: string;
  ends_at: string;
  available_seconds: number;
  travel_factor: number;
  performance_factor: number;
  created_at: string;
  updated_at: string;
}

export interface ContributionWithDetails extends WorkerContribution {
  worker: {
    id: string;
    first_name: string;
    last_name: string;
  };
  lane: {
    id: string;
    name: string;
  };
}

export interface ContributionFilters {
  workerId?: string;
  laneId?: string;
  startDate?: string;
  endDate?: string;
}

export function useContributions(filters?: ContributionFilters) {
  return useQuery({
    queryKey: ['contributions', filters],
    queryFn: async () => {
      let query = supabase
        .from('worker_contributions')
        .select(`
          *,
          service_workers!worker_id(id, first_name, last_name),
          lanes!lane_id(id, name)
        `)
        .order('starts_at', { ascending: false });

      if (filters?.workerId) {
        query = query.eq('worker_id', filters.workerId);
      }
      if (filters?.laneId) {
        query = query.eq('lane_id', filters.laneId);
      }
      if (filters?.startDate) {
        query = query.gte('starts_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('ends_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(contrib => ({
        ...contrib,
        worker: contrib.service_workers,
        lane: contrib.lanes,
      })) as ContributionWithDetails[];
    },
  });
}

export function useCreateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contribution: Omit<WorkerContribution, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('worker_contributions')
        .insert([contribution])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Shift created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create shift: ${error.message}`);
    },
  });
}

export function useUpdateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<WorkerContribution> & { id: string }) => {
      const { data, error } = await supabase
        .from('worker_contributions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Shift updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update shift: ${error.message}`);
    },
  });
}

export function useDeleteContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('worker_contributions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions'] });
      toast.success('Shift deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete shift: ${error.message}`);
    },
  });
}
