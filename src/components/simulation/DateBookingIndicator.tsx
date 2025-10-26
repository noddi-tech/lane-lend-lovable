import { DayContentProps } from 'react-day-picker';
import { useBookingDates } from '@/hooks/admin/useBookingDates';
import { format } from 'date-fns';

export function DateBookingIndicator(props: DayContentProps) {
  const { data: bookingDates } = useBookingDates();
  const dateStr = format(props.date, 'yyyy-MM-dd');
  const bookingData = bookingDates?.find(bd => bd.date === dateStr);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <span>{props.date.getDate()}</span>
      {bookingData && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500"
          title={`${bookingData.count} bookings`}
        />
      )}
    </div>
  );
}
