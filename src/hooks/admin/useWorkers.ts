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

export interface WorkerWithSkills extends Worker {
  skills: Array<{ id: string; name: string }>;
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_workers')
        .select(`
          *,
          worker_skills(
            skill_id,
            skills(id, name)
          )
        `)
        .order('first_name');

      if (error) throw error;
      
      return data.map(worker => ({
        ...worker,
        skills: worker.worker_skills?.map((ws: any) => ws.skills).filter(Boolean) || [],
      })) as WorkerWithSkills[];
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

export function useWorkerSkills(workerId: string) {
  return useQuery({
    queryKey: ['worker-skills', workerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worker_skills')
        .select('skill_id, skills(id, name)')
        .eq('worker_id', workerId);

      if (error) throw error;
      return data.map((ws: any) => ws.skills).filter(Boolean) as Array<{ id: string; name: string }>;
    },
    enabled: !!workerId,
  });
}

export function useAssignSkillToWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workerId, skillId }: { workerId: string; skillId: string }) => {
      const { error } = await supabase
        .from('worker_skills')
        .insert({ worker_id: workerId, skill_id: skillId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker-skills'] });
      toast.success('Skill assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign skill: ${error.message}`);
    },
  });
}

export function useRemoveSkillFromWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workerId, skillId }: { workerId: string; skillId: string }) => {
      const { error } = await supabase
        .from('worker_skills')
        .delete()
        .eq('worker_id', workerId)
        .eq('skill_id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker-skills'] });
      toast.success('Skill removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove skill: ${error.message}`);
    },
  });
}
