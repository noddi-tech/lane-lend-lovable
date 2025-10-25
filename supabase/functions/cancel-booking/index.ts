import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelBookingRequest {
  booking_id: string;
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { booking_id }: CancelBookingRequest = await req.json();
    console.log('Cancelling booking:', booking_id, 'for user:', user.id);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, lane:lanes(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check if user owns booking or is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (booking.user_id !== user.id && !isAdmin) {
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Check if lane allows cancellations
    if (booking.lane.closed_for_cancellations_at && 
        new Date(booking.lane.closed_for_cancellations_at) < new Date()) {
      throw new Error('Cancellations are no longer allowed for this booking');
    }

    console.log('Cancelling booking:', booking_id);

    // Fetch all booking_intervals
    const { data: bookingIntervals, error: biError } = await supabase
      .from('booking_intervals')
      .select('*')
      .eq('booking_id', booking_id);

    if (biError) {
      throw new Error('Failed to fetch booking intervals');
    }

    // Reverse capacity changes
    for (const bi of bookingIntervals || []) {
      console.log(`Reversing interval ${bi.interval_id}: ${bi.booked_seconds}s`);

      // Get worker contributions for this interval + lane
      const { data: contributions } = await supabase
        .from('contribution_intervals')
        .select('*, contribution:worker_contributions!inner(lane_id)')
        .eq('interval_id', bi.interval_id);

      const laneContributions = contributions?.filter(
        (c: any) => c.contribution.lane_id === booking.lane_id
      ) || [];

      const contributionCount = laneContributions.length || 1;
      const totalSecondsToRelease = bi.booked_seconds * contributionCount;

      // Decrement lane_interval_capacity
      const { data: capacity } = await supabase
        .from('lane_interval_capacity')
        .select('total_booked_seconds')
        .eq('interval_id', bi.interval_id)
        .eq('lane_id', booking.lane_id)
        .single();

      if (capacity) {
        const newBookedSeconds = Math.max(0, capacity.total_booked_seconds - totalSecondsToRelease);

        const { error: licError } = await supabase
          .from('lane_interval_capacity')
          .update({ total_booked_seconds: newBookedSeconds })
          .eq('interval_id', bi.interval_id)
          .eq('lane_id', booking.lane_id);

        if (licError) {
          console.error('Error updating lane_interval_capacity:', licError);
        }
      }

      // Increment contribution_intervals
      for (const contrib of laneContributions) {
        const { error: ciError } = await supabase
          .from('contribution_intervals')
          .update({
            remaining_seconds: contrib.remaining_seconds + bi.booked_seconds,
          })
          .eq('contribution_id', contrib.contribution_id)
          .eq('interval_id', bi.interval_id);

        if (ciError) {
          console.error('Error updating contribution_intervals:', ciError);
        }
      }
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', booking_id);

    if (updateError) {
      throw new Error('Failed to update booking status');
    }

    console.log('Booking cancelled successfully:', booking_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error cancelling booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
