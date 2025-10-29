import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StorageLocation {
  id: string;
  lane_id: string | null;
  room_id: string | null;
  name: string;
  description: string | null;
  storage_type: 'general' | 'parts' | 'tools' | 'hazmat' | 'other';
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export function useStorageLocations(laneId?: string, roomId?: string) {
  return useQuery({
    queryKey: ['storage-locations', laneId, roomId],
    queryFn: async () => {
      let query = supabase
        .from('storage_locations' as any)
        .select('*')
        .order('name');

      if (laneId) {
        query = query.eq('lane_id', laneId);
      }
      if (roomId) {
        query = query.eq('room_id', roomId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as any as StorageLocation[];
    },
  });
}

export function useCreateStorageLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Partial<StorageLocation>) => {
      const { data, error } = await supabase
        .from('storage_locations' as any)
        .insert(location as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      toast.success('Storage location created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create storage location: ${error.message}`);
    },
  });
}

export function useUpdateStorageLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorageLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from('storage_locations' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      toast.success('Storage location updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update storage location: ${error.message}`);
    },
  });
}

export function useDeleteStorageLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('storage_locations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      toast.success('Storage location deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete storage location: ${error.message}`);
    },
  });
}

export function useLibraryStorageLocations() {
  return useQuery({
    queryKey: ['library-storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations' as any)
        .select('*')
        .is('lane_id', null)
        .is('room_id', null)
        .order('name');
      
      if (error) throw error;
      return data as any as StorageLocation[];
    },
  });
}
