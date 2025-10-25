import { useEffect } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { ServiceSelection } from '@/components/booking/ServiceSelection';
import { DateTimeSelection } from '@/components/booking/DateTimeSelection';
import { VehicleInfo } from '@/components/booking/VehicleInfo';
import { ReviewConfirm } from '@/components/booking/ReviewConfirm';
import { Progress } from '@/components/ui/progress';

const STEPS = [
  { number: 1, title: 'Services', component: ServiceSelection },
  { number: 2, title: 'Date & Time', component: DateTimeSelection },
  { number: 3, title: 'Vehicle Info', component: VehicleInfo },
  { number: 4, title: 'Review', component: ReviewConfirm },
];

export default function BookingWizard() {
  const { currentStep, reset } = useBookingStore();

  useEffect(() => {
    // Reset wizard on mount
    reset();
  }, [reset]);

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;
  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep >= step.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.number}
              </div>
              <p
                className={`text-sm mt-2 ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Step Content */}
      <div className="bg-card rounded-lg border p-6">
        {CurrentStepComponent ? <CurrentStepComponent /> : null}
      </div>
    </div>
  );
}
