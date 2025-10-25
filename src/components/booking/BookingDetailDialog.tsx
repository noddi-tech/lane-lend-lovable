import { format } from 'date-fns';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCancelBooking } from '@/hooks/useCancelBooking';
import { toast } from '@/hooks/use-toast';
import type { BookingWithDetails } from '@/types/booking';

interface BookingDetailDialogProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDetailDialog = ({ booking, open, onOpenChange }: BookingDetailDialogProps) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const cancelBooking = useCancelBooking();

  if (!booking) return null;

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)} kr`;
  };

  const totalPrice = booking.sales_items.reduce((sum, item) => sum + item.price_cents, 0);

  const handleCancel = async () => {
    try {
      await cancelBooking.mutateAsync(booking.id);
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      setShowCancelDialog(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Booking ID: {booking.id.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Appointment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.delivery_window_starts_at), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {format(new Date(booking.delivery_window_starts_at), 'HH:mm')} -{' '}
                    {format(new Date(booking.delivery_window_ends_at), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lane</p>
                  <p className="font-medium">{booking.lane.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Time</p>
                  <p className="font-medium">{Math.floor(booking.service_time_seconds / 60)} minutes</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Vehicle</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration</p>
                  <p className="font-medium">{booking.vehicle_registration}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Services</h3>
              <div className="space-y-2">
                {booking.sales_items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">{formatPrice(item.price_cents)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {booking.customer_notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Customer Notes</h3>
                  <p className="text-sm">{booking.customer_notes}</p>
                </div>
              </>
            )}

            {booking.status === 'confirmed' && (
              <>
                <Separator />
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelBooking.isPending}
                  className="w-full"
                >
                  Cancel Booking
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your booking. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
