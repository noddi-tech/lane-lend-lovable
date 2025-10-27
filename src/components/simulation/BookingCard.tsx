import { User, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BookingCardProps {
  booking: {
    id: string;
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
  };
  index: number;
  laneName: string;
}

function getServiceColor(serviceName?: string): string {
  const name = serviceName?.toLowerCase() || '';
  
  // EV Services - Teal
  if (name.includes('ev') || name.includes('battery') || name.includes('electric') || name.includes('charging')) {
    return 'bg-gradient-to-br from-teal-500 to-teal-600 border-teal-400';
  }
  
  // Express Services - Blue
  if (name.includes('oil') || name.includes('tire') || name.includes('rotation') || name.includes('inspection')) {
    return 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400';
  }
  
  // Full Services - Purple
  if (name.includes('brake') || name.includes('transmission') || name.includes('engine') || name.includes('repair')) {
    return 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-400';
  }
  
  // Default - Slate
  return 'bg-gradient-to-br from-slate-500 to-slate-600 border-slate-400';
}

function getStatusOverlay(status: string, utilization?: number): string {
  const overlays = [];
  
  if (status === 'cancelled') {
    overlays.push('opacity-50 grayscale');
  }
  
  if (utilization && utilization > 100) {
    overlays.push('ring-2 ring-red-500 ring-offset-2 ring-offset-background');
  }
  
  return overlays.join(' ');
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function getEndTime(startHour: number, startMinute: number, durationMinutes: number): string {
  const totalMinutes = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return formatTime(endHour, endMinute);
}

export const BookingCard = ({ booking, index, laneName }: BookingCardProps) => {
  const startTime = formatTime(booking.startHour, booking.startMinute);
  const endTime = getEndTime(booking.startHour, booking.startMinute, booking.durationMinutes);
  const workerNames = booking.assignedWorkers?.map((w) => w.workerName).join(', ') || 'Unassigned';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <div
            className={`
              w-44 h-32 flex-shrink-0
              ${getServiceColor(booking.serviceName)}
              ${getStatusOverlay(booking.status, booking.utilizationPercent)}
              border-2 rounded-lg shadow-md
              hover:shadow-xl hover:scale-105
              transition-all duration-200
              p-3 flex flex-col justify-between
              text-white cursor-pointer
            `}
          >
            {/* Number Badge */}
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
              {index + 1}
            </div>

            {/* Time Range */}
            <div className="text-sm font-bold">
              {startTime}-{endTime}
            </div>

            {/* Service Name */}
            <div className="text-sm font-semibold truncate leading-tight">
              {booking.serviceName || 'Unknown Service'}
            </div>

            {/* Worker */}
            <div className="flex items-center gap-1 text-xs">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{workerNames}</span>
            </div>

            {/* Duration */}
            <div className="text-xs bg-black/30 rounded px-2 py-0.5 self-start font-medium">
              {booking.durationMinutes}m
            </div>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-base mb-1">{booking.serviceName || 'Unknown Service'}</h4>
            <p className="text-xs text-muted-foreground">Booking #{index + 1}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">
                  {startTime} - {endTime}
                </div>
                <div className="text-xs text-muted-foreground">
                  Duration: {booking.durationMinutes} minutes
                </div>
              </div>
            </div>

            {booking.customerName && (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Customer</div>
                  <div className="text-xs text-muted-foreground">{booking.customerName}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Assigned Workers</div>
                  {booking.assignedWorkers && booking.assignedWorkers.length > 0 ? (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {booking.assignedWorkers.map((worker, idx) => (
                        <div key={idx}>
                          {worker.workerName} ({Math.round(worker.allocatedSeconds / 60)}m)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">No workers assigned</div>
                  )}
              </div>
            </div>

            <div className="pt-2 border-t space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Lane:</span>
                <span className="font-medium">{laneName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{booking.status}</span>
              </div>
              {booking.utilizationPercent !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Utilization:</span>
                  <span className={`font-medium ${booking.utilizationPercent > 100 ? 'text-red-500' : ''}`}>
                    {booking.utilizationPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
