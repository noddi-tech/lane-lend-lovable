import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayCircle, Download, Loader2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SimulationConfig, { SimulationConfigData } from '@/components/simulation/SimulationConfig';
import TimelineVisualization from '@/components/simulation/TimelineVisualization';
import MetricsPanel, { SimulationMetrics } from '@/components/simulation/MetricsPanel';
import WorkerUtilizationPanel from '@/components/simulation/WorkerUtilizationPanel';
import EdgeCaseAlerts, { EdgeCaseAlert } from '@/components/simulation/EdgeCaseAlerts';
import SimulationReadinessCard from '@/components/simulation/SimulationReadinessCard';
import AvailableDatesCard from '@/components/simulation/AvailableDatesCard';
import SimulationEmptyState from '@/components/simulation/SimulationEmptyState';
import SimulationGuide from '@/components/simulation/SimulationGuide';
import SimulationDebugPanel from '@/components/simulation/SimulationDebugPanel';
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
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  const [workerUtilization, setWorkerUtilization] = useState<any[]>([]);
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

  const loadTimeline = async () => {
    setIsRunning(true);
    setProgressMessage('Loading timeline...');

    try {
      toast.info('Loading timeline...');

      const dayBookings = await loadBookingsForDate(selectedDate);
      
      if (dayBookings.length === 0) {
        toast.error('No bookings found for selected date');
        setIsRunning(false);
        return;
      }

      // Transform bookings for timeline
      setProgressMessage('Loading worker assignments...');
      const timelineBookings = await transformBookingsForTimeline(dayBookings);
      setBookings(timelineBookings);

      // Calculate metrics
      const confirmed = dayBookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelled = dayBookings.filter((b: any) => b.status === 'cancelled').length;

      const calculatedMetrics: SimulationMetrics = {
        totalBookings: dayBookings.length,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
        averageUtilization: realMetrics?.averageUtilization || 0,
        peakUtilization: realMetrics?.peakUtilization || 0,
        peakHour: realMetrics?.peakHour || 8,
        overbookings: 0,
        warnings: 0,
        workersOnShift: realMetrics?.workersOnShift || 0,
        avgWorkerUtilization: realMetrics?.avgWorkerUtilization || 0,
      };

      setMetrics(calculatedMetrics);
      
      if (realMetrics?.workers && realMetrics.workers.length > 0) {
        setWorkerUtilization(realMetrics.workers);
      }
      
      setProgressMessage('');
      setActiveTab('results');
      toast.success(`Timeline loaded! ${dayBookings.length} bookings`);

    } catch (error) {
      console.error('Timeline load error:', error);
      toast.error('Failed to load timeline');
      setProgressMessage('');
    } finally {
      setIsRunning(false);
    }
  };

  const transformBookingsForTimeline = async (dayBookings: any[]) => {
    return await Promise.all(
      dayBookings.map(async (booking: any) => {
        const startTime = new Date(booking.delivery_window_starts_at);
        
        const { data: bookingIntervals } = await supabase
          .from('booking_intervals')
          .select('interval_id, booked_seconds')
          .eq('booking_id', booking.id);

        const workersMap = new Map();
        
        if (bookingIntervals && bookingIntervals.length > 0) {
          const intervalIds = bookingIntervals.map(bi => bi.interval_id);
          const { data: contributionData } = await supabase
            .from('contribution_intervals')
            .select(`
              contribution_id,
              interval_id,
              worker_contributions!inner(
                worker_id,
                lane_id,
                service_workers!inner(first_name, last_name)
              )
            `)
            .in('interval_id', intervalIds)
            .eq('worker_contributions.lane_id', booking.lane_id);

          if (contributionData && contributionData.length > 0) {
            contributionData.forEach((contrib: any) => {
              const worker = contrib.worker_contributions?.service_workers;
              if (worker) {
                const workerId = contrib.worker_contributions.worker_id;
                if (!workersMap.has(workerId)) {
                  workersMap.set(workerId, {
                    workerId,
                    workerName: `${worker.first_name} ${worker.last_name}`,
                    allocatedSeconds: 0
                  });
                }
                const intervalBooking = bookingIntervals.find(bi => bi.interval_id === contrib.interval_id);
                if (intervalBooking) {
                  workersMap.get(workerId).allocatedSeconds += intervalBooking.booked_seconds || 0;
                }
              }
            });
          }
        }

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
          assignedWorkers: Array.from(workersMap.values())
        };
      })
    );
  };

  const runSimulation = async () => {
    setIsRunning(true);
    setAlerts([]);
    setProgressMessage('Starting simulation...');

    try {
      toast.info('Starting simulation...');

      // Check booking count WITHOUT loading full data first
      setProgressMessage('Checking prerequisites...');
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('delivery_window_starts_at', startOfDay.toISOString())
        .lte('delivery_window_starts_at', endOfDay.toISOString());
      
      if (!count || count === 0) {
        toast.error('No bookings found for selected date');
        setIsRunning(false);
        return;
      }

      // Run edge case scenarios FIRST (they modify the database)
      if (config.edgeCaseTriggers.rushHour) {
        setProgressMessage('Simulating rush hour...');
        toast.info('Simulating rush hour...');
        const rushConfig = {
          startHour: config.timeDistribution.rushStart ? parseInt(config.timeDistribution.rushStart.split(':')[0]) : 10,
          endHour: config.timeDistribution.rushEnd ? parseInt(config.timeDistribution.rushEnd.split(':')[0]) : 12,
          concentrationPercent: 70,
        };
        const rushResult = await simulateRushHour(rushConfig, selectedDate, lanes.map(l => l.id));
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: rushResult.inRushHour > 0 ? 'warning' : 'info',
          category: 'timing',
          title: 'Rush Hour Simulation',
          description: rushResult.inRushHour > 0 
            ? `Created ${rushResult.inRushHour} bookings in rush window (${rushConfig.startHour}:00-${rushConfig.endHour}:00)`
            : 'Rush hour simulation attempted but no bookings created',
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
        
        const totalMinutes = extensions.reduce((sum, e) => sum + e.extensionMinutes, 0);
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: extensions.length > 0 ? 'info' : 'warning',
          category: 'timing',
          title: 'Extended Services Simulation',
          description: extensions.length > 0 
            ? `${extensions.length} bookings extended by total of ${totalMinutes} minutes`
            : 'No confirmed bookings available to extend',
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

      // Overbooking Detection scenario
      if (config.edgeCaseTriggers.overbooking) {
        setProgressMessage('Detecting overbooking scenarios...');
        toast.info('Analyzing capacity for overbooking...');
        
        const { data: busyIntervals } = await supabase
          .from('lane_interval_capacity')
          .select('interval_id, lane_id, total_booked_seconds, capacity_intervals!inner(starts_at)')
          .gte('capacity_intervals.starts_at', startOfDay.toISOString())
          .lt('capacity_intervals.starts_at', endOfDay.toISOString())
          .order('total_booked_seconds', { ascending: false })
          .limit(10);

        let overbookingCount = 0;
        const overbookedDetails: string[] = [];
        
        if (busyIntervals && busyIntervals.length > 0) {
          for (const interval of busyIntervals) {
            const { detectOverbooking } = await import('@/utils/simulation/overbookingScenario');
            const result = await detectOverbooking(interval.interval_id, interval.lane_id);
            
            if (result.isOverbooked) {
              overbookingCount++;
              const hour = new Date(interval.capacity_intervals.starts_at).getHours();
              overbookedDetails.push(`${hour}:00 (${result.utilizationPercent.toFixed(0)}%)`);
            }
          }
        }
        
        setAlerts(prev => [...prev, {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          severity: overbookingCount > 0 ? 'critical' : 'info',
          category: 'overbooking',
          title: 'Overbooking Detection',
          description: overbookingCount > 0
            ? `${overbookingCount} overbooked intervals detected: ${overbookedDetails.slice(0, 3).join(', ')}`
            : 'No overbooking detected in current bookings',
        }]);
      }

      // Worker Unavailability scenario
      if (config.edgeCaseTriggers.workerUnavailability) {
        setProgressMessage('Simulating worker unavailability...');
        toast.info('Simulating worker unavailability...');
        
        const { data: workers } = await supabase
          .from('service_workers')
          .select('id, first_name, last_name')
          .eq('active', true)
          .limit(10);
        
        if (workers && workers.length > 0) {
          const unavailableWorker = workers[Math.floor(Math.random() * workers.length)];
          
          const unavailableStart = new Date(selectedDate);
          unavailableStart.setHours(11, 0, 0, 0);
          const unavailableEnd = new Date(selectedDate);
          unavailableEnd.setHours(15, 0, 0, 0);
          
          // Actually remove worker from shifts
          const { removeWorkerFromShifts } = await import('@/utils/simulation/workerScenario');
          const impact = await removeWorkerFromShifts(
            unavailableWorker.id, 
            unavailableStart, 
            unavailableEnd
          );
          
          setAlerts(prev => [...prev, {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: impact.affectedBookings.length > 0 ? 'critical' : 'info',
            category: 'worker',
            title: 'Worker Unavailability Simulation',
            description: `${unavailableWorker.first_name} ${unavailableWorker.last_name} unavailable 11:00-15:00 (${impact.affectedIntervals} intervals removed, ${impact.affectedBookings.length} bookings affected)`,
            affectedBookings: impact.affectedBookings,
          }]);
        }
      }

      // NOW load bookings AFTER edge cases have modified the database
      setProgressMessage('Loading updated bookings...');
      const dayBookings = await loadBookingsForDate(selectedDate);
      
      // Transform bookings for timeline
      setProgressMessage('Loading worker assignments...');
      const timelineBookings = await transformBookingsForTimeline(dayBookings);
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
      
      // Calculate and set worker utilization from realMetrics
      if (realMetrics?.workers && realMetrics.workers.length > 0) {
        setWorkerUtilization(realMetrics.workers);
      }
      
      setProgressMessage('');
      
      // Auto-switch to results tab
      setActiveTab('results');

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'config' | 'results')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">1. Configuration</TabsTrigger>
          <TabsTrigger value="results">2. Results</TabsTrigger>
        </TabsList>

        {/* TAB 1: CONFIGURATION */}
        <TabsContent value="config" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select a date with existing bookings, configure edge cases, then run the simulation.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Date Selection */}
            <div className="space-y-6">
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
            </div>

            {/* Right Column: Configuration */}
            <div className="space-y-6">
              <SimulationConfig 
                config={config} 
                onChange={setConfig}
                selectedDate={selectedDate}
                currentBookings={readiness?.bookingsCount || 0}
              />

              {/* Run Button Card */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <Button
                            onClick={loadTimeline}
                            disabled={isRunning || !readiness?.isReady}
                            size="lg"
                            className="w-full"
                            variant="outline"
                          >
                            {isRunning && !alerts.length ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {progressMessage || 'Loading...'}
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                View Current Timeline
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={runSimulation}
                            disabled={isRunning || !readiness?.isReady || bookings.length === 0}
                            size="lg"
                            className="w-full"
                          >
                            {isRunning && alerts.length > 0 ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {progressMessage || 'Applying...'}
                              </>
                            ) : (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Apply Edge Cases
                              </>
                            )}
                          </Button>

                          {bookings.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center">
                              Load timeline first to enable edge cases
                            </p>
                          )}
                        </div>
                      </TooltipTrigger>
                      {!readiness?.isReady && (
                        <TooltipContent>
                          <p className="text-sm">{readiness?.message}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {!readiness?.isReady && (
                    <p className="text-sm text-muted-foreground text-center">
                      {readiness?.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              <SimulationGuide />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: RESULTS */}
        <TabsContent value="results" className="space-y-6">
          {!metrics ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Simulation Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Configure and run a simulation to see results here
                </p>
                <Button onClick={() => setActiveTab('config')}>
                  Go to Configuration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Timeline Visualization */}
              {showEmptyState ? (
                <SimulationEmptyState selectedDate={selectedDate} />
              ) : (
                <TimelineVisualization bookings={bookings} lanes={lanes} />
              )}

              {/* Metrics and Alerts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EdgeCaseAlerts alerts={alerts} />
                <MetricsPanel metrics={metrics} realMetrics={realMetrics} />
              </div>

              {/* Worker Utilization Panel */}
              {workerUtilization.length > 0 && (
                <WorkerUtilizationPanel workers={workerUtilization} />
              )}

              {/* Export Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleExportReport}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Simulation Report
                  </Button>
                </CardContent>
              </Card>

              {/* Debug Panel */}
              <SimulationDebugPanel 
                bookings={bookings} 
                alerts={alerts} 
                metrics={metrics} 
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
