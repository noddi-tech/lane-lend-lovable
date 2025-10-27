import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateBookingRequest {
  sales_item_ids: string[];
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  station_ids: string[];
  address_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_registration?: string;
  customer_notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const bookingData: CreateBookingRequest = await req.json();
    console.log('Creating booking for user:', user.id, bookingData);

    if (!bookingData.station_ids || bookingData.station_ids.length === 0) {
      throw new Error('At least one station is required');
    }

    // Fetch all stations and their lanes
    const { data: stations, error: stationsError } = await supabase
      .from('stations')
      .select('id, lane_id, active, lanes_new!inner(id, name, closed_for_new_bookings_at)')
      .in('id', bookingData.station_ids);

    if (stationsError || !stations || stations.length !== bookingData.station_ids.length) {
      throw new Error('One or more stations not found');
    }

    // Check if any station is inactive
    const inactiveStation = stations.find((s: any) => !s.active);
    if (inactiveStation) {
      throw new Error('One or more stations are inactive');
    }

    // Check if any lane is closed
    const closedLane = stations.find((s: any) => 
      s.lanes_new.closed_for_new_bookings_at && 
      new Date(s.lanes_new.closed_for_new_bookings_at) < new Date()
    );
    if (closedLane) {
      throw new Error(`Lane "${(closedLane as any).lanes_new.name}" is closed for new bookings`);
    }

    // Get first station's lane for backward compatibility
    const firstLane = (stations[0] as any).lanes_new;

    // Calculate total service time
    const { data: salesItems } = await supabase
      .from('sales_items')
      .select('service_time_seconds')
      .in('id', bookingData.sales_item_ids);

    const totalServiceTime = salesItems?.reduce((sum, item) => sum + item.service_time_seconds, 0) || 0;

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

    console.log(`Found ${intervals.length} overlapping intervals`);

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        lane_id: (stations[0] as any).lane_id, // Use first station's lane
        address_id: bookingData.address_id,
        delivery_window_starts_at: bookingData.delivery_window_starts_at,
        delivery_window_ends_at: bookingData.delivery_window_ends_at,
        service_time_seconds: totalServiceTime,
        vehicle_make: bookingData.vehicle_make,
        vehicle_model: bookingData.vehicle_model,
        vehicle_year: bookingData.vehicle_year,
        vehicle_registration: bookingData.vehicle_registration,
        customer_notes: bookingData.customer_notes,
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      throw new Error('Failed to create booking');
    }

    console.log('Booking created:', booking.id);

    // Insert booking_stations records with sequence order and estimated times
    const stationServiceTime = Math.floor(totalServiceTime / bookingData.station_ids.length);
    let cumulativeTime = 0;
    
    const bookingStationsData = bookingData.station_ids.map((stId, index) => {
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
      console.error('Failed to insert booking stations:', bookingStationsError);
      throw new Error('Failed to create booking station sequence');
    }

    console.log(`Created ${bookingData.station_ids.length} booking stations`);

    // Calculate total window duration for pro-rata distribution
    const windowStart = new Date(bookingData.delivery_window_starts_at).getTime();
    const windowEnd = new Date(bookingData.delivery_window_ends_at).getTime();
    const totalWindowDuration = (windowEnd - windowStart) / 1000;

    // Distribute service time across intervals
    for (const interval of intervals) {
      const intervalStart = new Date(interval.starts_at).getTime();
      const intervalEnd = new Date(interval.ends_at).getTime();

      const overlapStart = Math.max(windowStart, intervalStart);
      const overlapEnd = Math.min(windowEnd, intervalEnd);
      const overlapDuration = (overlapEnd - overlapStart) / 1000;

      if (overlapDuration <= 0) continue;

      const proRataSeconds = Math.round((overlapDuration / totalWindowDuration) * totalServiceTime);

      console.log(`Interval ${interval.id}: allocating ${proRataSeconds}s`);

      // Insert booking_intervals
      const { error: biError } = await supabase
        .from('booking_intervals')
        .insert({
          booking_id: booking.id,
          interval_id: interval.id,
          booked_seconds: proRataSeconds,
        });

      if (biError) {
        console.error('Error inserting booking_interval:', biError);
        throw new Error('Failed to create booking intervals');
      }

      // Update capacity for first lane (backward compatibility)
      const { data: existingCapacity } = await supabase
        .from('lane_interval_capacity')
        .select('total_booked_seconds')
        .eq('interval_id', interval.id)
        .eq('lane_id', (stations[0] as any).lane_id)
        .maybeSingle();

      const newBookedSeconds = (existingCapacity?.total_booked_seconds || 0) + proRataSeconds;

      const { error: licError } = await supabase
        .from('lane_interval_capacity')
        .upsert({
          interval_id: interval.id,
          lane_id: (stations[0] as any).lane_id,
          total_booked_seconds: newBookedSeconds,
        });

      if (licError) {
        console.error('Error updating lane_interval_capacity:', licError);
      }
    }

    // Insert booking_sales_items
    const salesItemInserts = bookingData.sales_item_ids.map(item_id => ({
      booking_id: booking.id,
      sales_item_id: item_id,
    }));

    const { error: bsiError } = await supabase
      .from('booking_sales_items')
      .insert(salesItemInserts);

    if (bsiError) {
      console.error('Error inserting booking_sales_items:', bsiError);
      throw new Error('Failed to link services to booking');
    }

    console.log('Booking created successfully:', booking.id);

    return new Response(
      JSON.stringify({ booking_id: booking.id, status: 'confirmed' }),
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
