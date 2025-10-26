import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSystemReadiness } from '@/hooks/admin/useSystemReadiness';
import { format } from 'date-fns';

export default function PrerequisitesCard() {
  const { data: readiness, isLoading } = useSystemReadiness();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!readiness) return null;

  const StatusIcon = ({ ready }: { ready: boolean }) =>
    ready ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {readiness.overallReady ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          System Readiness
        </CardTitle>
        <CardDescription>
          Prerequisites for generating customers and bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon ready={readiness.lanes.ready} />
              <span className="font-medium">Lanes</span>
            </div>
            <Badge variant={readiness.lanes.ready ? 'default' : 'secondary'}>
              {readiness.lanes.count} available
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon ready={readiness.salesItems.ready} />
              <span className="font-medium">Sales Items (Services)</span>
            </div>
            <Badge variant={readiness.salesItems.ready ? 'default' : 'secondary'}>
              {readiness.salesItems.count} active
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon ready={readiness.workers.ready} />
              <span className="font-medium">Workers</span>
            </div>
            <Badge variant={readiness.workers.ready ? 'default' : 'secondary'}>
              {readiness.workers.count} assigned
            </Badge>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <StatusIcon ready={readiness.capacity.ready} />
              <div>
                <div className="font-medium">Worker Capacity</div>
                {readiness.capacity.coverageStart && readiness.capacity.coverageEnd && (
                  <div className="text-sm text-muted-foreground">
                    {format(readiness.capacity.coverageStart, 'MMM d')} -{' '}
                    {format(readiness.capacity.coverageEnd, 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
            <Badge variant={readiness.capacity.ready ? 'default' : 'secondary'}>
              {readiness.capacity.contributionIntervalCount} intervals
            </Badge>
          </div>
        </div>

        <Alert variant={readiness.capacity.ready ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{readiness.capacity.recommendation}</AlertDescription>
        </Alert>

        {!readiness.overallReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Go to the "Setup: Lanes & Workers" tab and click
              "Seed Base Data" to create the foundation for booking generation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
