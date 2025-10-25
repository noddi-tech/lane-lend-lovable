import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminBooking {
  id: string;
  user_id: string;
  lane_id: string;
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  service_time_seconds: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_registration: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  lanes?: {
    name: string;
  };
}

export function useAllBookings(filters?: {
  status?: string;
  laneId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles (full_name, email, phone),
          lanes (name)
        `)
        .order('delivery_window_starts_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.laneId) {
        query = query.eq('lane_id', filters.laneId);
      }

      if (filters?.startDate) {
        query = query.gte('delivery_window_starts_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('delivery_window_ends_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any;
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (adminNotes !== undefined) {
        updates.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Booking updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update booking: ${error.message}`);
    },
  });
}
