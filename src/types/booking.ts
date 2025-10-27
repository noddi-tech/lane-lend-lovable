export interface SalesItem {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  service_time_seconds: number;
  active: boolean;
  created_at: string;
}

export interface AvailabilitySlot {
  interval_id: string;
  starts_at: string;
  ends_at: string;
  lane_id: string;
  lane_name: string;
  available_seconds: number;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  registration: string;
  notes?: string;
}

export interface VehicleInfoPartial {
  make?: string;
  model?: string;
  year?: number;
  registration?: string;
  notes?: string;
}

export interface CreateBookingInput {
  sales_item_ids: string[];
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  station_ids: string[]; // Array of station IDs in sequence order
  address_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_registration?: string;
  customer_notes?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  lane_id: string;
  address_id: string | null;
  delivery_window_starts_at: string;
  delivery_window_ends_at: string;
  service_time_seconds: number;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_registration: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  lane: {
    name: string;
  };
  sales_items: SalesItem[];
}
