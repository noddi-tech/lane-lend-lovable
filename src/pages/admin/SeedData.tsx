import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Database, AlertCircle, Trash2, RefreshCw, Zap } from 'lucide-react';
import CustomerSeedData from './CustomerSeedData';

type SeedMode = 'clear-and-seed' | 'smart-upsert';

interface DataStats {
  skills: number;
  capabilities: number;
  workers: number;
  lanes: number;
  contributions: number;
  capacityIntervals: number;
  contributionIntervals: number;
  customers: number;
  bookings: number;
  addresses: number;
}

export default function SeedData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [seedMode, setSeedMode] = useState<SeedMode>('clear-and-seed');
  const [currentStats, setCurrentStats] = useState<DataStats>({
    skills: 0,
    capabilities: 0,
    workers: 0,
    lanes: 0,
    contributions: 0,
    capacityIntervals: 0,
    contributionIntervals: 0,
    customers: 0,
    bookings: 0,
    addresses: 0,
  });
  const [seedResults, setSeedResults] = useState<{
    skills?: number;
    capabilities?: number;
    workers?: number;
    lanes?: number;
    contributions?: number;
    error?: string;
  }>({});

  useEffect(() => {
    loadCurrentStats();
  }, []);

  const loadCurrentStats = async () => {
    setIsLoadingStats(true);
    try {
      const [skillsRes, capabilitiesRes, workersRes, lanesRes, contributionsRes, intervalsRes, contribIntervalsRes, customersRes, bookingsRes, addressesRes] = await Promise.all([
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('capabilities').select('id', { count: 'exact', head: true }),
        supabase.from('service_workers').select('id', { count: 'exact', head: true }),
        supabase.from('lanes').select('id', { count: 'exact', head: true }),
        supabase.from('worker_contributions').select('id', { count: 'exact', head: true }),
        supabase.from('capacity_intervals').select('id', { count: 'exact', head: true }),
        supabase.from('contribution_intervals').select('contribution_id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('addresses').select('id', { count: 'exact', head: true }),
      ]);

      setCurrentStats({
        skills: skillsRes.count || 0,
        capabilities: capabilitiesRes.count || 0,
        workers: workersRes.count || 0,
        lanes: lanesRes.count || 0,
        contributions: contributionsRes.count || 0,
        capacityIntervals: intervalsRes.count || 0,
        contributionIntervals: contribIntervalsRes.count || 0,
        customers: customersRes.count || 0,
        bookings: bookingsRes.count || 0,
        addresses: addressesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSyncCapacityIntervals = async () => {
    setIsSyncing(true);
    try {
      toast.info('Syncing capacity intervals...');
      
      const { error } = await supabase.rpc('sync_contribution_intervals' as any);
      
      if (error) throw error;
      
      await loadCurrentStats();
      toast.success('Synced contribution intervals successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to sync intervals: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAndSeed = async () => {
    setIsSeeding(true);
    setSeedResults({});
    
    try {
      const results: typeof seedResults = {};

      console.log('Clearing existing sample data...');
      toast.info('Clearing existing data...');
      
      await supabase.from('worker_contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('contribution_intervals').delete().neq('contribution_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('booking_intervals').delete().neq('booking_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lane_capabilities').delete().neq('lane_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('worker_skills').delete().neq('worker_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('capability_skills').delete().neq('capability_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('worker_capabilities').delete().neq('worker_id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lanes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('service_workers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('capabilities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('Cleared existing data');
      toast.success('Existing data cleared');

      await seedFreshData(results);
      
      setSeedResults(results);
      await loadCurrentStats();
      
      toast.info('Auto-syncing capacity intervals...');
      await handleSyncCapacityIntervals();
      
      toast.success('Sample data seeded successfully!');

    } catch (error) {
      console.error('Seeding error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSeedResults({ error: errorMessage });
      toast.error(`Failed to seed data: ${errorMessage}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const seedFreshData = async (results: typeof seedResults) => {
    // STEP 0: Create dev users if in dev mode
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log('Creating dev users...');
      
      const devUsers = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@dev.local',
          full_name: 'Dev Admin',
          phone: '+47 900 00 001'
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'customer@dev.local',
          full_name: 'Dev Customer',
          phone: '+47 900 00 002'
        }
      ];

      // Upsert dev profiles (upsert = insert or update if exists)
      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert(devUsers, { onConflict: 'id' });

      if (profilesError) {
        console.warn('Dev profiles creation warning:', profilesError.message);
      } else {
        console.log('✓ Dev profiles created/updated');
      }

      // Upsert dev roles
      const devRoles = [
        { user_id: '00000000-0000-0000-0000-000000000001', role: 'admin' as const },
        { user_id: '00000000-0000-0000-0000-000000000002', role: 'customer' as const }
      ];

      const { error: rolesError } = await supabase
        .from('user_roles')
        .upsert(devRoles, { onConflict: 'user_id,role' });

      if (rolesError) {
        console.warn('Dev roles creation warning:', rolesError.message);
      } else {
        console.log('✓ Dev roles created/updated');
      }
    }

    console.log('Creating sample skills...');
    const skills = [
      { name: 'Oil Change Certified', description: 'Certified to perform oil changes and basic fluid checks' },
      { name: 'Tire Specialist', description: 'Expert in tire rotation, balancing, and installation' },
      { name: 'Brake Expert', description: 'Specialized in brake system maintenance and repair' },
      { name: 'Engine Diagnostics', description: 'Skilled in engine diagnostics and troubleshooting' },
      { name: 'Electrical Systems', description: 'Expert in automotive electrical systems' },
    ];

    const { data: createdSkills, error: skillsError } = await supabase
      .from('skills')
      .insert(skills)
      .select();

    if (skillsError) throw new Error(`Skills: ${skillsError.message}`);
    results.skills = createdSkills?.length || 0;
    console.log(`Created ${results.skills} skills`);

    console.log('Creating sample capabilities...');
    const capabilities = [
      { name: 'Basic Service', description: 'Oil change, tire rotation, basic inspection' },
      { name: 'Tire Service', description: 'Tire replacement, balancing, alignment' },
      { name: 'Brake Service', description: 'Brake pad replacement, rotor servicing' },
      { name: 'Advanced Diagnostics', description: 'Engine diagnostics and electrical troubleshooting' },
    ];

    const { data: createdCapabilities, error: capError } = await supabase
      .from('capabilities')
      .insert(capabilities)
      .select();

    if (capError) throw new Error(`Capabilities: ${capError.message}`);
    results.capabilities = createdCapabilities?.length || 0;
    console.log(`Created ${results.capabilities} capabilities`);

    console.log('Linking skills to capabilities...');
    const capabilitySkillLinks = [
      { capability_id: createdCapabilities[0].id, skill_id: createdSkills[0].id },
      { capability_id: createdCapabilities[1].id, skill_id: createdSkills[1].id },
      { capability_id: createdCapabilities[2].id, skill_id: createdSkills[2].id },
      { capability_id: createdCapabilities[3].id, skill_id: createdSkills[3].id },
      { capability_id: createdCapabilities[3].id, skill_id: createdSkills[4].id },
    ];

    const { error: linkError } = await supabase
      .from('capability_skills')
      .insert(capabilitySkillLinks);

    if (linkError) throw new Error(`Capability-Skills: ${linkError.message}`);
    console.log('Linked skills to capabilities');

    console.log('Creating sample workers...');
    const workers = [
      { first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+47 123 45 678', active: true },
      { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@example.com', phone: '+47 234 56 789', active: true },
      { first_name: 'Mike', last_name: 'Williams', email: 'mike.w@example.com', phone: '+47 345 67 890', active: true },
    ];

    const { data: createdWorkers, error: workersError } = await supabase
      .from('service_workers')
      .insert(workers)
      .select();

    if (workersError) throw new Error(`Workers: ${workersError.message}`);
    results.workers = createdWorkers?.length || 0;
    console.log(`Created ${results.workers} workers`);

    console.log('Assigning skills to workers...');
    const workerSkills = [
      { worker_id: createdWorkers[0].id, skill_id: createdSkills[0].id },
      { worker_id: createdWorkers[0].id, skill_id: createdSkills[1].id },
      { worker_id: createdWorkers[1].id, skill_id: createdSkills[2].id },
      { worker_id: createdWorkers[1].id, skill_id: createdSkills[3].id },
      { worker_id: createdWorkers[2].id, skill_id: createdSkills[0].id },
      { worker_id: createdWorkers[2].id, skill_id: createdSkills[1].id },
      { worker_id: createdWorkers[2].id, skill_id: createdSkills[2].id },
      { worker_id: createdWorkers[2].id, skill_id: createdSkills[3].id },
      { worker_id: createdWorkers[2].id, skill_id: createdSkills[4].id },
    ];

    const { error: wsError } = await supabase
      .from('worker_skills')
      .insert(workerSkills);

    if (wsError) throw new Error(`Worker-Skills: ${wsError.message}`);
    console.log('Assigned skills to workers');

    console.log('Creating sample lanes...');
    const lanes = [
      { name: 'Express Lane 1', open_time: '08:00', close_time: '17:00', time_zone: 'Europe/Oslo' },
      { name: 'Express Lane 2', open_time: '08:00', close_time: '17:00', time_zone: 'Europe/Oslo' },
      { name: 'Full Service Bay', open_time: '09:00', close_time: '18:00', time_zone: 'Europe/Oslo' },
    ];

    const { data: createdLanes, error: lanesError } = await supabase
      .from('lanes')
      .insert(lanes)
      .select();

    if (lanesError) throw new Error(`Lanes: ${lanesError.message}`);
    results.lanes = createdLanes?.length || 0;
    console.log(`Created ${results.lanes} lanes`);

    console.log('Assigning capabilities to lanes...');
    const laneCapabilities = [
      { lane_id: createdLanes[0].id, capability_id: createdCapabilities[0].id },
      { lane_id: createdLanes[0].id, capability_id: createdCapabilities[1].id },
      { lane_id: createdLanes[1].id, capability_id: createdCapabilities[0].id },
      { lane_id: createdLanes[1].id, capability_id: createdCapabilities[1].id },
      { lane_id: createdLanes[2].id, capability_id: createdCapabilities[0].id },
      { lane_id: createdLanes[2].id, capability_id: createdCapabilities[1].id },
      { lane_id: createdLanes[2].id, capability_id: createdCapabilities[2].id },
      { lane_id: createdLanes[2].id, capability_id: createdCapabilities[3].id },
    ];

    const { error: lcError } = await supabase
      .from('lane_capabilities')
      .insert(laneCapabilities);

    if (lcError) throw new Error(`Lane-Capabilities: ${lcError.message}`);
    console.log('Assigned capabilities to lanes');

    console.log('Creating sample worker shifts...');
    const today = new Date();
    const shifts = [];

    for (let dayOffset = 0; dayOffset < 35; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + dayOffset);
      const dateStr = shiftDate.toISOString().split('T')[0];

      shifts.push({
        worker_id: createdWorkers[0].id,
        lane_id: createdLanes[0].id,
        starts_at: `${dateStr}T08:00:00Z`,
        ends_at: `${dateStr}T12:00:00Z`,
        available_seconds: 14400,
        performance_factor: 1.0,
        travel_factor: 1.0,
      });

      shifts.push({
        worker_id: createdWorkers[1].id,
        lane_id: createdLanes[1].id,
        starts_at: `${dateStr}T13:00:00Z`,
        ends_at: `${dateStr}T17:00:00Z`,
        available_seconds: 14400,
        performance_factor: 1.0,
        travel_factor: 1.0,
      });

      shifts.push({
        worker_id: createdWorkers[2].id,
        lane_id: createdLanes[2].id,
        starts_at: `${dateStr}T09:00:00Z`,
        ends_at: `${dateStr}T18:00:00Z`,
        available_seconds: 32400,
        performance_factor: 1.2,
        travel_factor: 0.9,
      });
    }

    const { data: createdContributions, error: contribError } = await supabase
      .from('worker_contributions')
      .insert(shifts)
      .select();

    if (contribError) throw new Error(`Contributions: ${contribError.message}`);
    results.contributions = createdContributions?.length || 0;
    console.log(`Created ${results.contributions} worker shifts`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Seed Test Data</h1>

      <Tabs defaultValue="base" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Data</TabsTrigger>
          <TabsTrigger value="customers">Customer & Bookings</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Database State
              </CardTitle>
              <CardDescription>Overview of existing base data</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.skills}</span>
                    <span className="text-sm text-muted-foreground">Skills</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.capabilities}</span>
                    <span className="text-sm text-muted-foreground">Capabilities</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.workers}</span>
                    <span className="text-sm text-muted-foreground">Workers</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.lanes}</span>
                    <span className="text-sm text-muted-foreground">Lanes</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.contributions}</span>
                    <span className="text-sm text-muted-foreground">Shifts</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.capacityIntervals}</span>
                    <span className="text-sm text-muted-foreground">Intervals</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
                    <span className="text-2xl font-bold">{currentStats.contributionIntervals}</span>
                    <span className="text-sm text-muted-foreground">Contrib Intervals</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seeding Mode</CardTitle>
              <CardDescription>Choose how to populate base data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={seedMode} onValueChange={(value) => setSeedMode(value as SeedMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="clear-and-seed" id="clear-and-seed" />
                  <Label htmlFor="clear-and-seed" className="cursor-pointer">
                    Clear and Seed - Delete all existing data and create fresh samples
                  </Label>
                </div>
              </RadioGroup>

              {seedMode === 'clear-and-seed' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    This will delete all skills, capabilities, workers, lanes, and shifts. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              {seedResults.skills !== undefined && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Created {seedResults.skills} skills, {seedResults.capabilities} capabilities,{' '}
                    {seedResults.workers} workers, {seedResults.lanes} lanes, and{' '}
                    {seedResults.contributions} shifts
                  </AlertDescription>
                </Alert>
              )}

              {seedResults.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{seedResults.error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleClearAndSeed}
                  disabled={isSeeding}
                  size="lg"
                  variant={seedMode === 'clear-and-seed' ? 'destructive' : 'default'}
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Seed Base Data
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleSyncCapacityIntervals}
                  disabled={isSyncing}
                  variant="outline"
                  size="lg"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Intervals
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <CustomerSeedData />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>Clear data for testing purposes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium">Clear All Base Data</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all skills, capabilities, workers, lanes, and shifts
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Clear all base data? This will delete skills, capabilities, workers, lanes, and shifts.')) {
                      try {
                        await supabase.from('worker_contributions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('contribution_intervals').delete().neq('contribution_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('lane_capabilities').delete().neq('lane_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('worker_skills').delete().neq('worker_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('capability_skills').delete().neq('capability_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('worker_capabilities').delete().neq('worker_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('lanes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('service_workers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('capabilities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await loadCurrentStats();
                        toast.success('Cleared all base data');
                      } catch (error) {
                        toast.error('Failed to clear base data');
                      }
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Base Data
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium">Clear All Customers & Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all customer profiles, addresses, and bookings
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Clear all customers and bookings?')) {
                      try {
                        await supabase.from('booking_sales_items').delete().neq('booking_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('booking_intervals').delete().neq('booking_id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('addresses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('user_roles').delete().eq('role', 'customer');
                        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await loadCurrentStats();
                        toast.success('Cleared all customers and bookings');
                      } catch (error) {
                        toast.error('Failed to clear customers and bookings');
                      }
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Customers
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium">Sync Capacity Intervals</h3>
                <p className="text-sm text-muted-foreground">
                  Regenerate capacity intervals from worker contributions
                </p>
                <Button
                  onClick={handleSyncCapacityIntervals}
                  disabled={isSyncing}
                  variant="outline"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Intervals
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
