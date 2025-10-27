import { useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const DateTimeSelection = () => {
  const { selectedDate, setDate, nextStep, prevStep } = useBookingStore();
  const [date, setLocalDate] = useState<Date | undefined>(selectedDate || undefined);

  const handleDateSelect = (newDate: Date | undefined) => {
    setLocalDate(newDate);
    if (newDate) {
      setDate(newDate);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date</h2>
        <p className="text-muted-foreground">Choose when you'd like your service</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Select a date, then you'll be able to choose available service stations
        </AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!date}
          size="lg"
        >
          Next: Select Stations
        </Button>
      </div>
    </div>
  );
};
