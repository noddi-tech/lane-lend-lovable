export interface BookingAnalytics {
  period: string;
  totalBookings: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  cancellationRate: number;
  avgServiceTime: number;
  totalServiceTime: number;
}

export interface WorkerPerformance {
  workerId: string;
  workerName: string;
  totalShifts: number;
  totalAvailableSeconds: number;
  totalUtilizedSeconds: number;
  utilizationRate: number;
  bookingsHandled: number;
  idleSeconds: number;
}

export interface CapacityInsight {
  intervalId: string;
  date: string;
  startTime: string;
  endTime: string;
  laneId: string;
  laneName: string;
  totalCapacity: number;
  bookedSeconds: number;
  utilizationRate: number;
  isOverbooking: boolean;
  isUnderUtilized: boolean;
}

export interface PeakHourData {
  hour: number;
  dayOfWeek: number;
  bookingCount: number;
}

export interface SystemInsight {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'overbooking' | 'under-utilization' | 'capability-gap' | 'worker-skill';
  title: string;
  description: string;
  affectedEntities: string[];
  recommendation?: string;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface AnalyticsFilters extends DateRangeFilter {
  laneId?: string;
  workerId?: string;
  status?: string;
  groupBy?: 'day' | 'week' | 'month';
}
