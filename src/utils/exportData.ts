import { format } from 'date-fns';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBookingsToCSV(bookings: any[], filename?: string) {
  const headers = [
    'Date',
    'Time',
    'Customer',
    'Lane',
    'Status',
    'Service Time (min)',
    'Vehicle',
    'Registration',
    'Notes'
  ];

  const rows = bookings.map(booking => [
    format(new Date(booking.delivery_window_starts_at), 'yyyy-MM-dd'),
    format(new Date(booking.delivery_window_starts_at), 'HH:mm'),
    booking.profiles?.full_name || booking.profiles?.email || 'N/A',
    booking.lanes?.name || 'N/A',
    booking.status,
    Math.round(booking.service_time_seconds / 60),
    `${booking.vehicle_make || ''} ${booking.vehicle_model || ''}`.trim() || 'N/A',
    booking.vehicle_registration || 'N/A',
    booking.customer_notes || ''
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const defaultFilename = `bookings_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}

export function exportBookingAnalyticsToCSV(analytics: any[], filename?: string) {
  const headers = [
    'Period',
    'Total Bookings',
    'Confirmed',
    'Completed',
    'Cancelled',
    'Cancellation Rate (%)',
    'Avg Service Time (min)',
    'Total Service Time (hours)'
  ];

  const rows = analytics.map(item => [
    item.period,
    item.totalBookings,
    item.confirmed,
    item.completed,
    item.cancelled,
    item.cancellationRate.toFixed(1),
    Math.round(item.avgServiceTime / 60),
    (item.totalServiceTime / 3600).toFixed(1)
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const defaultFilename = `booking_analytics_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}

export function exportWorkerPerformanceToCSV(workers: any[], filename?: string) {
  const headers = [
    'Worker Name',
    'Total Shifts',
    'Total Hours Available',
    'Hours Utilized',
    'Utilization Rate (%)',
    'Bookings Handled',
    'Idle Hours'
  ];

  const rows = workers.map(worker => [
    worker.workerName,
    worker.totalShifts,
    (worker.totalAvailableSeconds / 3600).toFixed(1),
    (worker.totalUtilizedSeconds / 3600).toFixed(1),
    worker.utilizationRate.toFixed(1),
    worker.bookingsHandled,
    (worker.idleSeconds / 3600).toFixed(1)
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const defaultFilename = `worker_performance_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}

export function exportCapacityReportToCSV(capacityData: any[], filename?: string) {
  const headers = [
    'Date',
    'Time',
    'Lane',
    'Total Capacity (min)',
    'Booked (min)',
    'Remaining (min)',
    'Utilization Rate (%)',
    'Status'
  ];

  const rows = capacityData.map(item => [
    item.date,
    item.startTime,
    item.laneName,
    Math.round(item.totalCapacity / 60),
    Math.round(item.bookedSeconds / 60),
    Math.round((item.totalCapacity - item.bookedSeconds) / 60),
    item.utilizationRate.toFixed(1),
    item.isOverbooking ? 'Overbooked' : item.isUnderUtilized ? 'Under-utilized' : 'Normal'
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const defaultFilename = `capacity_report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
}
