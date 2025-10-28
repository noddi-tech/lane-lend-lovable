import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, Plus, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DrivingGateTest() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    gateId?: string;
    laneIds?: string[];
    stationIds?: string[];
    errors?: string[];
  }>({});

  const createTestData = async () => {
    setLoading(true);
    setTestResults({});
    const errors: string[] = [];

    try {
      // 0. Get or create default facility
      toast.info('Getting default facility...');
      const { data: facilities, error: facilityError } = await supabase
        .from('facilities')
        .select('id')
        .limit(1);

      if (facilityError || !facilities || facilities.length === 0) {
        errors.push(`No facility found. Please create a facility first.`);
        setTestResults({ errors });
        setLoading(false);
        toast.error('No facility found');
        return;
      }

      const facilityId = facilities[0].id;

      // 1. Create Driving Gate
      toast.info('Creating test driving gate...');
      const { data: gate, error: gateError } = await supabase
        .from('driving_gates')
        .insert({
          name: 'Test Auto Service Center',
          description: 'Automated test facility',
          facility_id: facilityId,
          grid_width: 30,
          grid_height: 20,
          grid_position_x: 0,
          grid_position_y: 0,
          open_time: '07:00:00',
          close_time: '19:00:00',
        })
        .select()
        .single();

      if (gateError || !gate) {
        errors.push(`Failed to create driving gate: ${gateError?.message}`);
        setTestResults({ errors });
        return;
      }

      toast.success('Driving gate created');
      
      // 2. Create Lanes
      toast.info('Creating test lanes...');
      const lanesData = [
        { name: 'Express Lane', position_order: 1, grid_position_y: 0, grid_height: 5 },
        { name: 'Standard Service Lane', position_order: 2, grid_position_y: 6, grid_height: 7 },
        { name: 'Heavy Duty Lane', position_order: 3, grid_position_y: 14, grid_height: 6 },
      ];

      const { data: lanes, error: lanesError } = await supabase
        .from('lanes_new')
        .insert(
          lanesData.map(l => ({
            ...l,
            facility_id: gate.facility_id,
            open_time: '08:00:00',
            close_time: '17:00:00',
          }))
        )
        .select();

      if (lanesError || !lanes) {
        errors.push(`Failed to create lanes: ${lanesError?.message}`);
        setTestResults({ gateId: gate.id, errors });
        return;
      }

      toast.success(`Created ${lanes.length} lanes`);

      // 3. Fetch capabilities
      const { data: capabilities } = await supabase
        .from('capabilities')
        .select('id, name')
        .limit(5);

      const capIds = capabilities?.map(c => c.id) || [];

      // 4. Create Stations
      toast.info('Creating test stations...');
      const stationsData = [
        // Express Lane Stations
        { lane_id: lanes[0].id, name: 'Quick Check Bay 1', station_type: 'diagnostic', x: 0, y: 1, w: 3, h: 2 },
        { lane_id: lanes[0].id, name: 'Quick Check Bay 2', station_type: 'diagnostic', x: 4, y: 1, w: 3, h: 2 },
        
        // Standard Lane Stations
        { lane_id: lanes[1].id, name: 'Lift Station A', station_type: 'lifting_jack', x: 0, y: 7, w: 4, h: 3 },
        { lane_id: lanes[1].id, name: 'Tire Service', station_type: 'tire_mount', x: 5, y: 7, w: 4, h: 3 },
        { lane_id: lanes[1].id, name: 'Alignment Bay', station_type: 'alignment', x: 10, y: 7, w: 5, h: 3 },
        
        // Heavy Duty Lane Stations
        { lane_id: lanes[2].id, name: 'Heavy Lift 1', station_type: 'lifting_jack', x: 0, y: 15, w: 5, h: 4 },
        { lane_id: lanes[2].id, name: 'Heavy Lift 2', station_type: 'lifting_jack', x: 6, y: 15, w: 5, h: 4 },
      ];

      const { data: stations, error: stationsError } = await supabase
        .from('stations')
        .insert(
          stationsData.map((s, idx) => ({
            lane_id: s.lane_id,
            name: s.name,
            station_type: s.station_type,
            grid_position_x: s.x,
            grid_position_y: s.y,
            grid_width: s.w,
            grid_height: s.h,
            description: `Test station ${idx + 1}`,
            active: true,
          }))
        )
        .select();

      if (stationsError || !stations) {
        errors.push(`Failed to create stations: ${stationsError?.message}`);
        setTestResults({ gateId: gate.id, laneIds: lanes.map(l => l.id), errors });
        return;
      }

      toast.success(`Created ${stations.length} stations`);

      // 5. Assign capabilities to stations
      if (capIds.length > 0) {
        toast.info('Assigning capabilities...');
        const capAssignments = stations.flatMap(station => 
          capIds.slice(0, 2).map(capId => ({
            station_id: station.id,
            capability_id: capId,
          }))
        );

        const { error: capError } = await supabase
          .from('station_capabilities')
          .insert(capAssignments);

        if (capError) {
          errors.push(`Warning: Failed to assign capabilities: ${capError.message}`);
        } else {
          toast.success('Capabilities assigned');
        }
      }

      setTestResults({
        gateId: gate.id,
        laneIds: lanes.map(l => l.id),
        stationIds: stations.map(s => s.id),
        errors: errors.length > 0 ? errors : undefined,
      });

      toast.success('Test data created successfully!');
    } catch (error) {
      console.error('Error creating test data:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      setTestResults({ errors });
      toast.error('Failed to create test data');
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    if (!testResults.gateId) {
      toast.error('No test data to cleanup');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('driving_gates')
        .delete()
        .eq('id', testResults.gateId);

      if (error) {
        toast.error(`Cleanup failed: ${error.message}`);
      } else {
        toast.success('Test data cleaned up');
        setTestResults({});
      }
    } catch (error) {
      toast.error('Cleanup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Driving Gate System Test</h1>
        <p className="text-muted-foreground mt-2">
          Create and test the complete driving gate, lanes, and stations setup
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Data Generator</CardTitle>
            <CardDescription>
              Generate a complete test setup with driving gate, lanes, and stations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={createTestData}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test Data
                </>
              )}
            </Button>

            {testResults.gateId && (
              <Button
                onClick={cleanupTestData}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                <Database className="mr-2 h-4 w-4" />
                Cleanup Test Data
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Status of test data creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!testResults.gateId && !testResults.errors && (
              <p className="text-muted-foreground text-center py-8">
                No test data created yet
              </p>
            )}

            {testResults.gateId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Driving Gate Created</span>
                  <Badge variant="outline" className="ml-auto">
                    {testResults.gateId.slice(0, 8)}
                  </Badge>
                </div>

                {testResults.laneIds && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Lanes Created</span>
                    <Badge variant="outline" className="ml-auto">
                      {testResults.laneIds.length}
                    </Badge>
                  </div>
                )}

                {testResults.stationIds && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Stations Created</span>
                    <Badge variant="outline" className="ml-auto">
                      {testResults.stationIds.length}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {testResults.errors && testResults.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Errors Occurred</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-xs mt-2">
                    {testResults.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What Gets Created</CardTitle>
          <CardDescription>Overview of the test data structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1 Driving Gate</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                <li>30x20 grid layout</li>
                <li>Operating hours: 7 AM - 7 PM</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3 Lanes</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                <li>Express Lane (Quick service)</li>
                <li>Standard Service Lane (Full service)</li>
                <li>Heavy Duty Lane (Large vehicles)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7 Stations</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                <li>Diagnostic bays</li>
                <li>Lifting jacks</li>
                <li>Tire service stations</li>
                <li>Alignment bay</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
