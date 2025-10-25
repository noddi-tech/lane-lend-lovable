import { useState } from 'react';
import { useLanes } from '@/hooks/admin/useLanes';
import { useCapacityData } from '@/hooks/admin/useCapacityData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Gauge } from 'lucide-react';

export default function Capacity() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLaneId, setSelectedLaneId] = useState<string>('');

  const { data: lanes } = useLanes();
  const { data: capacityData, isLoading } = useCapacityData(
    format(selectedDate, 'yyyy-MM-dd'),
    selectedLaneId
  );

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-destructive';
    if (percentage >= 50) return 'bg-primary';
    if (percentage >= 25) return 'bg-accent';
    return 'bg-secondary';
  };

  const getUtilizationBadge = (percentage: number) => {
    if (percentage >= 75) return <Badge variant="destructive">High</Badge>;
    if (percentage >= 50) return <Badge variant="default">Medium</Badge>;
    if (percentage >= 25) return <Badge variant="secondary">Low</Badge>;
    return <Badge variant="outline">Available</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Capacity Management</h1>
        <p className="text-muted-foreground mt-1">View and manage lane capacity across time intervals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-border"
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Capacity Overview
            </CardTitle>
            <div className="mt-4">
              <Select value={selectedLaneId} onValueChange={setSelectedLaneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lane" />
                </SelectTrigger>
                <SelectContent>
                  {lanes?.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedLaneId ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a lane to view capacity data
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !capacityData?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                No capacity data available for this date
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {capacityData.reduce((sum, d) => sum + d.total_capacity, 0)}s
                      </div>
                      <div className="text-xs text-muted-foreground">Total Capacity</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {capacityData.reduce((sum, d) => sum + d.booked_seconds, 0)}s
                      </div>
                      <div className="text-xs text-muted-foreground">Booked</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-foreground">
                        {capacityData.reduce((sum, d) => sum + d.remaining_capacity, 0)}s
                      </div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  {capacityData.map((interval) => (
                    <div key={interval.interval_id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                      <div className="w-20 text-sm font-medium text-foreground">
                        {format(new Date(interval.starts_at), 'HH:mm')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full ${getUtilizationColor(interval.utilization_percentage)}`}
                              style={{ width: `${interval.utilization_percentage}%` }}
                            />
                          </div>
                          {getUtilizationBadge(interval.utilization_percentage)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {interval.booked_seconds}s / {interval.total_capacity}s booked 
                          ({interval.utilization_percentage.toFixed(0)}%)
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {interval.bookings?.length || 0} bookings
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
