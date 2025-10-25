import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BookingWithDetails } from '@/types/booking';

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          lane:lanes(name),
          booking_sales_items(
            sales_item:sales_items(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return bookings.map((booking: any) => ({
        ...booking,
        sales_items: booking.booking_sales_items.map((bsi: any) => bsi.sales_item),
      })) as BookingWithDetails[];
    },
  });
};
