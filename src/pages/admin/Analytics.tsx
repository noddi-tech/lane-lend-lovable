import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp, Users, Calendar as CalendarLucide, Activity, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBookingAnalytics, useWorkerPerformance, useCapacityInsights, usePeakHoursAnalysis, useSystemInsights } from '@/hooks/admin/useAnalytics';
import { useLanes } from '@/hooks/admin/useLanes';
import { useWorkers } from '@/hooks/admin/useWorkers';
import { exportBookingAnalyticsToCSV, exportWorkerPerformanceToCSV, exportCapacityReportToCSV, exportBookingsToCSV } from '@/utils/exportData';
import { KPICard } from '@/components/analytics/KPICard';
import { BookingsTrendChart } from '@/components/analytics/BookingsTrendChart';
import { UtilizationBarChart } from '@/components/analytics/UtilizationBarChart';
import { StatusPieChart } from '@/components/analytics/StatusPieChart';
import { PeakHoursHeatmap } from '@/components/analytics/PeakHoursHeatmap';
import { InsightsAlert } from '@/components/analytics/InsightsAlert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Analytics() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd')
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedLane, setSelectedLane] = useState<string | undefined>(undefined);
  const [selectedWorker, setSelectedWorker] = useState<string | undefined>(undefined);

  const { data: lanes } = useLanes();
  const { data: workers } = useWorkers();

  const bookingFilters = useMemo(() => ({
    ...dateRange,
    groupBy,
    laneId: selectedLane
  }), [dateRange, groupBy, selectedLane]);

  const workerFilters = useMemo(() => ({
    ...dateRange,
    workerId: selectedWorker
  }), [dateRange, selectedWorker]);

  const capacityFilters = useMemo(() => ({
    ...dateRange,
    laneId: selectedLane
  }), [dateRange, selectedLane]);

  const { data: bookingData, isLoading: bookingsLoading } = useBookingAnalytics(bookingFilters);
  const { data: workerData, isLoading: workersLoading } = useWorkerPerformance(workerFilters);
  const { data: capacityData, isLoading: capacityLoading } = useCapacityInsights(capacityFilters);
  const { data: peakHoursData, isLoading: peakHoursLoading } = usePeakHoursAnalysis(dateRange);
  const { data: insights, isLoading: insightsLoading } = useSystemInsights(dateRange);

  const handleExportBookings = () => {
    if (bookingData?.rawBookings) {
      exportBookingsToCSV(bookingData.rawBookings);
      toast.success('Bookings exported to CSV');
    }
  };

  const handleExportAnalytics = () => {
    if (bookingData?.analytics) {
      exportBookingAnalyticsToCSV(bookingData.analytics);
      toast.success('Analytics exported to CSV');
    }
  };

  const handleExportWorkers = () => {
    if (workerData) {
      exportWorkerPerformanceToCSV(workerData);
      toast.success('Worker performance exported to CSV');
    }
  };

  const handleExportCapacity = () => {
    if (capacityData) {
      exportCapacityReportToCSV(capacityData);
      toast.success('Capacity report exported to CSV');
    }
  };

  const kpiData = useMemo(() => {
    if (!bookingData?.analytics) return null;

    const totalBookings = bookingData.analytics.reduce((sum, item) => sum + item.totalBookings, 0);
    const totalCancelled = bookingData.analytics.reduce((sum, item) => sum + item.cancelled, 0);
    const avgBookingsPerDay = totalBookings / (bookingData.analytics.length || 1);
    const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings) * 100 : 0;

    const avgUtilization = capacityData && capacityData.length > 0
      ? capacityData.reduce((sum, item) => sum + item.utilizationRate, 0) / capacityData.length
      : 0;

    return {
      totalBookings,
      avgBookingsPerDay,
      cancellationRate,
      avgUtilization
    };
  }, [bookingData, capacityData]);

  const statusData = useMemo(() => {
    if (!bookingData?.analytics) return { confirmed: 0, completed: 0, cancelled: 0 };
    
    return {
      confirmed: bookingData.analytics.reduce((sum, item) => sum + item.confirmed, 0),
      completed: bookingData.analytics.reduce((sum, item) => sum + item.completed, 0),
      cancelled: bookingData.analytics.reduce((sum, item) => sum + item.cancelled, 0)
    };
  }, [bookingData]);

  const hasNoData = useMemo(() => {
    return bookingData && bookingData.analytics.every(item => item.totalBookings === 0);
  }, [bookingData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into bookings, workers, and capacity
          </p>
        </div>
        {hasNoData && !bookingsLoading && (
          <Button asChild>
            <Link to="/admin/seed-data">
              <Database className="mr-2 h-4 w-4" />
              Generate Test Data
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(dateRange.startDate), 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.startDate)}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }))}
                  />
                </PopoverContent>
              </Popover>
              <span className="flex items-center">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(dateRange.endDate), 'PP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(dateRange.endDate)}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDateRange({
                startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
                endDate: format(today, 'yyyy-MM-dd')
              })}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              onClick={() => setDateRange({
                startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
                endDate: format(today, 'yyyy-MM-dd')
              })}
            >
              Last 30 Days
            </Button>
            <Button
              variant="outline"
              onClick={() => setDateRange({
                startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(today), 'yyyy-MM-dd')
              })}
            >
              This Month
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          {bookingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : kpiData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Bookings"
                value={kpiData.totalBookings}
                icon={CalendarLucide}
              />
              <KPICard
                title="Avg Bookings/Day"
                value={kpiData.avgBookingsPerDay.toFixed(1)}
                icon={TrendingUp}
              />
              <KPICard
                title="Cancellation Rate"
                value={`${kpiData.cancellationRate.toFixed(1)}%`}
                icon={Activity}
                trend={kpiData.cancellationRate > 10 ? 'down' : 'neutral'}
              />
              <KPICard
                title="Avg Utilization"
                value={`${kpiData.avgUtilization.toFixed(1)}%`}
                icon={Users}
                trend={kpiData.avgUtilization > 70 ? 'up' : kpiData.avgUtilization < 30 ? 'down' : 'neutral'}
              />
            </div>
          )}

          {/* System Insights */}
          {insightsLoading ? (
            <Skeleton className="h-32" />
          ) : insights && (
            <InsightsAlert insights={insights} />
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookingsLoading ? (
              <Skeleton className="h-80" />
            ) : bookingData?.analytics && (
              <BookingsTrendChart data={bookingData.analytics} groupBy={groupBy} />
            )}

            {bookingsLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <StatusPieChart data={statusData} />
            )}
          </div>

          {/* Peak Hours */}
          {peakHoursLoading ? (
            <Skeleton className="h-96" />
          ) : peakHoursData && (
            <PeakHoursHeatmap data={peakHoursData} />
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By Day</SelectItem>
                  <SelectItem value="week">By Week</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLane} onValueChange={(value) => setSelectedLane(value === 'all' ? undefined : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Lanes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lanes</SelectItem>
                  {lanes?.map(lane => (
                    <SelectItem key={lane.id} value={lane.id}>{lane.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExportBookings} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Bookings
              </Button>
              <Button onClick={handleExportAnalytics} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Analytics
              </Button>
            </div>
          </div>

          {bookingsLoading ? (
            <Skeleton className="h-80" />
          ) : bookingData?.analytics && (
            <BookingsTrendChart data={bookingData.analytics} groupBy={groupBy} />
          )}

          {/* Analytics Table */}
          {bookingsLoading ? (
            <Skeleton className="h-96" />
          ) : bookingData?.analytics && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Booking Analytics</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Cancelled</TableHead>
                    <TableHead>Cancel %</TableHead>
                    <TableHead>Avg Time (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingData.analytics.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell>{item.totalBookings}</TableCell>
                      <TableCell>{item.confirmed}</TableCell>
                      <TableCell>{item.completed}</TableCell>
                      <TableCell>{item.cancelled}</TableCell>
                      <TableCell>{item.cancellationRate.toFixed(1)}%</TableCell>
                      <TableCell>{Math.round(item.avgServiceTime / 60)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-6">
          <div className="flex items-center justify-between">
            <Select value={selectedWorker} onValueChange={(value) => setSelectedWorker(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Workers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workers?.map(worker => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.first_name} {worker.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExportWorkers} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {workersLoading ? (
            <Skeleton className="h-80" />
          ) : workerData && workerData.length > 0 && (
            <UtilizationBarChart
              data={workerData}
              title="Worker Utilization Rates"
              dataKey="utilizationRate"
              nameKey="workerName"
            />
          )}

          {/* Worker Performance Table */}
          {workersLoading ? (
            <Skeleton className="h-96" />
          ) : workerData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Worker Performance Metrics</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Shifts</TableHead>
                    <TableHead>Avail Hours</TableHead>
                    <TableHead>Used Hours</TableHead>
                    <TableHead>Utilization %</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Idle Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerData.map((worker) => (
                    <TableRow key={worker.workerId}>
                      <TableCell className="font-medium">{worker.workerName}</TableCell>
                      <TableCell>{worker.totalShifts}</TableCell>
                      <TableCell>{(worker.totalAvailableSeconds / 3600).toFixed(1)}</TableCell>
                      <TableCell>{(worker.totalUtilizedSeconds / 3600).toFixed(1)}</TableCell>
                      <TableCell>{worker.utilizationRate.toFixed(1)}%</TableCell>
                      <TableCell>{worker.bookingsHandled}</TableCell>
                      <TableCell>{(worker.idleSeconds / 3600).toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <div className="flex items-center justify-between">
            <Select value={selectedLane} onValueChange={(value) => setSelectedLane(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Lanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lanes</SelectItem>
                {lanes?.map(lane => (
                  <SelectItem key={lane.id} value={lane.id}>{lane.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleExportCapacity} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Critical Insights */}
          {capacityLoading ? (
            <Skeleton className="h-32" />
          ) : capacityData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Overbooking Incidents</h4>
                <p className="text-2xl font-bold mt-2 text-destructive">
                  {capacityData.filter(c => c.isOverbooking).length}
                </p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Under-Utilized Slots</h4>
                <p className="text-2xl font-bold mt-2 text-yellow-600">
                  {capacityData.filter(c => c.isUnderUtilized).length}
                </p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-muted-foreground">Avg Utilization</h4>
                <p className="text-2xl font-bold mt-2">
                  {capacityData.length > 0 
                    ? (capacityData.reduce((sum, c) => sum + c.utilizationRate, 0) / capacityData.length).toFixed(1) 
                    : 0}%
                </p>
              </Card>
            </div>
          )}

          {/* Capacity Table */}
          {capacityLoading ? (
            <Skeleton className="h-96" />
          ) : capacityData && capacityData.length > 0 ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Capacity Details</h3>
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead>Capacity (min)</TableHead>
                      <TableHead>Booked (min)</TableHead>
                      <TableHead>Utilization %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capacityData.slice(0, 100).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.startTime}</TableCell>
                        <TableCell>{item.laneName}</TableCell>
                        <TableCell>{Math.round(item.totalCapacity / 60)}</TableCell>
                        <TableCell>{Math.round(item.bookedSeconds / 60)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            item.isOverbooking && "text-destructive",
                            item.isUnderUtilized && "text-yellow-600"
                          )}>
                            {item.utilizationRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.isOverbooking ? (
                            <span className="text-destructive font-medium">Overbooked</span>
                          ) : item.isUnderUtilized ? (
                            <span className="text-yellow-600 font-medium">Under-utilized</span>
                          ) : (
                            <span className="text-green-600 font-medium">Normal</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No capacity data available for this period</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
