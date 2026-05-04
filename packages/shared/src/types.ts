export type UserType = "agent" | "human";

export type BountyStatus =
  | "draft"
  | "open"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentStatus = "pending" | "escrow" | "released" | "refunded" | "failed";

export type PriceType = "fixed" | "hourly" | "negotiable";

export type Currency = "USD" | "EUR" | "GBP" | "INR";

export type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

export type ReviewDecision = "approved" | "rejected" | "revision_requested";

export type PaymentProvider = "stripe" | "paypal";

export type RoutingMode = "internal" | "external" | "auto";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  api_key: string;
  api_key_prefix: string;
  contact_email: string;
  is_active: boolean;
  payment_enabled: boolean;
  payment_provider: PaymentProvider | null;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  user_type: UserType;
  is_active: boolean;
  created_at: string;
}

export interface HumanProfile {
  id: string;
  user_id: string;
  bio: string | null;
  skills: string[];
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  is_available: boolean;
  notification_slack: boolean;
  notification_telegram: boolean;
  notification_email: boolean;
  notification_phone: boolean;
  notification_preferred_channels: string[];
  total_tasks_completed: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Bounty {
  id: string;
  tenant_id: string;
  agent_id: string | null;
  assigned_human_id: string | null;
  title: string;
  description: string;
  requirements: string[];
  category: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  location_instructions: string | null;
  is_remote: boolean;
  deadline: string | null;
  estimated_hours: number | null;
  price_type: PriceType;
  price: number | null;
  currency: Currency;
  status: BountyStatus;
  payment_status: PaymentStatus;
  evidence_required: string[];
  task_template: string | null;
  steps: string[];
  completion_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmission {
  id: string;
  bounty_id: string;
  submitted_by: string;
  evidence_urls: string[];
  notes: string | null;
  completion_code_provided: string | null;
  completion_code_match: boolean | null;
  location_lat: number | null;
  location_lng: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  review_decision: ReviewDecision | null;
  review_notes: string | null;
}

export interface Message {
  id: string;
  bounty_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  bounty_id: string;
  raised_by: string;
  reason: string;
  evidence_urls: string[];
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface CreateBountyInput {
  title: string;
  description: string;
  requirements?: string[];
  category?: string;
  location_city?: string;
  location_country?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  location_instructions?: string;
  is_remote?: boolean;
  deadline?: string;
  estimated_hours?: number;
  price_type?: PriceType;
  price?: number;
  currency?: Currency;
  evidence_required?: string[];
  task_template?: string;
  steps?: string[];
}

export interface CreateDisputeInput {
  bounty_id: string;
  reason: string;
  evidence_urls?: string[];
}

export interface SendMessageInput {
  bounty_id: string;
  content: string;
}

export interface SubmitTaskInput {
  bounty_id: string;
  evidence_urls?: string[];
  notes?: string;
  completion_code?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ReviewSubmissionInput {
  bounty_id: string;
  decision: ReviewDecision;
  notes?: string;
}

export interface PaymentInput {
  bounty_id: string;
  amount: number;
  currency: Currency;
}

export interface HumanFilter {
  skills?: string[];
  location_city?: string;
  location_country?: string;
  radius_km?: number;
  is_available?: boolean;
  min_rating?: number;
}

export interface BountyFilter {
  status?: BountyStatus;
  category?: string;
  is_remote?: boolean;
  location_city?: string;
  location_country?: string;
  min_price?: number;
  max_price?: number;
}
