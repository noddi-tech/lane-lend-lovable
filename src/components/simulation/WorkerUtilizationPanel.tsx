import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle } from 'lucide-react';

interface WorkerUtilization {
  workerId: string;
  workerName: string;
  totalCapacity: number;
  totalBooked: number;
  utilization: number;
  shiftStart: string;
  shiftEnd: string;
}

interface WorkerUtilizationPanelProps {
  workers: WorkerUtilization[];
}

export default function WorkerUtilizationPanel({ workers }: WorkerUtilizationPanelProps) {
  if (!workers || workers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Worker Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No worker data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return 'text-destructive';
    if (utilization >= 80) return 'text-yellow-600';
    if (utilization < 30) return 'text-muted-foreground';
    return 'text-green-600';
  };

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 100) return { variant: 'destructive' as const, label: 'Overloaded' };
    if (utilization >= 80) return { variant: 'secondary' as const, label: 'High' };
    if (utilization < 30) return { variant: 'outline' as const, label: 'Low' };
    return { variant: 'default' as const, label: 'Optimal' };
  };

  // Sort workers by utilization (highest first)
  const sortedWorkers = [...workers].sort((a, b) => b.utilization - a.utilization);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Worker Breakdown ({workers.length} on shift)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedWorkers.map((worker) => {
          const badge = getUtilizationBadge(worker.utilization);
          const color = getUtilizationColor(worker.utilization);

          return (
            <div key={worker.workerId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{worker.workerName}</p>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {worker.shiftStart} - {worker.shiftEnd}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${color}`}>
                    {worker.utilization.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(worker.totalBooked / 60)}m / {Math.floor(worker.totalCapacity / 60)}m
                  </p>
                </div>
              </div>
              <Progress value={Math.min(worker.utilization, 100)} />
              {worker.utilization >= 100 && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Worker is overbooked by {Math.floor((worker.totalBooked - worker.totalCapacity) / 60)} minutes</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
