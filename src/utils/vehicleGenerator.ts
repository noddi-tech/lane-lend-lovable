const vehicles = [
  { make: 'Toyota', model: 'Corolla', weight: 0.12 },
  { make: 'Volkswagen', model: 'Golf', weight: 0.10 },
  { make: 'Tesla', model: 'Model 3', weight: 0.08 },
  { make: 'BMW', model: '3-series', weight: 0.06 },
  { make: 'Audi', model: 'A4', weight: 0.06 },
  { make: 'Mercedes-Benz', model: 'C-Class', weight: 0.05 },
  { make: 'Volvo', model: 'V60', weight: 0.08 },
  { make: 'Nissan', model: 'Leaf', weight: 0.07 },
  { make: 'Hyundai', model: 'Kona', weight: 0.06 },
  { make: 'Kia', model: 'Niro', weight: 0.05 },
  { make: 'Ford', model: 'Focus', weight: 0.04 },
  { make: 'Mazda', model: '3', weight: 0.04 },
  { make: 'Skoda', model: 'Octavia', weight: 0.05 },
  { make: 'Peugeot', model: '308', weight: 0.03 },
  { make: 'Renault', model: 'Zoe', weight: 0.03 },
  { make: 'Honda', model: 'Civic', weight: 0.03 },
  { make: 'Subaru', model: 'Outback', weight: 0.02 },
  { make: 'Tesla', model: 'Model Y', weight: 0.03 }
];

const customerNotesTemplates = [
  null, // 80% no notes
  null,
  null,
  null,
  'Please call 15 minutes before arrival',
  'Keys with reception',
  'Vehicle has slight vibration at highway speeds',
  'Check tire pressure please',
  'Battery warning light occasionally appears',
  'Prefer morning appointment if possible',
  'Will drop off evening before',
  'Need work completed by 3 PM',
  'First time service - please explain all work',
  'Regular customer - same as last time',
  'Check air conditioning - not cooling well'
];

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  registration: string;
  notes: string | null;
}

function generateRegistration(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const digits = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  return `${letter1}${letter2}${digits}`;
}

function selectVehicle() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const vehicle of vehicles) {
    cumulative += vehicle.weight;
    if (random <= cumulative) {
      return vehicle;
    }
  }
  
  return vehicles[0]; // fallback
}

function generateYear(): number {
  // Weighted towards recent years
  const weights = [
    { year: 2024, weight: 0.15 },
    { year: 2023, weight: 0.20 },
    { year: 2022, weight: 0.18 },
    { year: 2021, weight: 0.15 },
    { year: 2020, weight: 0.12 },
    { year: 2019, weight: 0.08 },
    { year: 2018, weight: 0.05 },
    { year: 2017, weight: 0.04 },
    { year: 2016, weight: 0.02 },
    { year: 2015, weight: 0.01 }
  ];
  
  const random = Math.random();
  let cumulative = 0;
  
  for (const { year, weight } of weights) {
    cumulative += weight;
    if (random <= cumulative) {
      return year;
    }
  }
  
  return 2020; // fallback
}

export function generateVehicle(): VehicleInfo {
  const vehicle = selectVehicle();
  const notes = customerNotesTemplates[Math.floor(Math.random() * customerNotesTemplates.length)];
  
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: generateYear(),
    registration: generateRegistration(),
    notes,
  };
}
