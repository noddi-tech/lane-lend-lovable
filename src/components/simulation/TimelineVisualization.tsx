import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingCard } from './BookingCard';

export interface TimelineBooking {
  id: string;
  laneId: string;
  laneName: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  customerName?: string;
  serviceName?: string;
  utilizationPercent?: number;
  assignedWorkers?: Array<{
    workerId: string;
    workerName: string;
    allocatedSeconds: number;
  }>;
}

interface TimelineVisualizationProps {
  bookings: TimelineBooking[];
  lanes: Array<{ id: string; name: string }>;
}

export default function TimelineVisualization({ bookings, lanes }: TimelineVisualizationProps) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Simulation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            No bookings to display. Run simulation to see timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Booking Timeline</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sequential view of all bookings by lane
            </p>
          </div>
          <div className="flex gap-2 text-xs flex-wrap justify-end">
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50 text-blue-400">
              Express
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/50 text-purple-400">
              Full Service
            </Badge>
            <Badge variant="outline" className="bg-teal-500/10 border-teal-500/50 text-teal-400">
              EV
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 border-red-500/50 text-red-400">
              Overbooked
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {lanes.map((lane) => {
            const laneBookings = bookings
              .filter((b) => b.laneId === lane.id)
              .sort((a, b) => {
                const aTime = a.startHour * 60 + a.startMinute;
                const bTime = b.startHour * 60 + b.startMinute;
                return aTime - bTime;
              });

            if (laneBookings.length === 0) return null;

            return (
              <div key={lane.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                {/* Lane Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{lane.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {laneBookings.length} booking{laneBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Booking Cards Row - Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  {laneBookings.map((booking, index) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      index={index} 
                      laneName={lane.name}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
