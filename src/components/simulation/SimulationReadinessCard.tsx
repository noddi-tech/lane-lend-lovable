import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock, Users, Layers, Calendar } from 'lucide-react';
import { useSimulationReadiness } from '@/hooks/admin/useSimulationReadiness';
import { format } from 'date-fns';

interface SimulationReadinessCardProps {
  selectedDate: Date | null;
}

export default function SimulationReadinessCard({ selectedDate }: SimulationReadinessCardProps) {
  const { data: readiness, isLoading } = useSimulationReadiness(selectedDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simulation Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Checking system status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) return null;

  const statusItems = [
    {
      icon: Layers,
      label: 'Lanes',
      status: readiness.hasLanes,
      detail: `${readiness.lanesCount} available`,
    },
    {
      icon: Users,
      label: 'Workers',
      status: readiness.hasWorkers,
      detail: `${readiness.workersCount} active`,
    },
    {
      icon: Clock,
      label: 'Worker Capacity',
      status: readiness.hasCapacity,
      detail: readiness.capacityCoverageStart && readiness.capacityCoverageEnd
        ? `${format(readiness.capacityCoverageStart, 'MMM d')} - ${format(readiness.capacityCoverageEnd, 'MMM d')}`
        : 'Not configured',
    },
    {
      icon: Calendar,
      label: 'Bookings for Selected Date',
      status: readiness.hasBookingsForDate,
      detail: selectedDate
        ? `${readiness.bookingsCount} bookings`
        : 'No date selected',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Simulation Readiness</CardTitle>
            <CardDescription>Check prerequisites before running</CardDescription>
          </div>
          <Badge variant={readiness.isReady ? 'default' : 'secondary'}>
            {readiness.isReady ? 'Ready' : 'Not Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.status ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.detail}</span>
            </div>
          ))}
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            {readiness.message}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
