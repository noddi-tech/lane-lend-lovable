import { create } from 'zustand';

interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  registration: string;
  notes?: string;
}

interface AvailabilitySlot {
  interval_id: string;
  starts_at: string;
  ends_at: string;
  lane_id: string;
  lane_name: string;
  available_seconds: number;
}

interface BookingState {
  selectedServices: string[];
  selectedDate: Date | null;
  selectedSlot: AvailabilitySlot | null;
  vehicleInfo: VehicleInfo | null;
  currentStep: number;
  addService: (id: string) => void;
  removeService: (id: string) => void;
  setDate: (date: Date) => void;
  setSlot: (slot: AvailabilitySlot | null) => void;
  setVehicleInfo: (info: VehicleInfo) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedServices: [],
  selectedDate: null,
  selectedSlot: null,
  vehicleInfo: null,
  currentStep: 1,

  addService: (id) => set((state) => ({
    selectedServices: [...state.selectedServices, id],
  })),

  removeService: (id) => set((state) => ({
    selectedServices: state.selectedServices.filter((s) => s !== id),
  })),

  setDate: (date) => set({ selectedDate: date }),

  setSlot: (slot) => set({ selectedSlot: slot }),

  setVehicleInfo: (info) => set({ vehicleInfo: info }),

  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, 4),
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1),
  })),

  reset: () => set({
    selectedServices: [],
    selectedDate: null,
    selectedSlot: null,
    vehicleInfo: null,
    currentStep: 1,
  }),
}));
