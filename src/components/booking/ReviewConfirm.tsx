import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '@/stores/bookingStore';
import { useCreateBooking } from '@/hooks/useCreateBooking';
import { useSalesItems } from '@/hooks/useSalesItems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export const ReviewConfirm = () => {
  const navigate = useNavigate();
  const { selectedServices, selectedDate, selectedSlot, vehicleInfo, reset, prevStep } = useBookingStore();
  const { data: salesItems } = useSalesItems();
  const createBooking = useCreateBooking();

  const selectedItems = salesItems?.filter((item) => selectedServices.includes(item.id)) || [];
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price_cents, 0);
  const totalTime = selectedItems.reduce((sum, item) => sum + item.service_time_seconds, 0);

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)} kr`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !vehicleInfo) {
      toast({
        title: 'Error',
        description: 'Missing booking information',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createBooking.mutateAsync({
        sales_item_ids: selectedServices,
        delivery_window_starts_at: selectedSlot.starts_at,
        delivery_window_ends_at: selectedSlot.ends_at,
        lane_id: selectedSlot.lane_id,
        vehicle_make: vehicleInfo.make,
        vehicle_model: vehicleInfo.model,
        vehicle_year: vehicleInfo.year,
        vehicle_registration: vehicleInfo.registration,
        customer_notes: vehicleInfo?.notes,
      });

      toast({
        title: 'Booking Confirmed!',
        description: 'Your service has been scheduled successfully.',
      });

      reset();
      navigate('/bookings');
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'Failed to create booking',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Confirm</h2>
        <p className="text-muted-foreground">Please review your booking details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Selected Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedItems.map((item) => (
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
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Service Time</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {selectedSlot
                    ? `${format(new Date(selectedSlot.starts_at), 'HH:mm')} - ${format(
                        new Date(selectedSlot.ends_at),
                        'HH:mm'
                      )}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Lane</p>
                <p className="font-medium">{selectedSlot ? 'Service Lane' : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">
                  {vehicleInfo
                    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="font-medium">{vehicleInfo?.registration || '-'}</p>
              </div>
              {vehicleInfo && vehicleInfo.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{vehicleInfo.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={createBooking.isPending}
          size="lg"
        >
          {createBooking.isPending ? 'Confirming...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};
