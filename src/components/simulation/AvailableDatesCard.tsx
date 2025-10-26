import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useBookingDates } from '@/hooks/admin/useBookingDates';
import { format } from 'date-fns';

interface AvailableDatesCardProps {
  onSelectDate: (date: Date) => void;
}

export default function AvailableDatesCard({ onSelectDate }: AvailableDatesCardProps) {
  const { data: bookingDates, isLoading } = useBookingDates();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Simulation Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!bookingDates || bookingDates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Simulation Dates</CardTitle>
          <CardDescription>Dates with existing bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No dates with bookings yet. Generate customer bookings first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Simulation Dates</CardTitle>
        <CardDescription>{bookingDates.length} dates with bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {bookingDates.map((dateData) => (
              <Button
                key={dateData.date}
                variant="outline"
                className="w-full justify-between"
                onClick={() => onSelectDate(dateData.displayDate)}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(dateData.displayDate, 'MMM d, yyyy')}</span>
                </div>
                <Badge variant="secondary">{dateData.count} bookings</Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
