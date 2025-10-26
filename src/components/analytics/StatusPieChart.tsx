import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusPieChartProps {
  data: {
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = [
    { name: 'Confirmed', value: data.confirmed, color: 'hsl(var(--primary))' },
    { name: 'Completed', value: data.completed, color: 'hsl(142 76% 36%)' },
    { name: 'Cancelled', value: data.cancelled, color: 'hsl(0 84% 60%)' }
  ].filter(item => item.value > 0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      )}
    </Card>
  );
}
