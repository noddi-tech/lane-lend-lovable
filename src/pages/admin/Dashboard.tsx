import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllBookings } from '@/hooks/admin/useAllBookings';
import { useLanes } from '@/hooks/admin/useLanes';
import { useWorkers } from '@/hooks/admin/useWorkers';
import { Calendar, Gauge, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: bookings } = useAllBookings();
  const { data: lanes } = useLanes();
  const { data: workers } = useWorkers();

  const stats = [
    {
      title: 'Total Bookings',
      value: bookings?.length || 0,
      icon: Calendar,
      description: 'All time bookings',
    },
    {
      title: 'Active Lanes',
      value: lanes?.filter(l => !l.closed_for_new_bookings_at).length || 0,
      icon: Gauge,
      description: 'Currently operational',
    },
    {
      title: 'Active Workers',
      value: workers?.filter(w => w.active).length || 0,
      icon: Users,
      description: 'Available staff',
    },
    {
      title: 'Today\'s Bookings',
      value: bookings?.filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.delivery_window_starts_at.startsWith(today);
      }).length || 0,
      icon: Clock,
      description: 'Scheduled for today',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your service operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            Recent bookings and activity will appear here...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
