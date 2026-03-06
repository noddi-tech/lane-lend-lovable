

## Problem

The `lane_capabilities` table has a foreign key (`lane_capabilities_lane_id_fkey`) that references the **old `lanes` table**, but the seeding code now creates lanes in `lanes_new`. The lane UUIDs don't exist in the old `lanes` table, so the FK constraint fails.

## Fix

Insert lanes into **both** `lanes` and `lanes_new` tables with the same UUIDs. Use `crypto.randomUUID()` to generate IDs client-side.

### Changes in `src/pages/admin/SeedData.tsx`

1. **Generate lane IDs up front** using `crypto.randomUUID()`
2. **Insert into `lanes_new`** with those IDs (for stations FK)
3. **Insert into old `lanes`** with the same IDs (for lane_capabilities FK)
4. **Clear function**: also delete from old `lanes` table (after `lane_capabilities`)

### Clear function updates (2 locations: ~line 152 and ~line 653)
Add `await supabase.from('lanes').delete().neq('id', '...')` after the `lanes_new` delete.

### Lane creation (~line 316-329)
```typescript
const laneIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

const lanesNew = [
  { id: laneIds[0], name: 'Express Lane 1', ... },
  { id: laneIds[1], name: 'Express Lane 2', ... },
  { id: laneIds[2], name: 'Full Service Bay', ... },
];

// Insert into lanes_new (for stations FK)
await supabase.from('lanes_new').insert(lanesNew).select();

// Insert into old lanes table (for lane_capabilities FK)
await supabase.from('lanes').insert([
  { id: laneIds[0], name: 'Express Lane 1', open_time: '08:00', close_time: '17:00' },
  ...
]);
```

This ensures lane IDs exist in both tables, satisfying all FK constraints.

