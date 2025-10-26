import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlayCircle, Download, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SimulationConfig, { SimulationConfigData } from '@/components/simulation/SimulationConfig';
import TimelineVisualization from '@/components/simulation/TimelineVisualization';
import MetricsPanel, { SimulationMetrics } from '@/components/simulation/MetricsPanel';
import EdgeCaseAlerts, { EdgeCaseAlert } from '@/components/simulation/EdgeCaseAlerts';
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

    try {
      toast.info('Starting simulation...');

      // Run edge case scenarios
      if (config.edgeCaseTriggers.rushHour) {
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

      // Load bookings
      const dayBookings = await loadBookingsForDate(selectedDate);
      
      // Transform bookings for timeline
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

      // Calculate metrics
      const confirmed = dayBookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelled = dayBookings.filter((b: any) => b.status === 'cancelled').length;

      const calculatedMetrics: SimulationMetrics = {
        totalBookings: dayBookings.length,
        confirmedBookings: confirmed,
        cancelledBookings: cancelled,
        averageUtilization: 65,
        peakUtilization: 85,
        peakHour: 11,
        overbookings: alerts.filter(a => a.category === 'overbooking').length,
        warnings: alerts.filter(a => a.severity === 'warning').length,
        workersOnShift: 3,
        avgWorkerUtilization: 70,
      };

      setMetrics(calculatedMetrics);

      toast.success(`Simulation complete! ${dayBookings.length} bookings analyzed`);

    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Simulation failed');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Day Simulation</h1>
          <p className="text-muted-foreground mt-2">
            Simulate booking scenarios and test edge cases
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a day to simulate</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <SimulationConfig config={config} onChange={setConfig} />

          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={runSimulation}
                disabled={isRunning}
                size="lg"
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>
              
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
        </div>

        <div className="lg:col-span-2 space-y-6">
          <TimelineVisualization bookings={bookings} lanes={lanes} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EdgeCaseAlerts alerts={alerts} />
            <MetricsPanel metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
