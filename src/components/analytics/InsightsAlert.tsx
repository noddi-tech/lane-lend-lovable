import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { SystemInsight } from '@/types/analytics';

interface InsightsAlertProps {
  insights: SystemInsight[];
}

export function InsightsAlert({ insights }: InsightsAlertProps) {
  if (insights.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>All Systems Normal</AlertTitle>
        <AlertDescription>
          No capacity or operational issues detected in the selected time period. All lanes are operating within normal parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Alert 
          key={insight.id}
          variant={insight.type === 'critical' ? 'destructive' : 'default'}
        >
          {insight.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
          {insight.type === 'warning' && <AlertCircle className="h-4 w-4" />}
          {insight.type === 'info' && <Info className="h-4 w-4" />}
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription>
            <p>{insight.description}</p>
            {insight.affectedEntities.length > 0 && (
              <p className="mt-2 text-sm">
                Affected: {insight.affectedEntities.join(', ')}
              </p>
            )}
            {insight.recommendation && (
              <p className="mt-2 text-sm font-medium">
                Recommendation: {insight.recommendation}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
