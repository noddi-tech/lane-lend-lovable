import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useSystemReadiness } from '@/hooks/admin/useSystemReadiness';
import { cn } from '@/lib/utils';

interface WorkflowStepperProps {
  onNavigateToBaseData: () => void;
}

export default function WorkflowStepper({ onNavigateToBaseData }: WorkflowStepperProps) {
  const { data: readiness } = useSystemReadiness();

  const step1Complete =
    readiness?.lanes.ready &&
    readiness?.salesItems.ready &&
    readiness?.workers.ready &&
    readiness?.capacity.ready;

  const step2Complete = step1Complete && readiness?.capacity.contributionIntervalCount > 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {step1Complete ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Circle className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="w-px h-12 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={cn(
                      'font-semibold',
                      step1Complete ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Step 1: Seed Base Data
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Creates lanes, workers, skills, capabilities, and 35 days of worker capacity
                  </p>
                </div>
                {!step1Complete && (
                  <Button onClick={onNavigateToBaseData} variant="outline" size="sm">
                    Go to Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {step1Complete && (
                  <Button onClick={onNavigateToBaseData} variant="ghost" size="sm">
                    Re-seed
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {step2Complete ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Circle className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="w-px h-12 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-8">
              <h3
                className={cn(
                  'font-semibold',
                  step2Complete ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Step 2: Verify Capacity Coverage
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {readiness?.capacity.coverageStart && readiness?.capacity.coverageEnd
                  ? `Worker capacity: ${readiness.capacity.coverageStart.toLocaleDateString()} - ${readiness.capacity.coverageEnd.toLocaleDateString()}`
                  : 'No capacity coverage yet'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {step2Complete ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Circle className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={cn(
                  'font-semibold',
                  step2Complete ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Step 3: Generate Customers & Bookings
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {step2Complete
                  ? 'Ready! Configure options below and click Generate.'
                  : 'Complete steps 1-2 first'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
