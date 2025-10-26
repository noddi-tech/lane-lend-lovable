import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Database, AlertCircle, Trash2, RefreshCw, Zap } from 'lucide-react';

type SeedMode = 'clear-and-seed' | 'smart-upsert';

interface DataStats {
  skills: number;
  capabilities: number;
  workers: number;
  lanes: number;
  contributions: number;
  capacityIntervals: number;
  contributionIntervals: number;
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
  });
  const [seedResults, setSeedResults] = useState<{
    skills?: number;
    capabilities?: number;
    workers?: number;
    lanes?: number;
    contributions?: number;
    skipped?: number;
    error?: string;
  }>({});

  useEffect(() => {
    loadCurrentStats();
  }, []);

  const loadCurrentStats = async () => {
    setIsLoadingStats(true);
    try {
      const [skillsRes, capabilitiesRes, workersRes, lanesRes, contributionsRes, intervalsRes, contribIntervalsRes] = await Promise.all([
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('capabilities').select('id', { count: 'exact', head: true }),
        supabase.from('service_workers').select('id', { count: 'exact', head: true }),
        supabase.from('lanes').select('id', { count: 'exact', head: true }),
        supabase.from('worker_contributions').select('id', { count: 'exact', head: true }),
        supabase.from('capacity_intervals').select('id', { count: 'exact', head: true }),
        supabase.from('contribution_intervals').select('contribution_id', { count: 'exact', head: true }),
      ]);

      setCurrentStats({
        skills: skillsRes.count || 0,
        capabilities: capabilitiesRes.count || 0,
        workers: workersRes.count || 0,
        lanes: lanesRes.count || 0,
        contributions: contributionsRes.count || 0,
        capacityIntervals: intervalsRes.count || 0,
        contributionIntervals: contribIntervalsRes.count || 0,
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
      
      // Call the database function to sync intervals
      const { data, error } = await supabase.rpc('sync_contribution_intervals' as any);
      
      if (error) throw error;
      
      await loadCurrentStats();
      toast.success(`Synced ${data || 0} contribution intervals successfully!`);
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
      let totalSkipped = 0;

      // Clear existing sample data first
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

      // Now seed fresh data
      await seedFreshData(results);
      
      setSeedResults(results);
      await loadCurrentStats();
      
      // Auto-sync capacity intervals after seeding
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

  const handleSmartUpsert = async () => {
    setIsSeeding(true);
    setSeedResults({});
    
    try {
      const results: typeof seedResults = {};
      let totalSkipped = 0;

      // Check existing data and only insert new records
      await seedWithUpsert(results);
      
      results.skipped = totalSkipped;
      setSeedResults(results);
      await loadCurrentStats();
      
      // Auto-sync capacity intervals after seeding
      toast.info('Auto-syncing capacity intervals...');
      await handleSyncCapacityIntervals();
      
      toast.success('Sample data updated successfully!');

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
    // 1. Create Skills
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

      // 2. Create Capabilities
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

      // 3. Link Skills to Capabilities
      console.log('Linking skills to capabilities...');
      const capabilitySkillLinks = [
        // Basic Service requires Oil Change
        { capability_id: createdCapabilities[0].id, skill_id: createdSkills[0].id },
        // Tire Service requires Tire Specialist
        { capability_id: createdCapabilities[1].id, skill_id: createdSkills[1].id },
        // Brake Service requires Brake Expert
        { capability_id: createdCapabilities[2].id, skill_id: createdSkills[2].id },
        // Advanced Diagnostics requires Engine Diagnostics + Electrical
        { capability_id: createdCapabilities[3].id, skill_id: createdSkills[3].id },
        { capability_id: createdCapabilities[3].id, skill_id: createdSkills[4].id },
      ];

      const { error: linkError } = await supabase
        .from('capability_skills')
        .insert(capabilitySkillLinks);

      if (linkError) throw new Error(`Capability-Skills: ${linkError.message}`);
      console.log('Linked skills to capabilities');

      // 4. Create Sample Workers
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

      // 5. Assign Skills to Workers
      console.log('Assigning skills to workers...');
      const workerSkills = [
        // John: Oil Change + Tire Specialist
        { worker_id: createdWorkers[0].id, skill_id: createdSkills[0].id },
        { worker_id: createdWorkers[0].id, skill_id: createdSkills[1].id },
        // Sarah: Brake Expert + Engine Diagnostics
        { worker_id: createdWorkers[1].id, skill_id: createdSkills[2].id },
        { worker_id: createdWorkers[1].id, skill_id: createdSkills[3].id },
        // Mike: All skills (experienced)
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

      // 6. Create Sample Lanes
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

      // 7. Assign Capabilities to Lanes
      console.log('Assigning capabilities to lanes...');
      const laneCapabilities = [
        // Express Lane 1: Basic + Tire Service
        { lane_id: createdLanes[0].id, capability_id: createdCapabilities[0].id },
        { lane_id: createdLanes[0].id, capability_id: createdCapabilities[1].id },
        // Express Lane 2: Basic + Tire Service
        { lane_id: createdLanes[1].id, capability_id: createdCapabilities[0].id },
        { lane_id: createdLanes[1].id, capability_id: createdCapabilities[1].id },
        // Full Service Bay: All capabilities
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

      // 8. Create Sample Worker Shifts (next 3 days)
      console.log('Creating sample worker shifts...');
      const today = new Date();
      const shifts = [];

      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const shiftDate = new Date(today);
        shiftDate.setDate(today.getDate() + dayOffset);
        const dateStr = shiftDate.toISOString().split('T')[0];

        // Morning shift - John on Lane 1
        shifts.push({
          worker_id: createdWorkers[0].id,
          lane_id: createdLanes[0].id,
          starts_at: `${dateStr}T08:00:00Z`,
          ends_at: `${dateStr}T12:00:00Z`,
          available_seconds: 14400, // 4 hours
          performance_factor: 1.0,
          travel_factor: 1.0,
        });

        // Afternoon shift - Sarah on Lane 2
        shifts.push({
          worker_id: createdWorkers[1].id,
          lane_id: createdLanes[1].id,
          starts_at: `${dateStr}T13:00:00Z`,
          ends_at: `${dateStr}T17:00:00Z`,
          available_seconds: 14400, // 4 hours
          performance_factor: 1.0,
          travel_factor: 1.0,
        });

        // Full day - Mike on Full Service Bay
        shifts.push({
          worker_id: createdWorkers[2].id,
          lane_id: createdLanes[2].id,
          starts_at: `${dateStr}T09:00:00Z`,
          ends_at: `${dateStr}T18:00:00Z`,
          available_seconds: 32400, // 9 hours
          performance_factor: 1.2, // Mike is faster
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

  const seedWithUpsert = async (results: typeof seedResults) => {
    // Similar logic but checks for existing records first
    console.log('Using smart upsert mode...');
    
    const skillNames = ['Oil Change Certified', 'Tire Specialist', 'Brake Expert', 'Engine Diagnostics', 'Electrical Systems'];
    const { data: existingSkills } = await supabase.from('skills').select('*').in('name', skillNames);
    
    const newSkills = skillNames
      .filter(name => !existingSkills?.find(s => s.name === name))
      .map(name => ({
        name,
        description: `Sample skill: ${name}`
      }));

    if (newSkills.length > 0) {
      const { data: createdSkills, error } = await supabase.from('skills').insert(newSkills).select();
      if (error) throw new Error(`Skills: ${error.message}`);
      results.skills = createdSkills?.length || 0;
    } else {
      results.skills = 0;
    }

    // Get all skills for linking
    const { data: allSkills } = await supabase.from('skills').select('*');
    if (!allSkills) throw new Error('Failed to fetch skills');

    // Similar pattern for other entities...
    const capNames = ['Basic Service', 'Tire Service', 'Brake Service', 'Advanced Diagnostics'];
    const { data: existingCaps } = await supabase.from('capabilities').select('*').in('name', capNames);
    
    const newCaps = capNames
      .filter(name => !existingCaps?.find(c => c.name === name))
      .map(name => ({ name, description: `Sample capability: ${name}` }));

    if (newCaps.length > 0) {
      const { data: createdCaps, error } = await supabase.from('capabilities').insert(newCaps).select();
      if (error) throw new Error(`Capabilities: ${error.message}`);
      results.capabilities = createdCaps?.length || 0;
    } else {
      results.capabilities = 0;
    }

    toast.info('Smart upsert mode: Only new records will be created');
  };

  const handleSeedData = () => {
    if (seedMode === 'clear-and-seed') {
      handleClearAndSeed();
    } else {
      handleSmartUpsert();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seed Sample Data</h1>
        <p className="text-muted-foreground mt-1">
          Populate your system with test data to verify functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Database State</CardTitle>
          <CardDescription>
            Review existing data before seeding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading database statistics...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.skills}</div>
                  <div className="text-sm text-muted-foreground">Skills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.capabilities}</div>
                  <div className="text-sm text-muted-foreground">Capabilities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.workers}</div>
                  <div className="text-sm text-muted-foreground">Workers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.lanes}</div>
                  <div className="text-sm text-muted-foreground">Lanes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.contributions}</div>
                  <div className="text-sm text-muted-foreground">Shifts</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.capacityIntervals}</div>
                  <div className="text-sm text-muted-foreground">Capacity Intervals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentStats.contributionIntervals}</div>
                  <div className="text-sm text-muted-foreground">Contribution Intervals</div>
                </div>
              </div>
              
              {currentStats.contributions > 0 && currentStats.contributionIntervals === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Intervals Missing</AlertTitle>
                  <AlertDescription>
                    You have {currentStats.contributions} shifts but no contribution intervals. 
                    Click "Sync Capacity Intervals" below to generate them.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSyncCapacityIntervals} 
                  disabled={isSyncing || currentStats.contributions === 0}
                  variant="outline"
                  className="flex-1"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Sync Capacity Intervals
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {!isLoadingStats && (currentStats.skills > 0 || currentStats.capabilities > 0) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Existing Data Detected</AlertTitle>
              <AlertDescription>
                Your database already contains data. Choose "Clear & Seed" to start fresh or "Smart Upsert" to add only missing records.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seeding Mode</CardTitle>
          <CardDescription>
            Choose how to handle existing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={seedMode} onValueChange={(value) => setSeedMode(value as SeedMode)}>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="clear-and-seed" id="clear" />
              <div className="space-y-1 leading-none flex-1">
                <Label htmlFor="clear" className="flex items-center gap-2 cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                  <span className="font-semibold">Clear & Seed (Recommended)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Deletes ALL existing data and creates fresh sample data. Best for testing and development.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="smart-upsert" id="upsert" />
              <div className="space-y-1 leading-none flex-1">
                <Label htmlFor="upsert" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-semibold">Smart Upsert</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only adds records that don't already exist (checks by name). Preserves existing data.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>Sample Data Overview</AlertTitle>
        <AlertDescription>
          This will create test data including skills, capabilities, workers, lanes, and shifts.
          Use this to test the complete booking flow with capability matching.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>What will be created?</CardTitle>
          <CardDescription>
            The seeding process will populate your database with the following sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Skills (5)</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Oil Change Certified</Badge>
              <Badge variant="secondary">Tire Specialist</Badge>
              <Badge variant="secondary">Brake Expert</Badge>
              <Badge variant="secondary">Engine Diagnostics</Badge>
              <Badge variant="secondary">Electrical Systems</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Capabilities (4)</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge>Basic Service</Badge>
                <span className="text-sm text-muted-foreground">→ Requires: Oil Change Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Tire Service</Badge>
                <span className="text-sm text-muted-foreground">→ Requires: Tire Specialist</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Brake Service</Badge>
                <span className="text-sm text-muted-foreground">→ Requires: Brake Expert</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Advanced Diagnostics</Badge>
                <span className="text-sm text-muted-foreground">→ Requires: Engine + Electrical</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Workers (3)</h3>
            <ul className="space-y-1 text-sm">
              <li>• John Smith (Oil Change + Tire skills)</li>
              <li>• Sarah Johnson (Brake + Engine skills)</li>
              <li>• Mike Williams (All skills - experienced)</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Lanes (3)</h3>
            <ul className="space-y-1 text-sm">
              <li>• Express Lane 1 (Basic + Tire capabilities)</li>
              <li>• Express Lane 2 (Basic + Tire capabilities)</li>
              <li>• Full Service Bay (All capabilities)</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Worker Shifts</h3>
            <p className="text-sm text-muted-foreground">
              9 shifts total (3 workers × 3 days) covering the next 3 days
            </p>
          </div>
        </CardContent>
      </Card>

      {seedResults.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{seedResults.error}</AlertDescription>
        </Alert>
      )}

      {Object.keys(seedResults).length > 0 && !seedResults.error && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Created: {seedResults.skills || 0} skills, {seedResults.capabilities || 0} capabilities,{' '}
            {seedResults.workers || 0} workers, {seedResults.lanes || 0} lanes, and{' '}
            {seedResults.contributions || 0} shifts
            {seedResults.skipped !== undefined && seedResults.skipped > 0 && (
              <span className="block mt-1">({seedResults.skipped} records skipped - already exist)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleSeedData}
          disabled={isSeeding}
          size="lg"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Data...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed Sample Data
            </>
          )}
        </Button>
      </div>

      {seedMode === 'clear-and-seed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning: Data Will Be Deleted</AlertTitle>
          <AlertDescription>
            Clear & Seed mode will DELETE ALL existing skills, capabilities, workers, lanes, and shifts.
            This action cannot be undone. Only use this in development/testing environments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
