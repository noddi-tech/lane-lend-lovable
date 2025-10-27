import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineBooking {
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
  const workingHours = Array.from({ length: 10 }, (_, i) => 8 + i);

  const getBookingColor = (status: string, utilization?: number) => {
    if (status === 'cancelled') return 'bg-gray-400';
    if (utilization && utilization >= 100) return 'bg-red-500';
    if (utilization && utilization >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBookingPosition = (startHour: number, startMinute: number) => {
    const totalMinutes = (startHour - 8) * 60 + startMinute;
    return (totalMinutes / 600) * 100;
  };

  const getBookingWidth = (durationMinutes: number) => {
    return (durationMinutes / 600) * 100;
  };

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
        <CardTitle className="flex items-center justify-between">
          <span>Simulation Timeline</span>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-green-500/20">
              &lt;80% Capacity
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/20">
              80-99% Capacity
            </Badge>
            <Badge variant="outline" className="bg-red-500/20">
              ≥100% Overbooked
            </Badge>
            <Badge variant="outline" className="bg-gray-400/20">
              Cancelled
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Time axis */}
          <div className="flex border-b pb-2 mb-4">
            <div className="w-32 flex-shrink-0" />
            <div className="flex-1 flex">
              {workingHours.map((hour) => (
                <div key={hour} className="flex-1 text-xs text-center text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Lane rows */}
          {lanes.map((lane) => {
            const laneBookings = bookings.filter((b) => b.laneId === lane.id);

            return (
              <div key={lane.id} className="flex items-center py-3 border-b">
                <div className="w-32 flex-shrink-0 font-medium text-sm truncate pr-2">
                  {lane.name}
                </div>
                <div className="flex-1 relative h-8 bg-muted/20 rounded">
                  {laneBookings.map((booking) => {
                    const left = getBookingPosition(booking.startHour, booking.startMinute);
                    const width = getBookingWidth(booking.durationMinutes);
                    const color = getBookingColor(booking.status, booking.utilizationPercent);

                    return (
                      <div
                        key={booking.id}
                        className={`absolute h-full ${color} rounded cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center justify-center text-xs text-white font-medium overflow-hidden`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                        title={`${booking.customerName || 'Customer'} - ${booking.serviceName || 'Service'}\n${booking.startHour}:${booking.startMinute.toString().padStart(2, '0')} (${booking.durationMinutes}m)${booking.assignedWorkers && booking.assignedWorkers.length > 0 ? `\nWorkers: ${booking.assignedWorkers.map(w => w.workerName).join(', ')}` : ''}`}
                      >
                        {width > 8 && (
                          <>
                            <span className="truncate px-1">
                              {booking.startHour}:{booking.startMinute.toString().padStart(2, '0')}
                            </span>
                            {booking.assignedWorkers && booking.assignedWorkers.length > 0 && width > 12 && (
                              <span className="truncate px-1 text-[10px] opacity-90">
                                {booking.assignedWorkers.map(w => w.workerName.split(' ').map(n => n[0]).join('')).join(',')}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
