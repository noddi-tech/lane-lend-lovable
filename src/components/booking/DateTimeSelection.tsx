import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useBookingStore } from '@/stores/bookingStore';
import { useAvailability } from '@/hooks/useAvailability';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DateTimeSelection = () => {
  const { selectedServices, selectedDate, selectedSlot, setDate, setSlot, nextStep, prevStep } = useBookingStore();
  const [date, setLocalDate] = useState<Date | undefined>(selectedDate || undefined);
  
  const { data: availabilityData, isLoading } = useAvailability({
    date: date || null,
    salesItemIds: selectedServices,
  });

  const availability = availabilityData?.slots || [];

  useEffect(() => {
    // Clear slot when date changes
    setSlot(null);
  }, [date, setSlot]);

  const handleDateSelect = (newDate: Date | undefined) => {
    setLocalDate(newDate);
    if (newDate) {
      setDate(newDate);
    }
  };

  const handleSlotSelect = (slot: any) => {
    setSlot(slot);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose when you'd like your service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">1. Select Date</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">2. Select Time Slot</h3>
          
          {!date && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a date first to see available time slots
              </AlertDescription>
            </Alert>
          )}

          {date && isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {date && !isLoading && availability.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No available slots for this date. Please select another date.
              </AlertDescription>
            </Alert>
          )}

          {date && !isLoading && availability.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availability.map((slot) => (
                <Card
                  key={`${slot.lane_id}-${slot.interval_id}`}
                  className={`cursor-pointer transition-all ${
                    selectedSlot?.interval_id === slot.interval_id && selectedSlot?.lane_id === slot.lane_id
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSlotSelect(slot)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{slot.lane_name}</span>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">
                      {formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.floor(slot.available_seconds / 60)} minutes available
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!date || !selectedSlot}
          size="lg"
        >
          Next: Vehicle Info
        </Button>
      </div>
    </div>
  );
};
