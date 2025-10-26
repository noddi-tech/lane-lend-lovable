import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react';

export interface SimulationMetrics {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  averageUtilization: number;
  peakUtilization: number;
  peakHour: number;
  overbookings: number;
  warnings: number;
  workersOnShift: number;
  avgWorkerUtilization: number;
}

interface MetricsPanelProps {
  metrics: SimulationMetrics | null;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Real-time Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Run simulation to see metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{metrics.totalBookings}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold">{metrics.averageUtilization.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Utilization</p>
                <p className="text-2xl font-bold">{metrics.peakUtilization.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">at {metrics.peakHour}:00</p>
              </div>
              <Badge variant={metrics.peakUtilization >= 100 ? 'destructive' : 'default'}>
                {metrics.peakUtilization >= 100 ? 'Overbooked' : 'OK'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workers On Shift</p>
                <p className="text-2xl font-bold">{metrics.workersOnShift}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issues Detected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Overbookings</span>
            </div>
            <Badge variant={metrics.overbookings > 0 ? 'destructive' : 'outline'}>
              {metrics.overbookings}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Warnings</span>
            </div>
            <Badge variant={metrics.warnings > 0 ? 'secondary' : 'outline'}>
              {metrics.warnings}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Confirmed</span>
            </div>
            <Badge variant="outline">{metrics.confirmedBookings}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Cancelled</span>
            </div>
            <Badge variant="outline">{metrics.cancelledBookings}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Worker Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Utilization</span>
              <span className="font-medium">{metrics.avgWorkerUtilization.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.avgWorkerUtilization} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
