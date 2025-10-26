import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calendar, Settings, Play, FileDown } from 'lucide-react';

export default function SimulationGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          How to Use Simulation
        </CardTitle>
        <CardDescription>Follow these steps to run a successful simulation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <Calendar className="h-4 w-4" />
                Select a Date
              </div>
              <p className="text-sm text-muted-foreground">
                Choose a date with existing bookings (shown with green dots on calendar)
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <Settings className="h-4 w-4" />
                Configure Edge Cases (Optional)
              </div>
              <p className="text-sm text-muted-foreground">
                Enable scenarios like rush hour, cancellations, or capability mismatches
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <Play className="h-4 w-4" />
                Run Simulation
              </div>
              <p className="text-sm text-muted-foreground">
                Click "Run Simulation" to analyze the day and detect issues
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">4</span>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium mb-1">
                <FileDown className="h-4 w-4" />
                Review & Export
              </div>
              <p className="text-sm text-muted-foreground">
                Analyze the timeline, metrics, and alerts. Export report if needed.
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Tip:</strong> Edge case triggers help you test worst-case scenarios like
            rush hours, cancellations, and capability mismatches to ensure your system can handle them.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
