

## Plan: Sales Items First, Then Auto-Filter Lanes by Capability

### Problem

The current ad-hoc form asks the admin to pick a Lane before Sales Items. This is backwards -- the admin doesn't know which lane supports the service they need. The lane should be auto-filtered based on which sales items are selected, using the existing capability chain: `sales_item_capabilities` -> `lane_capabilities`.

### Solution

Reorder the ad-hoc form and add a capability-aware lane filter:

1. **Move Sales Items to the top** (right after the "Happening Now" toggle)
2. **Create a new hook `useCompatibleLanes`** that, given selected sales item IDs, queries the capability chain to return only lanes whose capabilities satisfy all selected items
3. **Filter the Lane dropdown** to show only compatible lanes. If no sales items are selected, show all lanes (current behavior)
4. **Auto-select lane** if only one compatible lane exists
5. **Reset lane selection** when sales items change and the current lane is no longer compatible

### New Hook: `src/hooks/admin/useCompatibleLanes.ts`

Query logic:
```sql
-- For each selected sales item, get required capability IDs
SELECT capability_id FROM sales_item_capabilities WHERE sales_item_id IN (...)

-- Get lanes that have ALL those capabilities
SELECT lane_id FROM lane_capabilities WHERE capability_id IN (...required...)
GROUP BY lane_id HAVING COUNT(DISTINCT capability_id) = :required_count
```

This uses two simple Supabase queries joined client-side. Returns filtered lane objects from the existing `lanes` table.

### UI Changes in `CreateBookingDialog.tsx` (Ad-hoc form)

New field order:
1. "Happening Now" toggle
2. **Sales Items** (moved up, label changed to "Services" with required feel)
3. **Lane** (filtered by selected items' capabilities, shows badge if filtered)
4. Date / Start / End
5. Service Time
6. Vehicle fields
7. Admin Notes
8. Submit

When sales items are selected, the Lane dropdown label updates to show "Lane (filtered by services)" and incompatible lanes are excluded. If the previously selected lane becomes incompatible, it's cleared with a toast notification.

### Auto-calculate service time

When sales items are selected, auto-sum their `service_time_seconds` and pre-fill the Service Time field. Admin can still override manually.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/admin/useCompatibleLanes.ts` | New hook - queries capability chain to filter lanes |
| `src/components/admin/CreateBookingDialog.tsx` | Reorder ad-hoc form, wire up filtered lanes, auto-sum service time |

No database or migration changes needed -- all capability relationships already exist.

