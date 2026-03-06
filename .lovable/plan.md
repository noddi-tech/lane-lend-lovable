

## Plan: Fix Foreign Key Mismatch in Seeding

### Problem

The `stations` table has a foreign key `stations_lane_id_fkey` that references `lanes_new(id)`, but the seeding code in `SeedData.tsx` creates lanes in the old `lanes` table. When stations are inserted with those lane IDs, the FK constraint fails because the IDs don't exist in `lanes_new`.

### Fix: `src/pages/admin/SeedData.tsx`

Change all references from the `lanes` table to `lanes_new`:

1. **Lane creation** (~line 322): Change `.from('lanes')` to `.from('lanes_new' as any)`
2. **Lane deletion in clear** (~line 152): Change `.from('lanes')` to `.from('lanes_new' as any)`
3. **Lane deletion in inline clear** (~line 652): Same change
4. **Lane count query** (~line 72): Change `.from('lanes')` to `.from('lanes_new' as any)`
5. **`lane_capabilities` inserts stay the same** -- they reference `lane_id` which is the same UUID regardless of table

This ensures the lane IDs exist in `lanes_new` where the stations FK points.

### Lane insert data adjustment

The `lanes_new` table has different columns than `lanes` (e.g., `position_order`, `grid_position_x/y`, `grid_width/height`, `lane_type`). The insert objects need to be updated to match the `lanes_new` schema instead of the old `lanes` schema (which had `service_department_id`, `time_zone`, etc.).

