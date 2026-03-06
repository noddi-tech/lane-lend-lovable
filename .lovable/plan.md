

## Plan: Ad-hoc "Now" Mode + Vehicle Make/Model/Year Dropdowns

### Changes

All changes are in **`src/components/admin/CreateBookingDialog.tsx`** only. No backend changes needed.

### 1. "Now" Toggle on Ad-hoc Form

Add a "Happening Now" switch/button at the top of the ad-hoc form. When toggled on:
- Auto-fill date to today, start time to current time (rounded to nearest 5 min), end time to start + service minutes
- Disable the date/start/end fields (greyed out, auto-calculated)
- When service minutes changes, recalculate end time automatically
- When toggled off, fields become editable again with the pre-filled values

### 2. Vehicle Make Dropdown (Top 30)

Replace the free-text Make input with a searchable `Select` (combobox) containing the 30 most popular car makes in Norway/Europe:

Toyota, Volkswagen, BMW, Mercedes-Benz, Audi, Volvo, Ford, Hyundai, Kia, Nissan, Skoda, Peugeot, Mazda, Honda, Mitsubishi, Suzuki, Renault, Citroën, Opel, Fiat, Tesla, Subaru, Jeep, Land Rover, Porsche, MINI, Lexus, Dacia, Seat, Cupra

Plus an "Other" option that reveals a free-text input for unlisted makes.

### 3. Model Dropdown (Filtered by Make)

A static lookup object mapping each make to its ~8-15 most popular models. When a make is selected, the Model dropdown populates with matching models. Includes an "Other" option with free-text fallback.

Example subset:
- Toyota → Corolla, RAV4, Yaris, Camry, C-HR, Hilux, Aygo, Proace, Land Cruiser
- Volkswagen → Golf, Passat, Tiguan, Polo, ID.4, ID.3, T-Roc, Touran, Caddy
- Tesla → Model 3, Model Y, Model S, Model X

### 4. Year Dropdown

Replace the number input with a `Select` dropdown listing years from 2026 down to 1990 (descending, newest first). Quick to scroll, no typos.

### 5. Registration (License Plate)

Keep as a text input but add:
- Uppercase transform (`uppercase` class)
- Placeholder "e.g. AB 12345"

### 6. Apply to Both Forms

Apply the same vehicle dropdowns to the Scheduled booking form (Step 3) for consistency.

### Technical Details

- Vehicle data will be a static constant object (`VEHICLE_DATA`) defined at the top of the file — no API calls needed
- Use the existing `Select` component for Make, Model, and Year
- The "Now" toggle uses a `Switch` component; toggling it calls `new Date()` to populate fields
- Approximately ~200 lines of static vehicle data + ~50 lines of UI changes per form

