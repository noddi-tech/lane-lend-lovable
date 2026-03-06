

## Root Cause

The `sales_item_capabilities` table is **empty** -- the migration that was supposed to link sales items to capabilities either failed or wasn't applied. When the hook queries for required capabilities for "Wheel Change", it gets 0 results, which means `uniqueCapIds` is empty, so it should return all lanes. However, looking at the screenshot, it shows "No compatible lanes" -- this suggests the query may be failing silently due to RLS or a runtime error.

Regardless of the data issue, the user's request is valid: **admins should never be blocked by missing lane compatibility**. The ad-hoc form should allow an admin override.

## Plan

### 1. Fix the data: Insert `sales_item_capabilities` links

Run a migration to populate `sales_item_capabilities` with the correct mappings:
- Wheel Change → Wheel Change Service capability
- Wheel Storage → Wheel Storage Service capability  
- Oil Change → Basic Service
- Tire Rotation → Tire Service
- Full Diagnostic → Advanced Diagnostics
- EV Battery Check → Advanced Diagnostics
- Heavy Vehicle Inspection → Brake Service

### 2. Add admin override to the Lane selector

When no compatible lanes are found, instead of just showing "No compatible lanes" and blocking the admin:

- Show a warning alert: "No lanes have the required capabilities for the selected services"
- Add an **"Override: Show all lanes"** toggle/button that reveals all lanes regardless of capability match
- When override is active, show a visual indicator (amber warning badge) on the lane selector
- Make `laneId` no longer strictly required for form validity when override is active -- but still require a lane to be selected

### 3. Update `useCompatibleLanes` hook

Add a second return value: `allLanes` -- so the component can show all lanes as a fallback without a second query. Alternatively, accept an `override` boolean parameter that skips filtering.

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/...` | Insert missing `sales_item_capabilities` rows |
| `src/hooks/admin/useCompatibleLanes.ts` | Add `override` parameter to bypass filtering |
| `src/components/admin/CreateBookingDialog.tsx` | Add override toggle when no compatible lanes found, show warning UI |

### UI Behavior

```text
Lane * [filtered by services]
┌──────────────────────────────────┐
│ ⚠ No lanes match the required   │
│   capabilities.                  │
│   [Show all lanes (override)]    │
└──────────────────────────────────┘
```

When override is clicked:
```text
Lane * [⚠ admin override]
┌──────────────────────────────────┐
│ Express Lane 1                   │
│ Express Lane 2                   │
│ Full Service Bay                 │
└──────────────────────────────────┘
```

The form submit button remains enabled. The booking is created as normal -- the override is purely a UI convenience for admins.

