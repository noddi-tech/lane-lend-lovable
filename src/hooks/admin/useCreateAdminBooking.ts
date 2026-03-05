import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdhocBookingInput {
  lane_id: string;
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  service_time_seconds: number;
  sales_item_ids?: string[];
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_registration?: string;
  customer_user_id?: string;
  admin_notes?: string;
}

interface ScheduledBookingInput {
  sales_item_ids: string[];
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  lane_id: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_registration?: string;
  customer_user_id?: string;
  admin_notes?: string;
}

export function useCreateAdhocBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdhocBookingInput) => {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          ...input,
          is_adhoc: true,
          admin_override: true,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Ad-hoc booking created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create booking: ${error.message}`);
    },
  });
}

export function useCreateScheduledBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScheduledBookingInput) => {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          ...input,
          admin_override: true,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast.success('Scheduled booking created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create booking: ${error.message}`);
    },
  });
}
