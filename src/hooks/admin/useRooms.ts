import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Room {
  id: string;
  facility_id: string;
  name: string;
  description: string | null;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface RoomWithFacility extends Room {
  facility: { id: string; name: string } | null;
}

export function useRooms(facilityId?: string) {
  return useQuery({
    queryKey: ['rooms', facilityId],
    queryFn: async () => {
      let query = supabase
        .from('rooms' as any)
        .select(`
          *,
          facility:facilities!facility_id(id, name)
        `)
        .order('name');

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as any as RoomWithFacility[];
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (room: Partial<Room>) => {
      const { data, error } = await supabase
        .from('rooms' as any)
        .insert(room as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      const { data, error } = await supabase
        .from('rooms' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update room: ${error.message}`);
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check for child elements before deleting
      const { data: lanes } = await supabase
        .from('lanes_new' as any)
        .select('id')
        .eq('room_id', id)
        .limit(1);
      
      const { data: gates } = await supabase
        .from('driving_gates' as any)
        .select('id')
        .eq('room_id', id)
        .limit(1);
      
      const { data: stations } = await supabase
        .from('stations' as any)
        .select('id')
        .eq('room_id', id)
        .limit(1);
      
      if ((lanes && lanes.length > 0) || (gates && gates.length > 0) || (stations && stations.length > 0)) {
        throw new Error('Cannot delete room with child elements. Remove all lanes, gates, and stations first.');
      }

      const { error } = await supabase
        .from('rooms' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });
}

export function useLibraryRooms() {
  return useQuery({
    queryKey: ['library-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms' as any)
        .select('*')
        .is('facility_id', null)
        .order('name');
      
      if (error) throw error;
      return data as any as Room[];
    },
  });
}
