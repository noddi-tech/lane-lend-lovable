import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight } from 'lucide-react';

interface EmptyStateCardProps {
  onGetStarted: () => void;
  onQuickStart?: () => void;
}

export default function EmptyStateCard({ onGetStarted, onQuickStart }: EmptyStateCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-12 pb-12 text-center">
        <Rocket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          You haven't set up any test data yet. To generate customers and bookings, you need:
        </p>
        <div className="grid gap-2 text-left max-w-sm mx-auto mb-6">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-medium">Lanes</div>
              <div className="text-sm text-muted-foreground">
                Where services are performed
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-medium">Workers</div>
              <div className="text-sm text-muted-foreground">
                Who provide services
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-medium">Worker Capacity</div>
              <div className="text-sm text-muted-foreground">
                Schedule and availability
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              4
            </div>
            <div>
              <div className="font-medium">Active Sales Items</div>
              <div className="text-sm text-muted-foreground">
                Services to offer
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={onGetStarted} size="lg">
            Go to Setup Tab
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {onQuickStart && (
            <Button onClick={onQuickStart} variant="outline" size="lg">
              <Rocket className="mr-2 h-4 w-4" />
              Quick Start
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
