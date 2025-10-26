import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

interface PeakHoursHeatmapProps {
  data: Array<{ hour: number; dayOfWeek: number; bookingCount: number }>;
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.bookingCount), 1);
  }, [data]);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    return (count / maxCount) * 100;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted';
    if (intensity < 25) return 'bg-primary/20';
    if (intensity < 50) return 'bg-primary/40';
    if (intensity < 75) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  const getValue = (day: number, hour: number) => {
    return data.find(d => d.dayOfWeek === day && d.hour === hour)?.bookingCount || 0;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-xs">
            {/* Header row */}
            <div></div>
            {hours.map(hour => (
              <div key={hour} className="text-center text-muted-foreground">
                {hour}
              </div>
            ))}
            
            {/* Data rows */}
            {days.map((day, dayIndex) => (
              <div key={day} className="contents">
                <div className="flex items-center font-medium text-muted-foreground">
                  {day}
                </div>
                {hours.map(hour => {
                  const count = getValue(dayIndex, hour);
                  const intensity = getIntensity(count);
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`aspect-square ${getColor(intensity)} rounded hover:ring-2 hover:ring-primary transition-all cursor-pointer flex items-center justify-center`}
                      title={`${day} ${hour}:00 - ${count} bookings`}
                    >
                      {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-4 h-4 bg-primary/20 rounded"></div>
          <div className="w-4 h-4 bg-primary/40 rounded"></div>
          <div className="w-4 h-4 bg-primary/60 rounded"></div>
          <div className="w-4 h-4 bg-primary/80 rounded"></div>
        </div>
        <span>High</span>
      </div>
    </Card>
  );
}
