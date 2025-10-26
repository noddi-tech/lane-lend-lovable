import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Database, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimulationEmptyStateProps {
  selectedDate: Date | null;
}

export default function SimulationEmptyState({ selectedDate }: SimulationEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="pt-12 pb-12">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {selectedDate ? 'No Bookings on This Date' : 'Select a Date to Begin'}
            </h3>
            <p className="text-muted-foreground">
              {selectedDate
                ? 'To run a simulation, you need existing bookings on the selected date.'
                : 'Choose a date from the calendar to start your simulation.'}
            </p>
          </div>

          {selectedDate && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">You have two options:</p>
                <ul className="text-left space-y-1 ml-6 list-disc">
                  <li>Select a different date that has existing bookings</li>
                  <li>Generate new bookings for this date in Seed Data</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/seed-data')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Go to Seed Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
