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
          contact_email: string;
          is_active: boolean;
          payment_enabled: boolean;
          payment_provider: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          api_key: string;
          api_key_prefix?: string;
          contact_email?: string;
          is_active?: boolean;
          payment_enabled?: boolean;
          payment_provider?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          api_key?: string;
          api_key_prefix?: string;
          contact_email?: string;
          is_active?: boolean;
          payment_enabled?: boolean;
          payment_provider?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          user_type: "agent" | "human";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          user_type: "agent" | "human";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          avatar_url?: string | null;
          user_type?: "agent" | "human";
          is_active?: boolean;
        };
      };
      human_profiles: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          skills?: string[];
          location_city?: string | null;
          location_country?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          timezone?: string | null;
          is_available?: boolean;
          notification_slack?: boolean;
          notification_telegram?: boolean;
          notification_email?: boolean;
          notification_phone?: boolean;
          notification_preferred_channels?: string[];
          total_tasks_completed?: number;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          skills?: string[];
          location_city?: string | null;
          location_country?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          timezone?: string | null;
          is_available?: boolean;
          notification_slack?: boolean;
          notification_telegram?: boolean;
          notification_email?: boolean;
          notification_phone?: boolean;
          notification_preferred_channels?: string[];
          total_tasks_completed?: number;
          rating?: number | null;
          updated_at?: string;
        };
      };
      bounties: {
        Row: {
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
          price_type: string;
          price: number | null;
          currency: string;
          status: string;
          payment_status: string;
          evidence_required: string[];
          task_template: string | null;
          steps: string[];
          completion_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          agent_id?: string | null;
          assigned_human_id?: string | null;
          title: string;
          description: string;
          requirements?: string[];
          category?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_instructions?: string | null;
          is_remote?: boolean;
          deadline?: string | null;
          estimated_hours?: number | null;
          price_type?: string;
          price?: number | null;
          currency?: string;
          status?: string;
          payment_status?: string;
          evidence_required?: string[];
          task_template?: string | null;
          steps?: string[];
          completion_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assigned_human_id?: string | null;
          title?: string;
          description?: string;
          requirements?: string[];
          category?: string | null;
          location_city?: string | null;
          location_country?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_instructions?: string | null;
          is_remote?: boolean;
          deadline?: string | null;
          estimated_hours?: number | null;
          price_type?: string;
          price?: number | null;
          currency?: string;
          status?: string;
          payment_status?: string;
          evidence_required?: string[];
          task_template?: string | null;
          steps?: string[];
          completion_code?: string | null;
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
        };
        Update: {
          content?: string | null;
          media_urls?: string[];
          status?: "submitted" | "approved" | "rejected";
          reviewer_notes?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          bounty_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          sender_id: string;
          content: string;
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
          evidence_urls: string[];
          status: string;
          resolution: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          bounty_id: string;
          raised_by: string;
          reason: string;
          evidence_urls?: string[];
          status?: string;
          resolution?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          reason?: string;
          evidence_urls?: string[];
          status?: string;
          resolution?: string | null;
          resolved_at?: string | null;
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
    };
  };
}
