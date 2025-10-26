import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BookingDate {
  date: string;
  count: number;
  displayDate: Date;
}

export const useBookingDates = () => {
  return useQuery({
    queryKey: ['bookingDates'],
    queryFn: async (): Promise<BookingDate[]> => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('delivery_window_starts_at');

      if (!bookings) return [];

      // Group by date
      const dateMap = new Map<string, number>();

      bookings.forEach(booking => {
        const date = new Date(booking.delivery_window_starts_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      });

      // Convert to array and sort
      return Array.from(dateMap.entries())
        .map(([dateStr, count]) => ({
          date: dateStr,
          count,
          displayDate: new Date(dateStr),
        }))
        .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
    },
    refetchInterval: 10000,
  });
};
