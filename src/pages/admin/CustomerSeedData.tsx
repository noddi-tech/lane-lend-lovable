import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateCustomers, createCustomersInDatabase } from '@/utils/customerGenerator';
import { generateAddresses, createAddressesInDatabase } from '@/utils/addressGenerator';
import { generateVehicle } from '@/utils/vehicleGenerator';
import { calculateDailyBookingCount, selectTimeSlot, findNextAvailableSlot, type PeakHours } from '@/utils/bookingDistribution';
import { assignServices } from '@/utils/serviceAssignment';
import { createBooking, type BookingData } from '@/utils/bookingCreator';
import type { SalesItem } from '@/types/booking';
import { Loader2, Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import PrerequisitesCard from '@/components/seed-data/PrerequisitesCard';
import WorkflowStepper from '@/components/seed-data/WorkflowStepper';
import EmptyStateCard from '@/components/seed-data/EmptyStateCard';
import { useSystemReadiness } from '@/hooks/admin/useSystemReadiness';

interface CustomerSeedDataProps {
  onNavigateToBaseData: () => void;
}

export default function CustomerSeedData({ onNavigateToBaseData }: CustomerSeedDataProps) {
  const [customerCount, setCustomerCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState<string>('10');
  const [dateRange, setDateRange] = useState({ start: 7, end: 30 }); // days from now
  const [density, setDensity] = useState<number>(1.0);
  const [peakHours, setPeakHours] = useState<PeakHours>({ morning: 35, midday: 30, afternoon: 35 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<{ 
    customers: number; 
    addresses: number; 
    bookings: number;
    attemptedBookings?: number;
    skippedBookings?: number;
  } | null>(null);

  const { data: readiness, isLoading: isLoadingReadiness } = useSystemReadiness();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStatus('Validating...');
    setResults(null);

    try {
      // Validate prerequisites
      const { data: lanes } = await supabase.from('lanes').select('id').limit(1);
      const { data: salesItems } = await supabase.from('sales_items').select('*').eq('active', true);
      
      if (!lanes || lanes.length === 0) {
        toast.error('No lanes found. Please create lanes first.');
        setIsGenerating(false);
        return;
      }
      
      if (!salesItems || salesItems.length === 0) {
        toast.error('No active sales items found. Please create services first.');
        setIsGenerating(false);
        return;
      }

      // Phase 1: Generate customers
      setStatus(`Generating ${customerCount} customers...`);
      setProgress(10);
      const customers = await generateCustomers(customerCount);
      
      setStatus('Creating customer profiles...');
      setProgress(20);
      await createCustomersInDatabase(customers);
      
      // Phase 2: Generate addresses
      setStatus('Generating addresses...');
      setProgress(30);
      const addresses = await generateAddresses(customers.map(c => c.id));
      await createAddressesInDatabase(addresses);
      
      // Phase 3: Generate bookings
      setStatus('Fetching available lanes...');
      setProgress(40);
      const { data: allLanes } = await supabase.from('lanes').select('id, name');
      if (!allLanes || allLanes.length === 0) throw new Error('No lanes available');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + dateRange.start);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + dateRange.end);
      
      let totalBookings = 0;
      let attemptedBookings = 0;
      const daysToGenerate = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      setStatus(`Generating bookings for ${daysToGenerate} days...`);
      
      for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        
        const dailyBookingCount = calculateDailyBookingCount(currentDate, density);
        
        for (let i = 0; i < dailyBookingCount; i++) {
          attemptedBookings++;
          try {
            // Select random customer and lane
            const customer = customers[Math.floor(Math.random() * customers.length)];
            const address = addresses.find(a => a.user_id === customer.id);
            const lane = allLanes[Math.floor(Math.random() * allLanes.length)];
            
            if (!address) {
              attemptedBookings--;
              continue;
            }
            
            // Select time slot
            const timeSlot = selectTimeSlot(currentDate, peakHours);
            const deliveryWindowStart = new Date(currentDate);
            deliveryWindowStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
            
            // Assign services
            const serviceAssignment = await assignServices(lane.id, salesItems as SalesItem[]);
            const deliveryWindowEnd = new Date(
              deliveryWindowStart.getTime() + serviceAssignment.totalServiceTime * 1000
            );
            
            // Check capacity and find available slot
            const availableSlot = await findNextAvailableSlot(
              lane.id,
              deliveryWindowStart,
              serviceAssignment.totalServiceTime
            );
            
            if (!availableSlot) continue; // Skip if no capacity
            
            const finalWindowEnd = new Date(
              availableSlot.getTime() + serviceAssignment.totalServiceTime * 1000
            );
            
            // Generate vehicle info
            const vehicle = generateVehicle();
            
            // Create booking
            const bookingData: BookingData = {
              userId: customer.id,
              laneId: lane.id,
              addressId: address.id,
              deliveryWindowStart: availableSlot,
              deliveryWindowEnd: finalWindowEnd,
              serviceTimeSeconds: serviceAssignment.totalServiceTime,
              salesItems: serviceAssignment.salesItems,
              vehicle,
            };
            
            await createBooking(bookingData);
            totalBookings++;
          } catch (error) {
            console.error('Error creating booking:', error);
            // Continue with next booking
          }
        }
        
        const progressPercent = 40 + Math.floor((dayOffset / daysToGenerate) * 50);
        setProgress(progressPercent);
        setStatus(`Generated ${totalBookings} bookings (Day ${dayOffset + 1}/${daysToGenerate})...`);
      }
      
      setProgress(100);
      setStatus('Complete!');
      
      const skippedBookings = attemptedBookings - totalBookings;
      
      setResults({
        customers: customers.length,
        addresses: addresses.length,
        bookings: totalBookings,
        attemptedBookings,
        skippedBookings,
      });
      
      if (totalBookings === 0 && attemptedBookings > 0) {
        toast.warning(`Generated ${customers.length} customers but 0 bookings. All ${attemptedBookings} booking attempts failed due to insufficient capacity.`);
      } else if (skippedBookings > 0) {
        toast.success(`Generated ${customers.length} customers and ${totalBookings} bookings. ${skippedBookings} bookings skipped due to capacity.`);
      } else {
        toast.success(`Successfully generated ${customers.length} customers and ${totalBookings} bookings!`);
      }
    } catch (error: any) {
      console.error('Error generating seed data:', error);
      toast.error(error.message || 'Failed to generate seed data');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if system is ready
  const systemNotReady = !readiness?.overallReady;
  const hasNoData = readiness && 
    readiness.lanes.count === 0 && 
    readiness.workers.count === 0 && 
    readiness.salesItems.count === 0;

  // Show empty state for brand new users
  if (hasNoData && !isLoadingReadiness) {
    return (
      <div className="space-y-6">
        <EmptyStateCard 
          onGetStarted={onNavigateToBaseData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PrerequisitesCard />
      
      <WorkflowStepper onNavigateToBaseData={onNavigateToBaseData} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer & Booking Generation
          </CardTitle>
          <CardDescription>
            Generate realistic test customers and bookings with proper capacity tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Count */}
          <div className="space-y-3">
            <Label>Number of Customers</Label>
            <RadioGroup
              value={customerCount.toString()}
              onValueChange={(value) => {
                const num = parseInt(value);
                setCustomerCount(num);
                setCustomCount(num.toString());
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10" id="count-10" />
                <Label htmlFor="count-10">10 Customers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="50" id="count-50" />
                <Label htmlFor="count-50">50 Customers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="100" id="count-100" />
                <Label htmlFor="count-100">100 Customers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="count-custom" />
                <Label htmlFor="count-custom">Custom</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={customCount}
                  onChange={(e) => {
                    setCustomCount(e.target.value);
                    const num = parseInt(e.target.value) || 10;
                    setCustomerCount(Math.min(500, Math.max(1, num)));
                  }}
                  className="w-24"
                  disabled={customerCount !== 0 && ![10, 50, 100].includes(customerCount)}
                />
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Date Range
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground">Start (days from now)</Label>
                <Input
                  type="number"
                  min="0"
                  max="90"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground">End (days from now)</Label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            {readiness?.capacity.coverageEnd && (
              <Alert variant="default" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Worker capacity available until{' '}
                  {readiness.capacity.coverageEnd.toLocaleDateString()}. Bookings outside this range will be skipped.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Booking Density */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Booking Density: {density.toFixed(1)}x
            </Label>
            <Slider
              value={[density]}
              onValueChange={(values) => setDensity(values[0])}
              min={0.5}
              max={3.0}
              step={0.1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Controls how many bookings are generated per day
            </p>
          </div>

          {/* Peak Hours Distribution */}
          <div className="space-y-3">
            <Label>Peak Hours Distribution (%)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Morning (9-11)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={peakHours.morning}
                  onChange={(e) => setPeakHours({ ...peakHours, morning: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Midday (11-14)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={peakHours.midday}
                  onChange={(e) => setPeakHours({ ...peakHours, midday: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Afternoon (14-17)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={peakHours.afternoon}
                  onChange={(e) => setPeakHours({ ...peakHours, afternoon: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">{status}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Generation Results</h3>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{results.customers}</p>
                    <p className="text-sm text-muted-foreground">Customers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{results.addresses}</p>
                    <p className="text-sm text-muted-foreground">Addresses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{results.bookings}</p>
                    <p className="text-sm text-muted-foreground">Bookings</p>
                  </div>
                </div>

                {results.skippedBookings && results.skippedBookings > 0 && (
                  <Alert variant={results.bookings === 0 ? "destructive" : "default"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold">
                          {results.bookings === 0 ? 'Why were 0 bookings created?' : `${results.skippedBookings} bookings skipped`}
                        </p>
                        <p className="text-sm">
                          {results.attemptedBookings} booking{results.attemptedBookings !== 1 ? 's' : ''} attempted, 
                          {results.skippedBookings} failed capacity checks
                        </p>
                        <p className="text-sm mt-2">
                          <strong>Common reasons:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Existing bookings already consumed available capacity</li>
                          <li>Insufficient worker capacity for the selected date range</li>
                          <li>Booking density too high for current capacity</li>
                        </ul>
                        {results.bookings === 0 ? (
                          <>
                            <p className="text-sm font-medium mt-2">Recommended Actions:</p>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                              <li>Clear existing bookings by deleting from the Bookings page</li>
                              <li>Go to "Setup: Lanes & Workers" and ensure capacity exists</li>
                              <li>Reduce booking density to 0.5x or 1.0x</li>
                              <li>Try a date range with more worker capacity</li>
                            </ol>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium mt-2">Suggestions:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>Clear existing bookings before generating new ones</li>
                              <li>Reduce booking density to fit more bookings</li>
                              <li>Generate workers with more capacity on the Setup page</li>
                            </ul>
                          </>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || systemNotReady}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Customers & Bookings'
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {systemNotReady && (
                <TooltipContent>
                  <p>Missing prerequisites. Check System Readiness above.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
