import { useState } from 'react';
import { format } from 'date-fns';
import { useAvailability } from '@/hooks/useAvailability';
import { useBookingStore } from '@/stores/bookingStore';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AvailabilitySlot } from '@/types/booking';

export const DateTimeSelection = () => {
  const { selectedServices, selectedDate, selectedSlot, setDate, setSlot, nextStep, prevStep } = useBookingStore();
  const [date, setLocalDate] = useState<Date | undefined>(selectedDate || undefined);
  
  const { data, isLoading } = useAvailability({
    date: date || null,
    salesItemIds: selectedServices,
  });

  const handleDateSelect = (newDate: Date | undefined) => {
    setLocalDate(newDate);
    if (newDate) {
      setDate(newDate);
      setSlot(null); // Clear slot when date changes
    }
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSlot(slot);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getCapacityPercentage = (slot: AvailabilitySlot) => {
    // Assuming max capacity is available_seconds * 1.5 for visualization
    return Math.min(100, (slot.available_seconds / (slot.available_seconds * 1.5)) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose when you'd like your service</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Pick a Date</h3>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            className="rounded-md border pointer-events-auto"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Available Time Slots</h3>
          {!date && (
            <p className="text-muted-foreground">Please select a date first</p>
          )}
          {date && isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          )}
          {date && !isLoading && data?.slots.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No availability on this date. Please try another date.
                </p>
              </CardContent>
            </Card>
          )}
          {date && !isLoading && data && data.slots.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {data.slots.map((slot) => (
                <Card
                  key={slot.interval_id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedSlot?.starts_at === slot.starts_at && selectedSlot?.lane_id === slot.lane_id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleSlotSelect(slot)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {formatTime(slot.starts_at)} - {formatTime(slot.ends_at)}
                    </CardTitle>
                    <CardDescription>{slot.lane_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">{Math.floor(slot.available_seconds / 60)} min available</span>
                      </div>
                      <Progress value={getCapacityPercentage(slot)} />
                    </div>
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
          disabled={!selectedSlot}
          size="lg"
        >
          Next: Vehicle Information
        </Button>
      </div>
    </div>
  );
};
