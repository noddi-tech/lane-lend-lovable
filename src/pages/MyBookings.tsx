import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';
import { BookingCard } from '@/components/booking/BookingCard';
import { BookingDetailDialog } from '@/components/booking/BookingDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { BookingWithDetails } from '@/types/booking';

export default function MyBookings() {
  const { data: bookings, isLoading } = useMyBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleBookingClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const filterBookings = (filter: string) => {
    if (!bookings) return [];

    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return bookings.filter(
          (b) => b.status === 'confirmed' && new Date(b.delivery_window_starts_at) > now
        );
      case 'past':
        return bookings.filter(
          (b) => b.status === 'completed' || new Date(b.delivery_window_starts_at) < now
        );
      case 'cancelled':
        return bookings.filter((b) => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const allBookings = bookings || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button asChild>
          <Link to="/book">New Booking</Link>
        </Button>
      </div>

      {allBookings.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No bookings yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't made any bookings. Start by booking your first service!
          </p>
          <Button asChild>
            <Link to="/book">Book a Service</Link>
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({allBookings.length})</TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({filterBookings('upcoming').length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({filterBookings('past').length})</TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({filterBookings('cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('upcoming').map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('past').map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cancelled">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBookings('cancelled').map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onClick={() => handleBookingClick(booking)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <BookingDetailDialog
        booking={selectedBooking}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
