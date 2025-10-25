import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BookingWithDetails } from '@/types/booking';

interface BookingCardProps {
  booking: BookingWithDetails;
  onClick: () => void;
}

export const BookingCard = ({ booking, onClick }: BookingCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {booking.vehicle_make} {booking.vehicle_model}
          </CardTitle>
          <Badge variant={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Date & Time</p>
            <p className="font-medium">{formatDateTime(booking.delivery_window_starts_at)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Lane</p>
            <p className="font-medium">{booking.lane.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Registration</p>
            <p className="font-medium">{booking.vehicle_registration || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Services</p>
            <p className="text-sm">{booking.sales_items.length} service(s)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
