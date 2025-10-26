import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface EdgeCaseAlert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  category: 'overbooking' | 'capability' | 'worker' | 'timing' | 'cancellation';
  title: string;
  description: string;
  affectedBookings?: string[];
}

interface EdgeCaseAlertsProps {
  alerts: EdgeCaseAlert[];
}

export default function EdgeCaseAlerts({ alerts }: EdgeCaseAlertsProps) {
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityVariant = (severity: AlertSeverity): 'destructive' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
    }
  };

  const categoryLabels: Record<EdgeCaseAlert['category'], string> = {
    overbooking: 'Overbooking',
    capability: 'Capability',
    worker: 'Worker',
    timing: 'Timing',
    cancellation: 'Cancellation',
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Case Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No alerts yet</p>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');
  const infoAlerts = alerts.filter((a) => a.severity === 'info');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edge Case Alerts</CardTitle>
          <div className="flex gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive">{criticalAlerts.length} Critical</Badge>
            )}
            {warningAlerts.length > 0 && (
              <Badge variant="secondary">{warningAlerts.length} Warnings</Badge>
            )}
            {infoAlerts.length > 0 && (
              <Badge variant="outline">{infoAlerts.length} Info</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(alert.severity)}
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                      {categoryLabels[alert.category]}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{alert.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true })}</span>
                  {alert.affectedBookings && alert.affectedBookings.length > 0 && (
                    <span>{alert.affectedBookings.length} bookings affected</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
