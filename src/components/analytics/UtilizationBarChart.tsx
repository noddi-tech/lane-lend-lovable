import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyState } from './EmptyState';

interface UtilizationBarChartProps {
  data: any[];
  title: string;
  dataKey: string;
  nameKey: string;
}

export function UtilizationBarChart({ data, title, dataKey, nameKey }: UtilizationBarChartProps) {
  const getColor = (value: number) => {
    if (value > 75) return 'hsl(0 84% 60%)'; // Red for high utilization
    if (value > 50) return 'hsl(38 92% 50%)'; // Yellow for medium
    return 'hsl(142 76% 36%)'; // Green for low
  };

  if (!data || data.length === 0) {
    return <EmptyState type="workers" />;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" domain={[0, 100]} className="text-xs" />
          <YAxis 
            dataKey={nameKey} 
            type="category" 
            width={120}
            className="text-xs"
          />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(1)}%`}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey={dataKey} radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry[dataKey])} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
