import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, Download, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SimulationConfig, { SimulationConfigData } from '@/components/simulation/SimulationConfig';
import TimelineVisualization from '@/components/simulation/TimelineVisualization';
import MetricsPanel, { SimulationMetrics } from '@/components/simulation/MetricsPanel';
import EdgeCaseAlerts, { EdgeCaseAlert } from '@/components/simulation/EdgeCaseAlerts';
import SimulationReadinessCard from '@/components/simulation/SimulationReadinessCard';
import AvailableDatesCard from '@/components/simulation/AvailableDatesCard';
import SimulationEmptyState from '@/components/simulation/SimulationEmptyState';
import SimulationGuide from '@/components/simulation/SimulationGuide';
import { DateBookingIndicator } from '@/components/simulation/DateBookingIndicator';
import SystemStatusBadge from '@/components/seed-data/SystemStatusBadge';
import { useSimulationReadiness } from '@/hooks/admin/useSimulationReadiness';
import { useRealMetrics } from '@/hooks/admin/useRealMetrics';
import { simulateRandomCancellations } from '@/utils/simulation/cancellationScenario';
import { detectCapabilityMismatches } from '@/utils/simulation/capabilityScenario';
import { detectOverbooking } from '@/utils/simulation/overbookingScenario';
import { simulateRushHour } from '@/utils/simulation/rushHourScenario';
import { simulateExtendedServices } from '@/utils/simulation/extendedServiceScenario';
import { generateSimulationReport, downloadReport } from '@/utils/simulation/reportGenerator';

export default function Simulation() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 1)));
  const [isRunning, setIsRunning] = useState(false);
  const [lanes, setLanes] = useState<Array<{ id: string; name: string }>>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [alerts, setAlerts] = useState<EdgeCaseAlert[]>([]);
  const [progressMessage, setProgressMessage] = useState('');
  const [config, setConfig] = useState<SimulationConfigData>({
    customerVolume: { mode: 'normal', multiplier: 1.0 },
    timeDistribution: { mode: 'realistic' },
    edgeCaseTriggers: {
      overbooking: false,
      capabilityMismatch: false,
      workerUnavailability: false,
      extendedServices: false,
      lastMinuteCancellations: false,
      rushHour: false,
    },
  });

  const { data: readiness } = useSimulationReadiness(selectedDate);
  const { data: realMetrics } = useRealMetrics(selectedDate);

  useEffect(() => {
    loadLanes();
  }, []);

  const loadLanes = async () => {
    const { data } = await supabase.from('lanes').select('id, name');
    if (data) setLanes(data);
  };

  const loadBookingsForDate = async (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        lane:lanes(id, name),
        booking_sales_items(sales_item:sales_items(name))
      `)
      .gte('delivery_window_starts_at', startOfDay.toISOString())
      .lte('delivery_window_starts_at', endOfDay.toISOString());

    return data || [];
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setAlerts([]);
    setMetrics(null);
    setProgressMessage('Starting simulation...');

    try {
      toast.info('Starting simulation...');

      // Load bookings first to check count
      setProgressMessage('Loading bookings...');
      const dayBookings = await loadBookingsForDate(selectedDate);
      
      if (dayBookings.length === 0) {
        toast.error('No bookings found for selected date');
        setIsRunning(false);
        return;
      }

      // Run edge case scenarios
      if (config.edgeCaseTriggers.rushHour) {
        setProgressMessage('Simulating rush hour...');
        toast.info('Simulating rush hour...');
        const rushConfig = {
          startHour: config.timeDistribution.rushStart ? parseInt(config.timeDistribution.rushStart.split(':')[0]) : 10,
          endHour: config.timeDistribution.rushEnd ? parseInt(config.timeDistribution.rushEnd.split(':')[0]) : 12,
          concentrationPercent: 70,
        };
        await simulateRushHour(rushConfig, selectedDate, lanes.map(l => l.id));
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: 'warning',
          category: 'timing',
          title: 'Rush Hour Simulation Complete',
          description: '70% of bookings concentrated in 2-hour window',
        }]);
      }

      if (config.edgeCaseTriggers.lastMinuteCancellations) {
        setProgressMessage('Simulating cancellations...');
        toast.info('Simulating cancellations...');
        const { cancelled } = await simulateRandomCancellations(selectedDate, 0.15);
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: 'warning',
          category: 'cancellation',
          title: 'Cancellations Simulated',
          description: `${cancelled} bookings cancelled randomly`,
        }]);
      }

      if (config.edgeCaseTriggers.extendedServices) {
        setProgressMessage('Simulating extended services...');
        toast.info('Simulating extended services...');
        const extensions = await simulateExtendedServices(selectedDate, 0.15);
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: 'info',
          category: 'timing',
          title: 'Services Extended',
          description: `${extensions.length} bookings extended by 30-60 minutes`,
        }]);
      }

      if (config.edgeCaseTriggers.capabilityMismatch) {
        setProgressMessage('Detecting capability mismatches...');
        toast.info('Detecting capability mismatches...');
        const mismatches = await detectCapabilityMismatches();
        
        if (mismatches.length > 0) {
          setAlerts(prev => [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: 'critical',
            category: 'capability',
            title: 'Capability Mismatches Detected',
            description: `${mismatches.length} bookings have missing capabilities`,
            affectedBookings: mismatches.map(m => m.bookingId),
          }]);
        }
      }

      // Transform bookings for timeline (already loaded earlier)
      setProgressMessage('Calculating metrics...');
      const timelineBookings = dayBookings.map((booking: any) => {
        const startTime = new Date(booking.delivery_window_starts_at);
        return {
          id: booking.id,
          laneId: booking.lane_id,
          laneName: booking.lane?.name || 'Unknown',
          startHour: startTime.getHours(),
          startMinute: startTime.getMinutes(),
          durationMinutes: Math.floor(booking.service_time_seconds / 60),
          status: booking.status,
          customerName: 'Customer',
          serviceName: booking.booking_sales_items?.[0]?.sales_item?.name || 'Service',
        };
      });

      setBookings(timelineBookings);

      // Calculate metrics using real data
      const confirmed = dayBookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelled = dayBookings.filter((b: any) => b.status === 'cancelled').length;

      const calculatedMetrics: SimulationMetrics = {
        totalBookings: dayBookings.length,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
        averageUtilization: realMetrics?.averageUtilization || 0,
        peakUtilization: realMetrics?.peakUtilization || 0,
        peakHour: realMetrics?.peakHour || 8,
        overbookings: alerts.filter(a => a.category === 'overbooking').length,
        warnings: alerts.filter(a => a.severity === 'warning').length,
        workersOnShift: realMetrics?.workersOnShift || 0,
        avgWorkerUtilization: realMetrics?.avgWorkerUtilization || 0,
      };

      setMetrics(calculatedMetrics);
      setProgressMessage('');

      toast.success(`Simulation complete! ${dayBookings.length} bookings analyzed`);

    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Simulation failed');
      setProgressMessage('');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportReport = () => {
    if (!metrics) {
      toast.error('Run simulation first');
      return;
    }

    const report = generateSimulationReport({
      bookings,
      alerts,
      metrics,
      date: selectedDate,
      edgeCases: config.edgeCaseTriggers,
    });

    downloadReport(report);
    toast.success('Report downloaded');
  };

  const showEmptyState = !readiness?.hasBookingsForDate && selectedDate;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Day Simulation</h1>
            <SystemStatusBadge />
          </div>
          <p className="text-muted-foreground mt-2">
            Simulate booking scenarios and test edge cases
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Select a date with existing bookings to run simulations and analyze capacity, utilization, and edge cases.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SimulationReadinessCard selectedDate={selectedDate} />

          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a day to simulate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border pointer-events-auto"
                components={{
                  DayContent: DateBookingIndicator,
                }}
              />
              {readiness?.hasBookingsForDate && (
                <Alert>
                  <AlertDescription className="text-sm">
                    {readiness.bookingsCount} bookings available for simulation
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <AvailableDatesCard onSelectDate={setSelectedDate} />

          <SimulationConfig 
            config={config} 
            onChange={setConfig}
            selectedDate={selectedDate}
            currentBookings={readiness?.bookingsCount || 0}
          />

          <Card>
            <CardContent className="pt-6 space-y-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={runSimulation}
                        disabled={isRunning || !readiness?.isReady}
                        size="lg"
                        className="w-full"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {progressMessage || 'Running...'}
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Run Simulation
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!readiness?.isReady && (
                    <TooltipContent>
                      <p className="text-sm">{readiness?.message}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleExportReport}
                disabled={!metrics}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </CardContent>
          </Card>

          <SimulationGuide />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showEmptyState ? (
            <SimulationEmptyState selectedDate={selectedDate} />
          ) : (
            <TimelineVisualization bookings={bookings} lanes={lanes} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EdgeCaseAlerts alerts={alerts} />
            <MetricsPanel metrics={metrics} realMetrics={realMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
