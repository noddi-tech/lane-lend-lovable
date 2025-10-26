import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { EmptyState } from './EmptyState';

interface BookingsTrendChartProps {
  data: any[];
  groupBy: 'day' | 'week' | 'month';
}

export function BookingsTrendChart({ data, groupBy }: BookingsTrendChartProps) {
  const formatXAxis = (value: string) => {
    try {
      const date = parseISO(value);
      if (groupBy === 'day') return format(date, 'MMM d');
      if (groupBy === 'week') return format(date, 'MMM d');
      return format(date, 'MMM yyyy');
    } catch {
      return value;
    }
  };

  const hasData = data && data.some(item => item.totalBookings > 0);

  if (!hasData) {
    return <EmptyState type="bookings" />;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Bookings Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="period" 
            tickFormatter={formatXAxis}
            className="text-xs"
          />
          <YAxis className="text-xs" />
          <Tooltip 
            labelFormatter={formatXAxis}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="confirmed" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Confirmed"
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="hsl(142 76% 36%)" 
            strokeWidth={2}
            name="Completed"
          />
          <Line 
            type="monotone" 
            dataKey="cancelled" 
            stroke="hsl(0 84% 60%)" 
            strokeWidth={2}
            name="Cancelled"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
