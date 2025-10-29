import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Zone {
  id: string;
  facility_id: string | null;
  room_id: string | null;
  name: string;
  description: string | null;
  zone_type: 'general' | 'storage' | 'work' | 'staging' | 'restricted';
  color: string;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  created_at: string;
  updated_at: string;
}

export function useZones(facilityId?: string, roomId?: string) {
  return useQuery({
    queryKey: ['zones', facilityId, roomId],
    queryFn: async () => {
      let query = supabase
        .from('zones' as any)
        .select('*')
        .order('name');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }
      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as any as Zone[];
    },
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: Partial<Zone>) => {
      const { data, error } = await supabase
        .from('zones' as any)
        .insert(zone as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create zone: ${error.message}`);
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Zone> & { id: string }) => {
      const { data, error } = await supabase
        .from('zones' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update zone: ${error.message}`);
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check for child elements before deleting
      const { data: storage } = await supabase
        .from('storage_locations' as any)
        .select('id')
        .eq('room_id', id)
        .limit(1);
      
      const { data: stations } = await supabase
        .from('stations')
        .select('id')
        .eq('room_id', id)
        .limit(1);
      
      if ((storage && storage.length > 0) || (stations && stations.length > 0)) {
        throw new Error('Cannot delete zone with child elements. Remove all storage locations and stations first.');
      }

      const { error } = await supabase
        .from('zones' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete zone: ${error.message}`);
    },
  });
}

export function useLibraryZones() {
  return useQuery({
    queryKey: ['library-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones' as any)
        .select('*')
        .is('facility_id', null)
        .is('room_id', null)
        .order('name');
      
      if (error) throw error;
      return data as any as Zone[];
    },
  });
}
