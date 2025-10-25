import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckAvailabilityRequest {
  date: string;
  sales_item_ids: string[];
  lane_ids?: string[];
}

interface AvailabilitySlot {
  interval_id: string;
  starts_at: string;
  ends_at: string;
  lane_id: string;
  lane_name: string;
  available_seconds: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { date, sales_item_ids, lane_ids }: CheckAvailabilityRequest = await req.json();

    console.log('Checking availability for:', { date, sales_item_ids, lane_ids });

    // Fetch required capabilities for selected services
    const { data: requiredCapabilities, error: capError } = await supabase
      .from('sales_item_capabilities')
      .select('capability_id')
      .in('sales_item_id', sales_item_ids);

    if (capError) throw capError;

    const requiredCapabilityIds = [...new Set(requiredCapabilities?.map(c => c.capability_id) || [])];
    console.log('Required capabilities:', requiredCapabilityIds);

    // Calculate total service time
    const { data: salesItems, error: siError } = await supabase
      .from('sales_items')
      .select('service_time_seconds')
      .in('id', sales_item_ids);

    if (siError) throw siError;

    const totalServiceTime = salesItems?.reduce((sum, item) => sum + item.service_time_seconds, 0) || 0;
    console.log('Total service time:', totalServiceTime);

    // Get capacity intervals for the date
    const { data: intervals, error: intError } = await supabase
      .from('capacity_intervals')
      .select('*')
      .eq('date', date)
      .order('starts_at');

    if (intError) throw intError;

    if (!intervals || intervals.length === 0) {
      return new Response(
        JSON.stringify({ slots: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lanes (optionally filtered)
    const lanesQuery = supabase
      .from('lanes')
      .select('id, name, open_time, close_time, closed_for_new_bookings_at');

    if (lane_ids && lane_ids.length > 0) {
      lanesQuery.in('id', lane_ids);
    }

    const { data: lanes, error: lanesError } = await lanesQuery;
    if (lanesError) throw lanesError;

    const availableSlots: AvailabilitySlot[] = [];

    for (const lane of lanes || []) {
      // Check if lane is closed for new bookings
      if (lane.closed_for_new_bookings_at && new Date(lane.closed_for_new_bookings_at) < new Date()) {
        console.log(`Lane ${lane.name} is closed for new bookings`);
        continue;
      }

      // Check if lane has all required capabilities
      const { data: laneCapabilities } = await supabase
        .from('lane_capabilities')
        .select('capability_id')
        .eq('lane_id', lane.id);

      const laneCapabilityIds = laneCapabilities?.map(c => c.capability_id) || [];
      const hasAllCapabilities = requiredCapabilityIds.every(capId => laneCapabilityIds.includes(capId));

      if (!hasAllCapabilities) {
        console.log(`Lane ${lane.name} missing required capabilities`);
        continue;
      }

      for (const interval of intervals) {
        // Check if interval is within lane open hours
        const intervalStart = new Date(interval.starts_at);
        const intervalStartTime = intervalStart.toTimeString().split(' ')[0];
        
        if (intervalStartTime < lane.open_time || intervalStartTime >= lane.close_time) {
          continue;
        }

        // Get worker capacity for this interval + lane
        const { data: contributions } = await supabase
          .from('contribution_intervals')
          .select('remaining_seconds, contribution:worker_contributions!inner(lane_id)')
          .eq('interval_id', interval.id);

        const laneContributions = contributions?.filter(
          (c: any) => c.contribution.lane_id === lane.id
        ) || [];

        const totalWorkerCapacity = laneContributions.reduce(
          (sum: number, c: any) => sum + c.remaining_seconds,
          0
        );

        // Get already booked capacity
        const { data: laneCapacity } = await supabase
          .from('lane_interval_capacity')
          .select('total_booked_seconds')
          .eq('interval_id', interval.id)
          .eq('lane_id', lane.id)
          .maybeSingle();

        const bookedSeconds = laneCapacity?.total_booked_seconds || 0;
        const availableSeconds = totalWorkerCapacity - bookedSeconds;

        console.log(`Lane ${lane.name}, interval ${interval.starts_at}: available=${availableSeconds}, needed=${totalServiceTime}`);

        if (availableSeconds >= totalServiceTime) {
          availableSlots.push({
            interval_id: interval.id,
            starts_at: interval.starts_at,
            ends_at: interval.ends_at,
            lane_id: lane.id,
            lane_name: lane.name,
            available_seconds: availableSeconds,
          });
        }
      }
    }

    console.log(`Found ${availableSlots.length} available slots`);

    return new Response(
      JSON.stringify({ slots: availableSlots }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
