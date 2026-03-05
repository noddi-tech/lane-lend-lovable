

## Admin Booking Flow - Implementation Plan

### Overview

Add a "Create Booking" dialog to the existing Admin Bookings page (`/admin/bookings`) with two modes:

1. **Capacity-Managed Booking** - Uses the existing `check-availability` and `create-booking` edge functions to respect worker capacity, lane capabilities, and station assignments.
2. **Ad-hoc Booking** - Inserts directly into the `bookings` table without capacity checks, interval allocation, or station assignment. For walk-ins, phone bookings, or work done outside the normal scheduling system.

### Database Changes

Add an `is_adhoc` boolean column to the `bookings` table to distinguish ad-hoc bookings from capacity-managed ones:

```sql
ALTER TABLE bookings ADD COLUMN is_adhoc boolean NOT NULL DEFAULT false;
```

No other schema changes needed.

### Edge Function Changes

**Update `create-booking/index.ts`** to accept an optional `is_adhoc: true` flag and `admin_override: true` flag:
- When `is_adhoc` is true, skip capacity interval checks, skip lane capability checks, skip station assignment. Just insert the booking with `is_adhoc = true`.
- When `admin_override` is true, use the service role key directly (no user JWT required) so admins can create bookings on behalf of customers or without a customer.
- Make `user_id` optional for ad-hoc bookings (walk-ins with no account).

### New Components

**1. `src/components/admin/CreateBookingDialog.tsx`**
A dialog with two tabs: "Scheduled" and "Ad-hoc".

**Scheduled tab (capacity-managed):**
- Step 1: Select sales items (checkboxes from `useSalesItems`)
- Step 2: Pick date, fetch availability via `check-availability`, select a slot
- Step 3: Vehicle info (make, model, year, registration) - optional
- Step 4: Customer selection (search existing profiles or leave blank)
- Step 5: Admin notes
- Submit calls `create-booking` edge function

**Ad-hoc tab:**
- Lane selector (dropdown)
- Date + time range (manual input, no availability check)
- Service time override (manual seconds/minutes input)
- Sales items (optional)
- Vehicle info (optional)
- Customer selection (optional - for walk-ins)
- Admin notes
- Submit inserts directly into `bookings` table with `is_adhoc = true`, skipping all capacity logic

**2. `src/hooks/admin/useCreateAdminBooking.ts`**
- Mutation for ad-hoc bookings: direct Supabase insert
- Mutation for scheduled bookings: calls `create-booking` edge function with admin override

### UI Integration

**Update `src/pages/admin/Bookings.tsx`:**
- Add a "New Booking" button next to the filters
- Opens `CreateBookingDialog`
- On success, invalidates `admin-bookings` query

**Update booking list:**
- Show an "Ad-hoc" badge on ad-hoc bookings
- Ad-hoc bookings show "Manual" instead of capacity info

### File Changes Summary

| File | Action |
|------|--------|
| `supabase/migrations/XXXX_add_adhoc_column.sql` | Add `is_adhoc` column |
| `supabase/functions/create-booking/index.ts` | Add admin override + ad-hoc mode |
| `src/components/admin/CreateBookingDialog.tsx` | New - booking creation dialog |
| `src/hooks/admin/useCreateAdminBooking.ts` | New - admin booking mutations |
| `src/pages/admin/Bookings.tsx` | Add "New Booking" button + ad-hoc badge |

### Flow Diagram

```text
Admin clicks "New Booking"
         |
    ┌────┴────┐
    │ Dialog  │
    │ opens   │
    └────┬────┘
         |
   ┌─────┴─────┐
   │            │
Scheduled    Ad-hoc
   │            │
Pick items   Pick lane
Pick date    Set time range
See slots    Set service time
Pick slot    Optional items
Vehicle?     Vehicle?
Customer?    Customer?
   │            │
   ▼            ▼
Edge fn      Direct DB
create-      insert with
booking      is_adhoc=true
   │            │
   └─────┬──────┘
         │
   Invalidate queries
   Show success toast
```

### Technical Details

- The ad-hoc insert uses `supabase.from('bookings').insert(...)` directly from the client since the admin RLS policy already allows admins full access.
- For scheduled bookings, the existing edge function is reused. The admin's JWT is passed through so the booking is created under the admin's auth context. A `customer_user_id` field can optionally override who the booking is "for."
- The `is_adhoc` column defaults to `false` so existing bookings are unaffected.
- Ad-hoc bookings intentionally skip: capacity interval allocation, lane_interval_capacity updates, booking_intervals, booking_stations, and booking_sales_items (unless items are explicitly selected).

