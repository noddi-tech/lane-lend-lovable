import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreateBookingRequest {
  sales_item_ids: string[];
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  lane_id: string;
  address_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_registration?: string;
  customer_notes?: string;
  admin_notes?: string;
  is_adhoc?: boolean;
  admin_override?: boolean;
  customer_user_id?: string;
  service_time_seconds?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: CreateBookingRequest = await req.json();
    const isAdhoc = bookingData.is_adhoc === true;
    const isAdminOverride = bookingData.admin_override === true;

    let userId: string | null = null;

    // For admin override, use service role key and skip user JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (isAdminOverride) {
      // Verify the caller is an admin via their JWT
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const verifyClient = createClient(supabaseUrl, serviceRoleKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await verifyClient.auth.getUser();
        if (authError || !user) {
          throw new Error('Unauthorized');
        }
        // Check admin role
        const adminCheck = createClient(supabaseUrl, serviceRoleKey);
        const { data: roleData } = await adminCheck
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (!roleData) {
          throw new Error('Admin access required');
        }
      } else {
        throw new Error('Missing authorization header');
      }

      // Use customer_user_id if provided, otherwise null (walk-in)
      userId = bookingData.customer_user_id || null;
    } else {
      // Normal user flow
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header');
      }
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      userId = user.id;
    }

    // Use service role client for all DB operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('Creating booking:', { userId, isAdhoc, isAdminOverride });

    // ── Ad-hoc booking: skip all capacity logic ──
    if (isAdhoc) {
      const totalServiceTime = bookingData.service_time_seconds ||
        (bookingData.sales_item_ids?.length
          ? await calculateServiceTime(supabase, bookingData.sales_item_ids)
          : 3600);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          lane_id: bookingData.lane_id,
          address_id: bookingData.address_id,
          delivery_window_starts_at: bookingData.delivery_window_starts_at,
          delivery_window_ends_at: bookingData.delivery_window_ends_at,
          service_time_seconds: totalServiceTime,
          vehicle_make: bookingData.vehicle_make,
          vehicle_model: bookingData.vehicle_model,
          vehicle_year: bookingData.vehicle_year,
          vehicle_registration: bookingData.vehicle_registration,
          customer_notes: bookingData.customer_notes,
          admin_notes: bookingData.admin_notes,
          is_adhoc: true,
          status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Ad-hoc booking error:', bookingError);
        throw new Error('Failed to create ad-hoc booking');
      }

      // Optionally link sales items
      if (bookingData.sales_item_ids?.length) {
        await supabase.from('booking_sales_items').insert(
          bookingData.sales_item_ids.map(id => ({
            booking_id: booking.id,
            sales_item_id: id,
          }))
        );
      }

      console.log('Ad-hoc booking created:', booking.id);
      return new Response(
        JSON.stringify({ booking_id: booking.id, status: 'confirmed', is_adhoc: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Capacity-managed booking (existing logic) ──

    // Validate lane
    const { data: lane, error: laneError } = await supabase
      .from('lanes')
      .select('id, name, closed_for_new_bookings_at')
      .eq('id', bookingData.lane_id)
      .single();

    if (laneError || !lane) throw new Error('Lane not found');
    if (lane.closed_for_new_bookings_at && new Date(lane.closed_for_new_bookings_at) < new Date()) {
      throw new Error(`Lane "${lane.name}" is closed for new bookings`);
    }

    // Get required capabilities
    const { data: requiredCapabilities } = await supabase
      .from('sales_item_capabilities')
      .select('capability_id')
      .in('sales_item_id', bookingData.sales_item_ids);

    const requiredCapabilityIds = [...new Set(requiredCapabilities?.map(c => c.capability_id) || [])];

    // Find compatible stations
    const { data: allStations } = await supabase
      .from('stations')
      .select(`id, name, grid_position_x, grid_position_y, station_capabilities!inner(capability_id)`)
      .eq('lane_id', bookingData.lane_id)
      .eq('active', true);

    const compatibleStations = (allStations || []).filter((station: any) => {
      const stationCapIds = station.station_capabilities.map((sc: any) => sc.capability_id);
      return requiredCapabilityIds.every(capId => stationCapIds.includes(capId));
    });

    if (compatibleStations.length === 0) {
      throw new Error('No stations available with required capabilities');
    }

    compatibleStations.sort((a: any, b: any) => {
      if (a.grid_position_x !== b.grid_position_x) return a.grid_position_x - b.grid_position_x;
      return a.grid_position_y - b.grid_position_y;
    });

    const assignedStationIds = compatibleStations.map((s: any) => s.id);

    // Calculate service time
    const totalServiceTime = await calculateServiceTime(supabase, bookingData.sales_item_ids);

    // Get overlapping intervals
    const { data: intervals, error: intError } = await supabase
      .from('capacity_intervals')
      .select('*')
      .gte('ends_at', bookingData.delivery_window_starts_at)
      .lte('starts_at', bookingData.delivery_window_ends_at)
      .order('starts_at');

    if (intError || !intervals || intervals.length === 0) {
      throw new Error('No capacity intervals found for delivery window');
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        lane_id: bookingData.lane_id,
        address_id: bookingData.address_id,
        delivery_window_starts_at: bookingData.delivery_window_starts_at,
        delivery_window_ends_at: bookingData.delivery_window_ends_at,
        service_time_seconds: totalServiceTime,
        vehicle_make: bookingData.vehicle_make,
        vehicle_model: bookingData.vehicle_model,
        vehicle_year: bookingData.vehicle_year,
        vehicle_registration: bookingData.vehicle_registration,
        customer_notes: bookingData.customer_notes,
        admin_notes: bookingData.admin_notes,
        is_adhoc: false,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      throw new Error('Failed to create booking');
    }

    // Insert booking_stations
    const stationServiceTime = Math.floor(totalServiceTime / assignedStationIds.length);
    let cumulativeTime = 0;
    const bookingStationsData = assignedStationIds.map((stId, index) => {
      const startTime = new Date(new Date(bookingData.delivery_window_starts_at).getTime() + cumulativeTime * 1000);
      const endTime = new Date(startTime.getTime() + stationServiceTime * 1000);
      cumulativeTime += stationServiceTime;
      return {
        booking_id: booking.id,
        station_id: stId,
        sequence_order: index + 1,
        estimated_start_time: startTime.toISOString(),
        estimated_end_time: endTime.toISOString(),
      };
    });

    const { error: bookingStationsError } = await supabase
      .from('booking_stations')
      .insert(bookingStationsData);

    if (bookingStationsError) {
      throw new Error('Failed to create booking station sequence');
    }

    // Distribute service time across intervals
    const windowStart = new Date(bookingData.delivery_window_starts_at).getTime();
    const windowEnd = new Date(bookingData.delivery_window_ends_at).getTime();
    const totalWindowDuration = (windowEnd - windowStart) / 1000;

    for (const interval of intervals) {
      const intervalStart = new Date(interval.starts_at).getTime();
      const intervalEnd = new Date(interval.ends_at).getTime();
      const overlapStart = Math.max(windowStart, intervalStart);
      const overlapEnd = Math.min(windowEnd, intervalEnd);
      const overlapDuration = (overlapEnd - overlapStart) / 1000;
      if (overlapDuration <= 0) continue;

      const proRataSeconds = Math.round((overlapDuration / totalWindowDuration) * totalServiceTime);

      await supabase.from('booking_intervals').insert({
        booking_id: booking.id,
        interval_id: interval.id,
        booked_seconds: proRataSeconds,
      });

      const { data: existingCapacity } = await supabase
        .from('lane_interval_capacity')
        .select('total_booked_seconds')
        .eq('interval_id', interval.id)
        .eq('lane_id', bookingData.lane_id)
        .maybeSingle();

      const newBookedSeconds = (existingCapacity?.total_booked_seconds || 0) + proRataSeconds;
      await supabase.from('lane_interval_capacity').upsert({
        interval_id: interval.id,
        lane_id: bookingData.lane_id,
        total_booked_seconds: newBookedSeconds,
      });
    }

    // Insert booking_sales_items
    const salesItemInserts = bookingData.sales_item_ids.map(item_id => ({
      booking_id: booking.id,
      sales_item_id: item_id,
    }));

    const { error: bsiError } = await supabase
      .from('booking_sales_items')
      .insert(salesItemInserts);

    if (bsiError) throw new Error('Failed to link services to booking');

    return new Response(
      JSON.stringify({
        booking_id: booking.id,
        status: 'confirmed',
        assigned_stations: assignedStationIds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateServiceTime(supabase: any, salesItemIds: string[]): Promise<number> {
  const { data: salesItems } = await supabase
    .from('sales_items')
    .select('service_time_seconds')
    .in('id', salesItemIds);
  return salesItems?.reduce((sum: number, item: any) => sum + item.service_time_seconds, 0) || 0;
}
