export type BountyStatus =
  | "open" | "accepted" | "in_progress"
  | "submitted" | "reviewing" | "completed"
  | "cancelled" | "disputed" | "revision_requested" | "refunded";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export type Currency = "USD" | "EUR" | "GBP" | "INR";

export type DisputeStatus = "open" | "investigating" | "resolved" | "escalated";

export type ReviewDecision = "approved" | "rejected";

export interface Tenant {
  id: string; name: string; slug: string;
  api_key_hash: string;
  settings: Record<string, any>;
  contact_email?: string; is_active: boolean;
  created_at: string;
}

export interface User {
  id: string; tenant_id: string; email: string;
  role: "admin" | "agent" | "human";
  is_active: boolean; created_at: string;
}

export interface HumanProfile {
  id: string; full_name?: string;
  location_city?: string; location_country?: string;
  bio?: string; skills: string[]; languages?: string[];
  verification_status: "pending" | "verified" | "rejected";
  rating?: number; completed_tasks: number;
  hourly_rate?: number; is_available: boolean;
  stripe_account_id?: string;
  notification_preferred_channels: string[];
  created_at: string; updated_at: string;
}

export interface Bounty {
  id: string; tenant_id: string;
  assigned_human_id?: string;
  title: string; description: string;
  instructions?: string;
  category_id?: string;
  location_address?: string;
  location_lat?: number; location_lng?: number;
  reward_amount: number; currency: string;
  status: BountyStatus;
  payment_status: PaymentStatus;
  deadline?: string;
  created_at: string; updated_at: string;
  category?: Category;
  submissions?: TaskSubmission[];
}

export interface TaskSubmission {
  id: string; bounty_id: string;
  human_id: string;
  content?: string; media_urls?: string[];
  status: "submitted" | "approved" | "rejected";
  reviewer_notes?: string;
  created_at: string;
}

export interface Category {
  id: string; slug: string; name: string;
  description?: string; icon?: string;
}

export interface Message {
  id: string; bounty_id: string;
  sender_id: string; content: string;
  created_at: string;
  sender?: { id: string; email: string };
}

export interface Dispute {
  id: string; bounty_id: string;
  raised_by: string; reason: string;
  description?: string; evidence_urls?: string[];
  status: DisputeStatus; resolution?: string;
  created_at: string;
}
