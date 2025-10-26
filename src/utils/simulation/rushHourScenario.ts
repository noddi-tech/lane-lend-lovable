export interface RushHourConfig {
  startHour: number;
  endHour: number;
  concentrationPercent: number; // % of daily bookings in this window
}

export async function simulateRushHour(
  config: RushHourConfig,
  date: Date
): Promise<{ totalBookings: number; inRushHour: number }> {
  // Placeholder for rush hour simulation logic
  return { totalBookings: 0, inRushHour: 0 };
}
