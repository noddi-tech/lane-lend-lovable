-- Re-sync contribution intervals to clear phantom bookings
-- This runs the fixed sync_contribution_intervals function to regenerate all data
SELECT sync_contribution_intervals();