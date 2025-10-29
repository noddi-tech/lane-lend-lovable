import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OutsideArea {
  id: string;
  facility_id: string;
  name: string;
  description: string | null;
  area_type: 'parking' | 'grass' | 'container_storage' | 'loading_zone' | 'other';
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useOutsideAreas(facilityId?: string) {
  return useQuery({
    queryKey: ['outside-areas', facilityId],
    queryFn: async () => {
      let query = supabase
        .from('outside_areas' as any)
        .select('*')
        .order('name');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as any as OutsideArea[];
    },
  });
}

export function useCreateOutsideArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (area: Partial<OutsideArea>) => {
      const { data, error } = await supabase
        .from('outside_areas' as any)
        .insert(area as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outside-areas'] });
      toast.success('Outside area created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create outside area: ${error.message}`);
    },
  });
}

export function useUpdateOutsideArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OutsideArea> & { id: string }) => {
      const { data, error } = await supabase
        .from('outside_areas' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outside-areas'] });
      toast.success('Outside area updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update outside area: ${error.message}`);
    },
  });
}

export function useDeleteOutsideArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('outside_areas' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outside-areas'] });
      toast.success('Outside area deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete outside area: ${error.message}`);
    },
  });
}

export function useLibraryOutsideAreas() {
  return useQuery({
    queryKey: ['library-outside-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outside_areas' as any)
        .select('*')
        .is('facility_id', null)
        .order('name');
      
      if (error) throw error;
      return data as any as OutsideArea[];
    },
  });
}
