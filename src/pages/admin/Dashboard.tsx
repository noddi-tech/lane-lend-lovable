import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAllBookings } from '@/hooks/admin/useAllBookings';
import { useLanes } from '@/hooks/admin/useLanes';
import { useWorkers } from '@/hooks/admin/useWorkers';
import { useSkills } from '@/hooks/admin/useSkills';
import { useCapabilities } from '@/hooks/admin/useCapabilities';
import { useContributions } from '@/hooks/admin/useContributions';
import { Calendar, Gauge, Users, Clock, AlertTriangle, Award, Zap, TrendingUp } from 'lucide-react';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

export default function Dashboard() {
  const { data: bookings } = useAllBookings();
  const { data: lanes } = useLanes();
  const { data: workers } = useWorkers();
  const { data: skills } = useSkills();
  const { data: capabilities } = useCapabilities();
  
  // Get upcoming shifts (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const { data: upcomingContributions } = useContributions({
    startDate: startOfDay(today).toISOString(),
    endDate: endOfDay(nextWeek).toISOString(),
  });

  // Calculate warnings
  const workersWithoutSkills = workers?.filter(w => w.active && w.skills.length === 0) || [];
  const lanesWithoutStations = lanes?.filter(l => !l.closed_for_new_bookings_at && l.stations.length === 0) || [];

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

  const systemStats = [
    {
      title: 'Skills',
      value: skills?.length || 0,
      icon: Award,
      description: 'Total defined skills',
    },
    {
      title: 'Capabilities',
      value: capabilities?.length || 0,
      icon: Zap,
      description: 'Service capabilities',
    },
    {
      title: 'Upcoming Shifts',
      value: upcomingContributions?.length || 0,
      icon: TrendingUp,
      description: 'Next 7 days',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your service operations</p>
      </div>

      {/* Warnings */}
      {(workersWithoutSkills.length > 0 || lanesWithoutStations.length > 0) && (
        <div className="space-y-3">
          {workersWithoutSkills.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Workers Without Skills</AlertTitle>
              <AlertDescription>
                {workersWithoutSkills.length} active worker{workersWithoutSkills.length !== 1 ? 's' : ''} {workersWithoutSkills.length === 1 ? 'has' : 'have'} no skills assigned:{' '}
                {workersWithoutSkills.slice(0, 3).map(w => `${w.first_name} ${w.last_name}`).join(', ')}
                {workersWithoutSkills.length > 3 && ` and ${workersWithoutSkills.length - 3} more`}.
                Workers need skills to contribute capacity.
              </AlertDescription>
            </Alert>
          )}

          {lanesWithoutStations.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lanes Without Stations</AlertTitle>
              <AlertDescription>
                {lanesWithoutStations.length} active lane{lanesWithoutStations.length !== 1 ? 's' : ''} {lanesWithoutStations.length === 1 ? 'has' : 'have'} no stations assigned:{' '}
                {lanesWithoutStations.slice(0, 3).map(l => l.name).join(', ')}
                {lanesWithoutStations.length > 3 && ` and ${lanesWithoutStations.length - 3} more`}.
                Lanes need stations with capabilities to accept bookings.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Main Stats */}
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

      {/* System Configuration Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {systemStats.map((stat) => (
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

      {/* Upcoming Shifts */}
      {upcomingContributions && upcomingContributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingContributions.slice(0, 5).map((contrib) => (
                <div key={contrib.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">
                      {contrib.worker.first_name} {contrib.worker.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contrib.lane.name} • {format(new Date(contrib.starts_at), 'MMM d, HH:mm')} - {format(new Date(contrib.ends_at), 'HH:mm')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {Math.floor(contrib.available_seconds / 3600)}h {Math.floor((contrib.available_seconds % 3600) / 60)}m
                  </Badge>
                </div>
              ))}
              {upcomingContributions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {upcomingContributions.length - 5} more shifts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">Booking #{booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.delivery_window_starts_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">
              No bookings yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
