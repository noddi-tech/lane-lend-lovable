import { useSalesItems } from '@/hooks/useSalesItems';
import { useBookingStore } from '@/stores/bookingStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const ServiceSelection = () => {
  const { data: salesItems, isLoading } = useSalesItems();
  const { selectedServices, addService, removeService, nextStep } = useBookingStore();

  const handleToggle = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      removeService(serviceId);
    } else {
      addService(serviceId);
    }
  };

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)} kr`;
  };

  const formatTime = (seconds: number) => {
    const hours = seconds / 3600;
    return `${hours.toFixed(1)} hours`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Services</h2>
        <p className="text-muted-foreground">Choose the services you need for your vehicle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salesItems?.map((item) => (
          <Card
            key={item.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedServices.includes(item.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleToggle(item.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <Checkbox
                  checked={selectedServices.includes(item.id)}
                  onCheckedChange={() => handleToggle(item.id)}
                />
              </div>
              <CardDescription className="text-xl font-bold text-primary">
                {formatPrice(item.price_cents)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                Service time: {formatTime(item.service_time_seconds)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          disabled={selectedServices.length === 0}
          size="lg"
        >
          Next: Select Date & Time
        </Button>
      </div>
    </div>
  );
};
