import { supabase } from '@/integrations/supabase/client';

export interface RushHourConfig {
  startHour: number;
  endHour: number;
  concentrationPercent: number;
}

export async function simulateRushHour(
  config: RushHourConfig,
  date: Date,
  laneIds: string[]
): Promise<{ totalBookings: number; inRushHour: number }> {
  const { data: salesItems } = await supabase
    .from('sales_items')
    .select('*')
    .eq('active', true)
    .limit(3);

  if (!salesItems || salesItems.length === 0) {
    return { totalBookings: 0, inRushHour: 0 };
  }

  const rushStartTime = new Date(date);
  rushStartTime.setHours(config.startHour, 0, 0, 0);
  
  const rushEndTime = new Date(date);
  rushEndTime.setHours(config.endHour, 0, 0, 0);

  const totalBookingsTarget = 30;
  const rushBookingsCount = Math.floor(totalBookingsTarget * (config.concentrationPercent / 100));

  let inRushHour = 0;

  for (let i = 0; i < rushBookingsCount; i++) {
    const randomMinutes = Math.floor(Math.random() * (config.endHour - config.startHour) * 60);
    const bookingTime = new Date(rushStartTime);
    bookingTime.setMinutes(bookingTime.getMinutes() + randomMinutes);

    const windowStart = new Date(bookingTime);
    const windowEnd = new Date(bookingTime);
    windowEnd.setHours(windowEnd.getHours() + 1);

    const randomLane = laneIds[Math.floor(Math.random() * laneIds.length)];
    const randomSalesItem = salesItems[Math.floor(Math.random() * salesItems.length)];

    try {
      await supabase.functions.invoke('create-booking', {
        body: {
          lane_id: randomLane,
          delivery_window_starts_at: windowStart.toISOString(),
          delivery_window_ends_at: windowEnd.toISOString(),
          sales_item_ids: [randomSalesItem.id],
          vehicle_make: 'Toyota',
          vehicle_model: 'Corolla',
          vehicle_year: 2020,
        },
      });
      console.log(`✅ Created rush hour booking at ${bookingTime.toLocaleTimeString()}`);
      inRushHour++;
    } catch (error) {
      console.error('Failed to create rush hour booking:', error);
    }
  }

  console.log(`📊 Rush hour: Created ${inRushHour}/${rushBookingsCount} bookings between ${config.startHour}:00-${config.endHour}:00`);
  return { totalBookings: rushBookingsCount, inRushHour };
}
