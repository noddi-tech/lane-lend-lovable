export interface SimulationReport {
  date: Date;
  summary: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageUtilization: number;
    peakUtilization: number;
    peakHour: number;
  };
  issues: {
    overbookings: number;
    capabilityMismatches: number;
    underUtilizedHours: number;
  };
  recommendations: string[];
  edgeCasesTriggered: {
    overbooking: boolean;
    rushHour: boolean;
    capabilityMismatch: boolean;
    cancellations: boolean;
    workerUnavailability: boolean;
    extendedServices: boolean;
  };
}

export function generateSimulationReport(data: {
  bookings: any[];
  alerts: any[];
  metrics: any;
  date: Date;
  edgeCases: any;
}): SimulationReport {
  const confirmed = data.bookings.filter((b) => b.status === 'confirmed').length;
  const cancelled = data.bookings.filter((b) => b.status === 'cancelled').length;
  const completed = data.bookings.filter((b) => b.status === 'completed').length;

  const criticalAlerts = data.alerts.filter((a) => a.severity === 'critical');
  const overbookings = criticalAlerts.filter((a) => a.category === 'overbooking').length;
  const capabilityMismatches = criticalAlerts.filter((a) => a.category === 'capability').length;

  const recommendations: string[] = [];

  if (data.metrics.peakUtilization >= 100) {
    recommendations.push('Add more workers during peak hours (${data.metrics.peakHour}:00)');
  }

  if (data.metrics.averageUtilization < 50) {
    recommendations.push('Consider reducing worker hours or accepting more bookings');
  }

  if (capabilityMismatches > 0) {
    recommendations.push('Review lane capabilities to match service demand');
  }

  if (cancelled > confirmed * 0.2) {
    recommendations.push('High cancellation rate - consider booking confirmation policies');
  }

  return {
    date: data.date,
    summary: {
      totalBookings: data.bookings.length,
      completedBookings: completed,
      cancelledBookings: cancelled,
      averageUtilization: data.metrics.averageUtilization || 0,
      peakUtilization: data.metrics.peakUtilization || 0,
      peakHour: data.metrics.peakHour || 9,
    },
    issues: {
      overbookings,
      capabilityMismatches,
      underUtilizedHours: 0,
    },
    recommendations,
    edgeCasesTriggered: data.edgeCases || {
      overbooking: false,
      rushHour: false,
      capabilityMismatch: false,
      cancellations: false,
      workerUnavailability: false,
      extendedServices: false,
    },
  };
}

export function exportReportAsCSV(report: SimulationReport): string {
  const lines = [
    'Simulation Report',
    `Date,${report.date.toISOString().split('T')[0]}`,
    '',
    'Summary',
    `Total Bookings,${report.summary.totalBookings}`,
    `Completed,${report.summary.completedBookings}`,
    `Cancelled,${report.summary.cancelledBookings}`,
    `Average Utilization,${report.summary.averageUtilization.toFixed(2)}%`,
    `Peak Utilization,${report.summary.peakUtilization.toFixed(2)}%`,
    `Peak Hour,${report.summary.peakHour}:00`,
    '',
    'Issues',
    `Overbookings,${report.issues.overbookings}`,
    `Capability Mismatches,${report.issues.capabilityMismatches}`,
    `Under-utilized Hours,${report.issues.underUtilizedHours}`,
    '',
    'Recommendations',
    ...report.recommendations.map((r) => `,"${r}"`),
  ];

  return 'data:text/csv;charset=utf-8,' + lines.join('\n');
}

export function downloadReport(report: SimulationReport) {
  const csv = exportReportAsCSV(report);
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', `simulation-report-${report.date.toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
