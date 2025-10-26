import { supabase } from '@/integrations/supabase/client';

export interface ServiceExtension {
  bookingId: string;
  originalDuration: number;
  extendedDuration: number;
  extensionMinutes: number;
  cascadeEffect: {
    affectedBookings: string[];
    totalDelayMinutes: number;
  };
}

export async function simulateExtendedServices(
  date: Date,
  extensionRate: number = 0.15
): Promise<ServiceExtension[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, service_time_seconds, delivery_window_starts_at')
    .eq('status', 'confirmed')
    .gte('delivery_window_starts_at', startOfDay.toISOString())
    .lte('delivery_window_starts_at', endOfDay.toISOString())
    .order('delivery_window_starts_at', { ascending: true });

  if (!bookings || bookings.length === 0) return [];

  const toExtend = Math.floor(bookings.length * extensionRate);
  const shuffled = [...bookings].sort(() => Math.random() - 0.5);
  const selectedForExtension = shuffled.slice(0, toExtend);

  const extensions: ServiceExtension[] = [];

  for (const booking of selectedForExtension) {
    const extensionMinutes = 30 + Math.floor(Math.random() * 30);
    const extensionSeconds = extensionMinutes * 60;
    const originalDuration = booking.service_time_seconds;
    const extendedDuration = originalDuration + extensionSeconds;

    const { error } = await supabase
      .from('bookings')
      .update({ 
        service_time_seconds: extendedDuration,
        admin_notes: `Extended by ${extensionMinutes} minutes (simulation)` 
      })
      .eq('id', booking.id);

    if (!error) {
      extensions.push({
        bookingId: booking.id,
        originalDuration,
        extendedDuration,
        extensionMinutes,
        cascadeEffect: {
          affectedBookings: [],
          totalDelayMinutes: extensionMinutes,
        },
      });
    }
  }

  return extensions;
}
