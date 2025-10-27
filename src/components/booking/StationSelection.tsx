import { useEffect } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { StationSelector } from './StationSelector';
import { StationSequence } from './StationSequence';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSalesItems } from '@/hooks/useSalesItems';

export const StationSelection = () => {
  const { 
    selectedServices, 
    selectedDate, 
    selectedStations, 
    addStation, 
    removeStation,
    clearStations,
    nextStep, 
    prevStep 
  } = useBookingStore();

  const { data: salesItems } = useSalesItems();

  // Get required capabilities from selected services
  // For now, we'll pass empty array - capabilities should come from sales_item_capabilities table
  const requiredCapabilities: string[] = [];

  // Clear stations when date changes
  useEffect(() => {
    clearStations();
  }, [selectedDate, clearStations]);

  const handleStationAdd = (stationId: string) => {
    if (!selectedStations.includes(stationId)) {
      addStation(stationId);
    }
  };

  const handleStationRemove = (stationId: string) => {
    removeStation(stationId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Service Stations</h2>
        <p className="text-muted-foreground">
          Choose the stations where your vehicle will be serviced
        </p>
      </div>

      {!selectedDate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a date first
          </AlertDescription>
        </Alert>
      )}

      {selectedDate && (
        <>
          {selectedStations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selected Station Sequence</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedStations.length} station{selectedStations.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedStations.map((id, index) => (
                    <div key={id} className="flex items-center gap-2 bg-background rounded px-3 py-1.5 border">
                      <span className="text-sm font-medium">Station {index + 1}</span>
                      <button
                        onClick={() => handleStationRemove(id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Stations</h3>
            <StationSelector
              selectedStationIds={selectedStations}
              onStationAdd={handleStationAdd}
              requiredCapabilities={requiredCapabilities}
            />
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={selectedStations.length === 0}
          size="lg"
        >
          Next: Vehicle Information
        </Button>
      </div>
    </div>
  );
};
