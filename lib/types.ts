// Database Types for Smart Logistics System

export interface PriorityRule {
  id: number;
  cargo_type: string;
  priority_level: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
  max_delay_minutes: number;
  can_be_halted: boolean;
  description?: string;
  color_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  phone: string;
  name: string;
  vehicle_plate: string;
  vehicle_type: string;
  company?: string;
  push_token?: string;
  is_active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  date: string; // DATE
  start_time: string; // TIME
  end_time: string; // TIME
  capacity: number;
  booked: number;
  status: "AVAILABLE" | "FULL" | "CLOSED";
  predicted_traffic?: "NORMAL" | "MODERATE" | "CONGESTED";
  created_at: string;
  updated_at: string;
}

export interface VesselSchedule {
  id: string;
  vessel_name: string;
  arrival_date: string; // DATE
  arrival_time?: string; // TIME
  estimated_trucks: number;
  actual_trucks: number;
  status: "SCHEDULED" | "ARRIVED" | "DEPARTED" | "DELAYED";
  cargo_priority?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Permit {
  id: string;
  driver_id: string;
  slot_id: string;
  vessel_id?: string;
  qr_code: string;
  status: "PENDING" | "APPROVED" | "HALTED" | "CANCELLED" | "EXPIRED" | "COMPLETED";
  priority: "EMERGENCY" | "ESSENTIAL" | "NORMAL" | "LOW";
  cargo_type: string;
  original_slot_id?: string;
  rescheduled_count: number;
  suggested_slots?: Record<string, unknown>;
  approved_at?: string;
  halted_at?: string;
  expires_at?: string;
  entry_time?: string;
  exit_time?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrafficUpdate {
  id: number;
  camera_id: string;
  timestamp: string; // TIMESTAMPTZ
  vehicle_count: number;
  truck_count: number;
  car_count?: number;
  status: "NORMAL" | "MODERATE" | "CONGESTED";
  density_score?: number;
  recommendation?: string;
  processed: boolean;
  created_at: string;
}

export interface TrafficPrediction {
  id: number;
  camera_id: string;
  prediction_time: string; // TIMESTAMPTZ
  predicted_for: string; // TIMESTAMPTZ
  predicted_status: "NORMAL" | "MODERATE" | "CONGESTED";
  confidence_score?: number;
  factors?: Record<string, unknown>;
  created_at: string;
}

export interface DriverLocation {
  id: number;
  driver_id: string;
  permit_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  eta_minutes?: number;
  recorded_at: string; // TIMESTAMPTZ
  created_at: string;
}

export interface Notification {
  id: number;
  driver_id: string;
  permit_id?: string;
  title: string;
  body: string;
  type: "INFO" | "WARNING" | "URGENT" | "RESCHEDULE" | "APPROVAL" | "DENIAL";
  data?: Record<string, unknown>;
  sent_at: string; // TIMESTAMPTZ
  read_at?: string;
  status: "SENT" | "DELIVERED" | "FAILED" | "READ";
  error_message?: string;
  created_at: string;
}

// API Response Types
export interface HaltPermitsResponse {
  halted_count: number;
  protected_count: number;
}

export interface TrafficApiRequest {
  camera_id: string;
  timestamp: string;
  status: "NORMAL" | "MODERATE" | "CONGESTED";
  vehicle_count: number;
  truck_count: number;
  recommendation?: string;
}

export interface TrafficApiResponse {
  success: boolean;
  permits_affected: number;
  permits_protected: number;
  message?: string;
}
