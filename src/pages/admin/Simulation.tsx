import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Download } from 'lucide-react';

export default function Simulation() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Day Simulation</h1>
          <p className="text-muted-foreground mt-2">
            Simulate booking scenarios and test edge cases
          </p>
        </div>
        <Badge variant="outline">Sprint 7 - In Development</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Configuration</CardTitle>
          <CardDescription>
            Select a date and configure simulation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setIsRunning(!isRunning)}
              disabled={isRunning}
              size="lg"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Simulation
            </Button>
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Timeline</CardTitle>
          <CardDescription>Visual representation of bookings and capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            Timeline visualization will appear here when simulation is run
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Edge Case Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No alerts yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Metrics will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
