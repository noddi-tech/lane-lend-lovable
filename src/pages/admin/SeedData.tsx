import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Database, AlertCircle } from 'lucide-react';

export default function SeedData() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResults, setSeedResults] = useState<{
    skills?: number;
    capabilities?: number;
    workers?: number;
    lanes?: number;
    contributions?: number;
    error?: string;
  }>({});

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResults({});
    
    try {
      const results: typeof seedResults = {};

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

      setSeedResults(results);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seed Sample Data</h1>
        <p className="text-muted-foreground mt-1">
          Populate your system with test data to verify functionality
        </p>
      </div>

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
            Created: {seedResults.skills} skills, {seedResults.capabilities} capabilities,{' '}
            {seedResults.workers} workers, {seedResults.lanes} lanes, and{' '}
            {seedResults.contributions} shifts
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

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This will create new records in your database. Make sure you haven't already seeded data
          to avoid duplicates. This action cannot be easily undone.
        </AlertDescription>
      </Alert>
    </div>
  );
}
