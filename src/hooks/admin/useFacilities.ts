import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Facility {
  id: string;
  name: string;
  description: string | null;
  grid_width: number;
  grid_height: number;
  time_zone: string;
  created_at: string;
  updated_at: string;
}

export interface FacilityWithGates extends Facility {
  driving_gates: Array<{
    id: string;
    name: string;
    grid_position_x: number;
    grid_position_y: number;
    grid_width: number;
    grid_height: number;
  }>;
  lanes: Array<{
    id: string;
    name: string;
    lane_type: string;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  zones: Array<{
    id: string;
    name: string;
    zone_type: string;
  }>;
  outside_areas: Array<{
    id: string;
    name: string;
    area_type: string;
  }>;
}

export function useFacilities() {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facilities' as any)
        .select(`
          *,
          driving_gates:driving_gates!facility_id(
            id,
            name,
            grid_position_x,
            grid_position_y,
            grid_width,
            grid_height
          ),
          lanes:lanes_new!facility_id(
            id,
            name,
            lane_type
          ),
          rooms:rooms!facility_id(
            id,
            name,
            color
          ),
          zones:zones!facility_id(
            id,
            name,
            zone_type
          ),
          outside_areas:outside_areas!facility_id(
            id,
            name,
            area_type
          )
        `)
        .order('name');

      if (error) throw error;
      
      return data.map((facility: any) => ({
        ...facility,
        driving_gates: facility.driving_gates || [],
        lanes: facility.lanes || [],
        rooms: facility.rooms || [],
        zones: facility.zones || [],
        outside_areas: facility.outside_areas || [],
      })) as FacilityWithGates[];
    },
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (facility: Partial<Facility>) => {
      const { data, error } = await supabase
        .from('facilities' as any)
        .insert(facility as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Facility created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create facility: ${error.message}`);
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Facility> & { id: string }) => {
      const { data, error } = await supabase
        .from('facilities' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Facility updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update facility: ${error.message}`);
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('facilities' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Facility deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete facility: ${error.message}`);
    },
  });
}
