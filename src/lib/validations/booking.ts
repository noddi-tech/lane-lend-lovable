import { z } from 'zod';

export const vehicleInfoSchema = z.object({
  make: z.string().trim().min(1, 'Vehicle make is required').max(100),
  model: z.string().trim().min(1, 'Vehicle model is required').max(100),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  registration: z.string().trim().min(1, 'Registration is required').max(20),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const createBookingSchema = z.object({
  sales_item_ids: z.array(z.string().uuid()).min(1, 'At least one service is required'),
  delivery_window_starts_at: z.string(),
  delivery_window_ends_at: z.string(),
  lane_id: z.string().uuid(),
  address_id: z.string().uuid().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.number().optional(),
  vehicle_registration: z.string().optional(),
  customer_notes: z.string().max(1000).optional(),
});

export type VehicleInfoFormData = z.infer<typeof vehicleInfoSchema>;
export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
