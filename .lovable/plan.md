

## Add Wheel Change & Wheel Storage Sales Items with Skills and Capabilities

### Current State
- **Skills**: Brake Expert, Electrical Systems, Engine Diagnostics, Oil Change Certified, Tire Specialist
- **Capabilities**: Advanced Diagnostics, Basic Service, Brake Service, Tire Service
- **Sales Items**: EV Battery Check, Full Diagnostic, Heavy Vehicle Inspection, Oil Change, Tire Rotation
- **Note**: No `sales_item_capabilities` links exist yet for any items

### Data to Insert

**1. New Skills**
| Skill | Description |
|-------|-------------|
| Wheel Mounting | Certified for wheel mounting, dismounting, and torque procedures |
| Storage Handling | Qualified to handle and organize seasonal tire/wheel storage |

**2. New Capabilities**
| Capability | Description | Required Skills |
|------------|-------------|-----------------|
| Wheel Change Service | Full wheel swap including mounting and balancing | Tire Specialist + Wheel Mounting |
| Wheel Storage Service | Seasonal wheel intake, labeling, and storage | Storage Handling |

**3. New Sales Items**
| Item | Description | Price | Service Time |
|------|-------------|-------|-------------|
| Wheel Change | Swap and balance all 4 wheels | 1299 NOK | 45 min (2700s) |
| Wheel Storage | Seasonal storage for 4 wheels/tires | 799 NOK | 20 min (1200s) |

**4. Link Sales Items to Capabilities**
- Wheel Change → Wheel Change Service capability
- Wheel Storage → Wheel Storage Service capability
- Also link existing items: Oil Change → Basic Service, Tire Rotation → Tire Service, Full Diagnostic → Advanced Diagnostics, etc.

### Implementation

All changes are **data inserts** (no schema changes needed). I will use SQL inserts to:

1. Insert 2 new skills
2. Insert 2 new capabilities
3. Link capabilities to their required skills via `capability_skills`
4. Insert 2 new sales items
5. Link all sales items (including existing ones) to their capabilities via `sales_item_capabilities`

### File Changes

No frontend code changes needed -- the existing Skills, Capabilities, and Sales Items pages already display these dynamically from the database.

