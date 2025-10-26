import { supabase } from '@/integrations/supabase/client';

export async function simulateRandomCancellations(
  date: Date,
  cancellationRate: number = 0.15
): Promise<{ cancelled: number }> {
  // Get bookings for the date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'confirmed')
    .gte('delivery_window_starts_at', startOfDay.toISOString())
    .lte('delivery_window_starts_at', endOfDay.toISOString());
  
  if (!bookings || bookings.length === 0) return { cancelled: 0 };
  
  // Randomly select bookings to cancel
  const toCancel = Math.floor(bookings.length * cancellationRate);
  const shuffled = [...bookings].sort(() => Math.random() - 0.5);
  const selectedForCancellation = shuffled.slice(0, toCancel);
  
  let cancelled = 0;
  for (const booking of selectedForCancellation) {
    try {
      // Use the cancel-booking edge function for proper capacity restoration
      await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: booking.id },
      });
      cancelled++;
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  }
  
  return { cancelled };
}
