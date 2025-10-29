export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string | null
          created_at: string | null
          id: string
          postal_code: string
          street_address: string
          user_id: string | null
        }
        Insert: {
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          postal_code: string
          street_address: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          postal_code?: string
          street_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      booking_intervals: {
        Row: {
          booked_seconds: number
          booking_id: string
          interval_id: string
        }
        Insert: {
          booked_seconds?: number
          booking_id: string
          interval_id: string
        }
        Update: {
          booked_seconds?: number
          booking_id?: string
          interval_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_intervals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_intervals_interval_id_fkey"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "capacity_intervals"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_sales_items: {
        Row: {
          booking_id: string
          sales_item_id: string
        }
        Insert: {
          booking_id: string
          sales_item_id: string
        }
        Update: {
          booking_id?: string
          sales_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_sales_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_sales_items_sales_item_id_fkey"
            columns: ["sales_item_id"]
            isOneToOne: false
            referencedRelation: "sales_items"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_stations: {
        Row: {
          booking_id: string
          created_at: string | null
          estimated_end_time: string | null
          estimated_start_time: string | null
          id: string
          sequence_order: number
          station_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          estimated_end_time?: string | null
          estimated_start_time?: string | null
          id?: string
          sequence_order: number
          station_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          estimated_end_time?: string | null
          estimated_start_time?: string | null
          id?: string
          sequence_order?: number
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_stations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_stations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_id: string | null
          admin_notes: string | null
          created_at: string | null
          customer_notes: string | null
          delivery_window_ends_at: string
          delivery_window_starts_at: string
          id: string
          lane_id: string
          service_time_seconds: number
          status: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_registration: string | null
          vehicle_year: number | null
        }
        Insert: {
          address_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          customer_notes?: string | null
          delivery_window_ends_at: string
          delivery_window_starts_at: string
          id?: string
          lane_id: string
          service_time_seconds: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_year?: number | null
        }
        Update: {
          address_id?: string | null
          admin_notes?: string | null
          created_at?: string | null
          customer_notes?: string | null
          delivery_window_ends_at?: string
          delivery_window_starts_at?: string
          id?: string
          lane_id?: string
          service_time_seconds?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capabilities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      capability_skills: {
        Row: {
          capability_id: string
          skill_id: string
        }
        Insert: {
          capability_id: string
          skill_id: string
        }
        Update: {
          capability_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capability_skills_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capability_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_intervals: {
        Row: {
          date: string
          ends_at: string
          id: string
          starts_at: string
        }
        Insert: {
          date: string
          ends_at: string
          id?: string
          starts_at: string
        }
        Update: {
          date?: string
          ends_at?: string
          id?: string
          starts_at?: string
        }
        Relationships: []
      }
      contribution_intervals: {
        Row: {
          contribution_id: string
          interval_id: string
          remaining_seconds: number
        }
        Insert: {
          contribution_id: string
          interval_id: string
          remaining_seconds?: number
        }
        Update: {
          contribution_id?: string
          interval_id?: string
          remaining_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "contribution_intervals_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "worker_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_intervals_interval_id_fkey"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "capacity_intervals"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_gates: {
        Row: {
          close_time: string
          created_at: string | null
          description: string | null
          facility_id: string | null
          grid_height: number
          grid_position_x: number | null
          grid_position_y: number | null
          grid_width: number
          id: string
          name: string
          open_time: string
          room_id: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number | null
          grid_position_y?: number | null
          grid_width?: number
          id?: string
          name: string
          open_time?: string
          room_id?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number | null
          grid_position_y?: number | null
          grid_width?: number
          id?: string
          name?: string
          open_time?: string
          room_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driving_gates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_gates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string | null
          description: string | null
          grid_height: number
          grid_width: number
          id: string
          name: string
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_width?: number
          id?: string
          name: string
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_width?: number
          id?: string
          name?: string
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lane_capabilities: {
        Row: {
          capability_id: string
          lane_id: string
        }
        Insert: {
          capability_id: string
          lane_id: string
        }
        Update: {
          capability_id?: string
          lane_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lane_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lane_capabilities_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
        ]
      }
      lane_interval_capacity: {
        Row: {
          interval_id: string
          lane_id: string
          total_booked_seconds: number | null
        }
        Insert: {
          interval_id: string
          lane_id: string
          total_booked_seconds?: number | null
        }
        Update: {
          interval_id?: string
          lane_id?: string
          total_booked_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lane_interval_capacity_interval_id_fkey"
            columns: ["interval_id"]
            isOneToOne: false
            referencedRelation: "capacity_intervals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lane_interval_capacity_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
        ]
      }
      lanes: {
        Row: {
          close_time: string
          closed_for_cancellations_at: string | null
          closed_for_new_bookings_at: string | null
          created_at: string | null
          id: string
          name: string
          open_time: string
          service_department_id: string | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string
          closed_for_cancellations_at?: string | null
          closed_for_new_bookings_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          open_time?: string
          service_department_id?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          closed_for_cancellations_at?: string | null
          closed_for_new_bookings_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          open_time?: string
          service_department_id?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lanes_service_department_id_fkey"
            columns: ["service_department_id"]
            isOneToOne: false
            referencedRelation: "service_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      lanes_new: {
        Row: {
          close_time: string | null
          created_at: string | null
          facility_id: string | null
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          lane_type: string | null
          name: string
          open_time: string | null
          position_order: number
          room_id: string | null
          updated_at: string | null
        }
        Insert: {
          close_time?: string | null
          created_at?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_type?: string | null
          name: string
          open_time?: string | null
          position_order?: number
          room_id?: string | null
          updated_at?: string | null
        }
        Update: {
          close_time?: string | null
          created_at?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_type?: string | null
          name?: string
          open_time?: string | null
          position_order?: number
          room_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lanes_new_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lanes_new_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      outside_areas: {
        Row: {
          area_type: string
          color: string | null
          created_at: string | null
          description: string | null
          facility_id: string
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          area_type?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id: string
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          area_type?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outside_areas_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          facility_id: string
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id: string
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_item_capabilities: {
        Row: {
          capability_id: string
          sales_item_id: string
        }
        Insert: {
          capability_id: string
          sales_item_id: string
        }
        Update: {
          capability_id?: string
          sales_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_item_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_item_capabilities_sales_item_id_fkey"
            columns: ["sales_item_id"]
            isOneToOne: false
            referencedRelation: "sales_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price_cents: number
          service_time_seconds: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price_cents?: number
          service_time_seconds?: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price_cents?: number
          service_time_seconds?: number
        }
        Relationships: []
      }
      service_departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          time_zone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          time_zone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          time_zone?: string | null
        }
        Relationships: []
      }
      service_workers: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      station_capabilities: {
        Row: {
          capability_id: string
          station_id: string
        }
        Insert: {
          capability_id: string
          station_id: string
        }
        Update: {
          capability_id?: string
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_capabilities_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          active: boolean | null
          close_time: string | null
          created_at: string | null
          description: string | null
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          lane_id: string | null
          name: string
          open_time: string | null
          room_id: string | null
          station_type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          close_time?: string | null
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_id?: string | null
          name: string
          open_time?: string | null
          room_id?: string | null
          station_type?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          close_time?: string | null
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_id?: string | null
          name?: string
          open_time?: string | null
          room_id?: string | null
          station_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stations_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          created_at: string | null
          description: string | null
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          lane_id: string | null
          name: string
          room_id: string | null
          status: string | null
          storage_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_id?: string | null
          name: string
          room_id?: string | null
          status?: string | null
          storage_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          lane_id?: string | null
          name?: string
          room_id?: string | null
          status?: string | null
          storage_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_locations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_capabilities: {
        Row: {
          capability_id: string
          worker_id: string
        }
        Insert: {
          capability_id: string
          worker_id: string
        }
        Update: {
          capability_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_capabilities_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "capabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_capabilities_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "service_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_contributions: {
        Row: {
          available_seconds: number
          created_at: string | null
          ends_at: string
          id: string
          lane_id: string
          performance_factor: number | null
          starts_at: string
          station_id: string
          travel_factor: number | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          available_seconds: number
          created_at?: string | null
          ends_at: string
          id?: string
          lane_id: string
          performance_factor?: number | null
          starts_at: string
          station_id: string
          travel_factor?: number | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          available_seconds?: number
          created_at?: string | null
          ends_at?: string
          id?: string
          lane_id?: string
          performance_factor?: number | null
          starts_at?: string
          station_id?: string
          travel_factor?: number | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_contributions_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_contributions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_contributions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "service_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_lanes: {
        Row: {
          lane_id: string
          worker_id: string
        }
        Insert: {
          lane_id: string
          worker_id: string
        }
        Update: {
          lane_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_lanes_lane_id_fkey"
            columns: ["lane_id"]
            isOneToOne: false
            referencedRelation: "lanes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_lanes_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "service_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          skill_id: string
          worker_id: string
        }
        Insert: {
          skill_id: string
          worker_id: string
        }
        Update: {
          skill_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "service_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          facility_id: string | null
          grid_height: number
          grid_position_x: number
          grid_position_y: number
          grid_width: number
          id: string
          name: string
          room_id: string | null
          updated_at: string | null
          zone_type: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name: string
          room_id?: string | null
          updated_at?: string | null
          zone_type?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          facility_id?: string | null
          grid_height?: number
          grid_position_x?: number
          grid_position_y?: number
          grid_width?: number
          id?: string
          name?: string
          room_id?: string | null
          updated_at?: string | null
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_capacity_intervals: {
        Args: { end_date: string; start_date: string }
        Returns: undefined
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_trigger_enabled: {
        Args: { enabled: boolean; table_name: string; trigger_name: string }
        Returns: undefined
      }
      sync_contribution_intervals: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const
