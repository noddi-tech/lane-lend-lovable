import { useState } from 'react';
import { useAllBookings, useUpdateBookingStatus } from '@/hooks/admin/useAllBookings';
import { useLanes } from '@/hooks/admin/useLanes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Calendar, CheckCircle } from 'lucide-react';

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [laneFilter, setLaneFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: lanes } = useLanes();
  const { data: bookings, isLoading } = useAllBookings({
    status: statusFilter === 'all' ? undefined : statusFilter,
    laneId: laneFilter === 'all' ? undefined : laneFilter,
  });

  const updateBooking = useUpdateBookingStatus();

  const handleUpdateStatus = async (id: string, status: string) => {
    await updateBooking.mutateAsync({ id, status, adminNotes });
    setSelectedBooking(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'completed':
        return <Badge className="bg-accent text-accent-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Bookings</h1>
        <p className="text-muted-foreground mt-1">View and manage all customer bookings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bookings Overview
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={laneFilter} onValueChange={setLaneFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lanes</SelectItem>
                  {lanes?.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBooking(booking)}>
                  <TableCell>
                    <div className="font-medium">{booking.profiles?.full_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{booking.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    {booking.vehicle_registration || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div>{format(new Date(booking.delivery_window_starts_at), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(booking.delivery_window_starts_at), 'HH:mm')} - 
                      {format(new Date(booking.delivery_window_ends_at), 'HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>{booking.lanes?.name}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(booking.id, 'completed');
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!bookings?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedBooking.profiles?.full_name || 'N/A'}</div>
                  <div className="text-sm">{selectedBooking.profiles?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vehicle</div>
                  <div className="font-medium">
                    {selectedBooking.vehicle_make} {selectedBooking.vehicle_model} ({selectedBooking.vehicle_year})
                  </div>
                  <div className="text-sm">{selectedBooking.vehicle_registration}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Customer Notes</div>
                <div className="text-sm">{selectedBooking.customer_notes || 'None'}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Admin Notes</div>
                <Textarea
                  value={adminNotes || selectedBooking.admin_notes || ''}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for internal use..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                {selectedBooking.status === 'confirmed' && (
                  <Button onClick={() => handleUpdateStatus(selectedBooking.id, 'completed')}>
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
