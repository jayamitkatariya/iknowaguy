import { createClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: any | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
      );
    }

    supabaseClient = createClient(url, key) as ReturnType<typeof createClient>;
  }

  return supabaseClient;
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          api_key: string;
          api_key_prefix: string;
          api_key_hash: string | null;
          contact_email: string | null;
          settings: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          api_key?: string;
          api_key_hash?: string | null;
          contact_email?: string | null;
          settings?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          api_key?: string;
          api_key_hash?: string | null;
          contact_email?: string | null;
          settings?: Record<string, unknown> | null;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string | null;
          email: string;
          password_hash: string | null;
          role: "agent" | "human" | "admin";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          email: string;
          password_hash?: string | null;
          role?: "agent" | "human" | "admin";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          password_hash?: string | null;
          role?: "agent" | "human" | "admin";
          is_active?: boolean;
          updated_at?: string;
        };
      };
      human_profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          location_city: string | null;
          location_country: string | null;
          bio: string | null;
          skills: string[];
          languages: string[];
          verification_status: "pending" | "verified" | "rejected";
          rating: number;
          completed_tasks: number;
          hourly_rate: number | null;
          is_available: boolean;
          timezone: string | null;
          notification_slack: string | null;
          notification_telegram: string | null;
          notification_email: string | null;
          notification_phone: string | null;
          notification_preferred_channels: string[];
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          avatar_url?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          bio?: string | null;
          skills?: string[];
          languages?: string[];
          verification_status?: "pending" | "verified" | "rejected";
          rating?: number;
          completed_tasks?: number;
          hourly_rate?: number | null;
          is_available?: boolean;
          timezone?: string | null;
          notification_slack?: string | null;
          notification_telegram?: string | null;
          notification_email?: string | null;
          notification_phone?: string | null;
          notification_preferred_channels?: string[];
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          bio?: string | null;
          skills?: string[];
          languages?: string[];
          verification_status?: "pending" | "verified" | "rejected";
          rating?: number;
          completed_tasks?: number;
          hourly_rate?: number | null;
          is_available?: boolean;
          timezone?: string | null;
          notification_slack?: string | null;
          notification_telegram?: string | null;
          notification_email?: string | null;
          notification_phone?: string | null;
          notification_preferred_channels?: string[];
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          updated_at?: string;
        };
      };
      bounties: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string | null;
          template_id: string | null;
          assigned_human_id: string | null;
          title: string;
          description: string;
          instructions: string | null;
          location_address: string | null;
          location_lat: number | null;
          location_lng: number | null;
          reward_amount: number;
          currency: string;
          status: "open" | "accepted" | "in_progress" | "submitted" | "reviewing" | "completed" | "disputed" | "cancelled" | "refunded";
          deadline: string | null;
          metadata: Record<string, unknown> | null;
          completion_code: string | null;
          payment_status: "unpaid" | "pending" | "held" | "released" | "refunded";
          evidence_required: string[];
          location_city: string | null;
          location_country: string | null;
          location_instructions: string | null;
          steps: Record<string, unknown> | null;
          is_remote: boolean;
          price: number | null;
          price_type: "fixed" | "hourly";
          estimated_hours: number | null;
          agent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category_id?: string | null;
          template_id?: string | null;
          assigned_human_id?: string | null;
          title: string;
          description: string;
          instructions?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          reward_amount: number;
          currency?: string;
          status?: "open" | "accepted" | "in_progress" | "submitted" | "reviewing" | "completed" | "disputed" | "cancelled" | "refunded";
          deadline?: string | null;
          metadata?: Record<string, unknown> | null;
          completion_code?: string | null;
          payment_status?: "unpaid" | "pending" | "held" | "released" | "refunded";
          evidence_required?: string[];
          location_city?: string | null;
          location_country?: string | null;
          location_instructions?: string | null;
          steps?: Record<string, unknown> | null;
          is_remote?: boolean;
          price?: number | null;
          price_type?: "fixed" | "hourly";
          estimated_hours?: number | null;
          agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assigned_human_id?: string | null;
          title?: string;
          description?: string;
          instructions?: string | null;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          reward_amount?: number;
          currency?: string;
          status?: "open" | "accepted" | "in_progress" | "submitted" | "reviewing" | "completed" | "disputed" | "cancelled" | "refunded";
          deadline?: string | null;
          metadata?: Record<string, unknown> | null;
          completion_code?: string | null;
          payment_status?: "unpaid" | "pending" | "held" | "released" | "refunded";
          evidence_required?: string[];
          location_city?: string | null;
          location_country?: string | null;
          location_instructions?: string | null;
          steps?: Record<string, unknown> | null;
          is_remote?: boolean;
          price?: number | null;
          price_type?: "fixed" | "hourly";
          estimated_hours?: number | null;
          agent_id?: string | null;
          updated_at?: string;
        };
      };
      task_submissions: {
        Row: {
          id: string;
          bounty_id: string;
          human_id: string;
          content: string | null;
          media_urls: string[];
          status: "submitted" | "approved" | "rejected";
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          human_id: string;
          content?: string | null;
          media_urls?: string[];
          status?: "submitted" | "approved" | "rejected";
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string | null;
          media_urls?: string[];
          status?: "submitted" | "approved" | "rejected";
          reviewer_notes?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          bounty_id: string;
          sender_id: string;
          content: string;
          attachments: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          sender_id: string;
          content: string;
          attachments?: string[];
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          bounty_id: string;
          raised_by: string;
          reason: string;
          description: string | null;
          evidence_urls: string[];
          status: "open" | "investigating" | "resolved" | "escalated";
          resolution: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          raised_by: string;
          reason: string;
          description?: string | null;
          evidence_urls?: string[];
          status?: "open" | "investigating" | "resolved" | "escalated";
          resolution?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reason?: string;
          description?: string | null;
          evidence_urls?: string[];
          status?: "open" | "investigating" | "resolved" | "escalated";
          resolution?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
        };
      };
      payment_transactions: {
        Row: {
          id: string;
          tenant_id: string;
          bounty_id: string | null;
          human_id: string | null;
          amount: number;
          currency: string;
          type: "bounty_payment" | "refund" | "bonus" | "penalty" | "hold" | "release";
          status: "pending" | "processing" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          bounty_id?: string | null;
          human_id?: string | null;
          amount: number;
          currency?: string;
          type: "bounty_payment" | "refund" | "bonus" | "penalty" | "hold" | "release";
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          type?: "bounty_payment" | "refund" | "bonus" | "penalty" | "hold" | "release";
          status?: "pending" | "processing" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          metadata?: Record<string, unknown> | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "task_assigned" | "message_received" | "submission_reviewed" | "dispute_raised" | "payment_received" | "deadline_reminder" | "verification_update";
          title: string;
          content: string | null;
          metadata: Record<string, unknown> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "task_assigned" | "message_received" | "submission_reviewed" | "dispute_raised" | "payment_received" | "deadline_reminder" | "verification_update";
          title: string;
          content?: string | null;
          metadata?: Record<string, unknown> | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
  };
}
