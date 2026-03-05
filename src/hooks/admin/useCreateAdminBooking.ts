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
      // Ad-hoc bookings insert directly, bypassing capacity system
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: input.customer_user_id || null,
          lane_id: input.lane_id,
          delivery_window_starts_at: input.delivery_window_starts_at,
          delivery_window_ends_at: input.delivery_window_ends_at,
          service_time_seconds: input.service_time_seconds,
          vehicle_make: input.vehicle_make,
          vehicle_model: input.vehicle_model,
          vehicle_year: input.vehicle_year,
          vehicle_registration: input.vehicle_registration,
          admin_notes: input.admin_notes,
          is_adhoc: true,
          status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Optionally link sales items
      if (input.sales_item_ids?.length && booking) {
        await supabase.from('booking_sales_items').insert(
          input.sales_item_ids.map(id => ({
            booking_id: booking.id,
            sales_item_id: id,
          }))
        );
      }

      return { booking_id: booking.id, status: 'confirmed', is_adhoc: true };
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
