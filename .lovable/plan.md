

## Plan: Fix Quick Start Seeding — Missing `station_id`

### Problem

The `worker_contributions` table requires a `station_id` (NOT NULL), but the seeding code in `SeedData.tsx` never creates stations and doesn't include `station_id` in the shift inserts. This causes every Quick Start attempt to fail with: `null value in column "station_id" violates not-null constraint`.

### Fix (single file: `src/pages/admin/SeedData.tsx`)

1. **Create stations after creating lanes** — add 3 stations, one per lane:
   - "Express Station 1" → linked to Express Lane 1
   - "Express Station 2" → linked to Express Lane 2  
   - "Full Service Station" → linked to Full Service Bay

   Insert into `stations` table with `lane_id`, `name`, `station_type: 'general'`, `active: true`.

2. **Add `station_id` to every shift** — map each worker's shift to the station belonging to their assigned lane:
   - Worker 0 (Express Lane 1) → Express Station 1
   - Worker 1 (Express Lane 2) → Express Station 2
   - Worker 2 (Full Service Bay) → Full Service Station

3. **Track station count in results** — add `stations` to the `currentStats` display so the DB state card shows station count.

4. **Clear stations during data cleanup** — add `stations` to the delete sequence in the clear function (delete before lanes due to foreign key).

### Technical Details

The stations insert goes right after the lane capabilities section (~line 341). Each shift object in the loop (~lines 352-380) gets a `station_id` field pointing to the corresponding created station. The clear function needs `await supabase.from('stations').delete().neq('id', '00000000...')` added before the lanes delete.

