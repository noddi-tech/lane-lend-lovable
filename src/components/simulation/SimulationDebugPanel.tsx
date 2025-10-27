import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';

interface SimulationDebugPanelProps {
  bookings: any[];
  alerts: any[];
  metrics: any;
}

export default function SimulationDebugPanel({ 
  bookings, 
  alerts, 
  metrics 
}: SimulationDebugPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Bug className="mr-2 h-4 w-4" />
              Show Debug Information
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <CardContent>
              <div className="text-xs font-mono bg-muted p-4 rounded space-y-4 max-h-96 overflow-auto">
                <div>
                  <h4 className="font-bold mb-2">📊 Bookings Loaded: {bookings.length}</h4>
                  <pre className="overflow-auto max-h-40 text-[10px]">
                    {JSON.stringify(bookings.slice(0, 2), null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">⚠️ Alerts: {alerts.length}</h4>
                  <pre className="overflow-auto max-h-40 text-[10px]">
                    {JSON.stringify(alerts, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-bold mb-2">📈 Metrics</h4>
                  <pre className="overflow-auto max-h-40 text-[10px]">
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
}
