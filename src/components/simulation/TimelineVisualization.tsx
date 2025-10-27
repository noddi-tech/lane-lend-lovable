import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, Clock, MapPin } from 'lucide-react';

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

function getServiceAbbreviation(serviceName?: string): string {
  if (!serviceName) return '';
  return serviceName.split(' ').map(word => word[0]).join('').toUpperCase();
}

function getBookingGradient(status: string, utilization?: number): string {
  if (status === 'cancelled') 
    return 'bg-gradient-to-br from-gray-400 to-gray-500';
  
  if (utilization && utilization >= 100) 
    return 'bg-gradient-to-br from-red-500 to-red-600';
  
  if (utilization && utilization >= 80) 
    return 'bg-gradient-to-br from-yellow-500 to-orange-500';
  
  return 'bg-gradient-to-br from-green-500 to-green-600';
}

function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute.toString().padStart(2, '0')}`;
}

function getEndTime(startHour: number, startMinute: number, durationMinutes: number): string {
  const totalMinutes = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return formatTime(endHour, endMinute);
}

interface TimelineVisualizationProps {
  bookings: TimelineBooking[];
  lanes: Array<{ id: string; name: string }>;
}

export default function TimelineVisualization({ bookings, lanes }: TimelineVisualizationProps) {
  const workingHours = Array.from({ length: 10 }, (_, i) => 8 + i);

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
            <div className="w-40 flex-shrink-0" />
            <div className="flex-1 flex relative">
              {workingHours.map((hour) => (
                <div key={hour} className="flex-1 text-xs text-center text-muted-foreground relative">
                  {hour}:00
                  {/* Vertical grid line */}
                  <div className="absolute left-0 top-0 h-[500px] w-px bg-border/30 -translate-y-6" />
                </div>
              ))}
            </div>
          </div>

          {/* Lane rows */}
          {lanes.map((lane) => {
            const laneBookings = bookings.filter((b) => b.laneId === lane.id);

            return (
              <div key={lane.id} className="flex items-start py-3 border-b">
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="font-semibold text-base">{lane.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {laneBookings.length} booking{laneBookings.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex-1 relative h-20 bg-muted/20 rounded">
                  {laneBookings.map((booking) => {
                    const left = getBookingPosition(booking.startHour, booking.startMinute);
                    const width = getBookingWidth(booking.durationMinutes);
                    const gradient = getBookingGradient(booking.status, booking.utilizationPercent);
                    const startTime = formatTime(booking.startHour, booking.startMinute);
                    const endTime = getEndTime(booking.startHour, booking.startMinute, booking.durationMinutes);
                    const workerNames = booking.assignedWorkers?.map(w => w.workerName).join(', ') || 'No workers';

                    return (
                      <Popover key={booking.id}>
                        <PopoverTrigger asChild>
                          <div
                            className={`absolute h-full ${gradient} rounded-lg border-2 border-white/20 cursor-pointer hover:border-white/40 hover:shadow-xl hover:z-10 transition-all duration-200 flex flex-col justify-between p-2 gap-1 overflow-hidden`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                          >
                            {/* Header: Time + Duration Badge */}
                            <div className="flex items-center justify-between text-xs font-bold text-white">
                              <span>{startTime}-{endTime}</span>
                              <span className="bg-black/20 px-1.5 py-0.5 rounded">{booking.durationMinutes}m</span>
                            </div>
                            
                            {/* Service Name - Show if width > 8% */}
                            {width > 8 && (
                              <div className="text-sm font-semibold leading-tight truncate text-white">
                                {booking.serviceName || 'Service'}
                              </div>
                            )}
                            
                            {/* Worker - Show if width > 12% */}
                            {width > 12 && booking.assignedWorkers && booking.assignedWorkers.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-white">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {booking.assignedWorkers[0].workerName}
                                  {booking.assignedWorkers.length > 1 && ` +${booking.assignedWorkers.length - 1}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-3">
                            <div className="font-semibold text-base border-b pb-2">
                              {booking.serviceName || 'Service'}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{startTime} - {endTime} ({booking.durationMinutes} minutes)</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span>{booking.customerName || 'Customer'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{lane.name}</span>
                              </div>
                            </div>
                            
                            {booking.assignedWorkers && booking.assignedWorkers.length > 0 && (
                              <div className="border-t pt-2">
                                <div className="font-medium text-sm mb-1">Assigned Workers:</div>
                                <div className="space-y-1">
                                  {booking.assignedWorkers.map((worker) => (
                                    <div key={worker.workerId} className="text-sm flex items-center justify-between">
                                      <span>{worker.workerName}</span>
                                      <span className="text-muted-foreground">{Math.round(worker.allocatedSeconds / 60)}m</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="text-xs text-muted-foreground border-t pt-2">
                              Status: {booking.status}
                              {booking.utilizationPercent && ` | Utilization: ${booking.utilizationPercent.toFixed(1)}%`}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
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
