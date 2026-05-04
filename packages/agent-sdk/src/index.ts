/**
 * HireAHuman Agent SDK
 * 
 * A TypeScript SDK for AI agents to interact with HireAHuman without needing native MCP support.
 * Agents can use this SDK to list humans, create bounties, manage tasks, and more.
 * 
 * @example
 * ```typescript
 * import { HireAHumanClient } from '@hireahuman/sdk';
 * 
 * const client = new HireAHumanClient({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'http://localhost:3000'
 * });
 * 
 * // List available humans
 * const humans = await client.listHumans({
 *   skills: ['delivery', 'photography'],
 *   location_city: 'New York'
 * });
 * 
 * // Create a bounty
 * const bounty = await client.createBounty({
 *   title: 'Deliver groceries',
 *   description: 'Need someone to pick up groceries',
 *   tenant_id: 'your-tenant-id'
 * });
 * ```
 */

export interface HumanFilter {
  skills?: string[];
  location_city?: string;
  location_lat?: number;
  location_lng?: number;
  is_available?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateBountyParams {
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
  price_type?: 'fixed' | 'hourly' | 'negotiable';
  price?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
  evidence_required?: string[];
  task_template?: string;
  steps?: string[];
  tenant_id: string;
  agent_id?: string;
}

export interface BountyFilter {
  tenant_id: string;
  status?: string;
  category?: string;
  location_city?: string;
  limit?: number;
  offset?: number;
}

export interface CompleteBountyParams {
  bounty_id: string;
  submitted_by: string;
  evidence_urls?: string[];
  notes?: string;
  completion_code?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ReviewBountyParams {
  bounty_id: string;
  decision: 'approved' | 'rejected' | 'revision_requested';
  notes?: string;
  reviewer_id: string;
}

export interface SendMessageParams {
  bounty_id: string;
  sender_id: string;
  content: string;
}

export interface CreateDisputeParams {
  bounty_id: string;
  raised_by: string;
  reason: string;
  evidence_urls?: string[];
}

export interface InitiatePaymentParams {
  bounty_id: string;
  amount: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * HireAHumanClient - Main SDK class for interacting with HireAHuman
 */
export class HireAHumanClient {
  private apiKey: string;
  private baseUrl: string;

  constructor({ apiKey, baseUrl = 'http://localhost:3000' }: { apiKey: string; baseUrl?: string }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}: ${response.statusText}` };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // ============ Human Workers ============

  /**
   * List available human workers with optional filters
   */
  async listHumans(filters?: HumanFilter): Promise<ApiResponse<{ humans: unknown[]; total: number }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.skills?.length) params.append('skills', filters.skills.join(','));
      if (filters.location_city) params.append('location_city', filters.location_city);
      if (filters.location_lat != null) params.append('location_lat', String(filters.location_lat));
      if (filters.location_lng != null) params.append('location_lng', String(filters.location_lng));
      if (filters.is_available != null) params.append('is_available', String(filters.is_available));
      if (filters.limit != null) params.append('limit', String(filters.limit));
      if (filters.offset != null) params.append('offset', String(filters.offset));
    }

    const queryString = params.toString();
    const endpoint = `/tools/call?tool=humans_list${queryString ? '&' + queryString : ''}`;
    
    // Use POST for tool calls
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    });
  }

  // ============ Bounties ============

  /**
   * Create a new bounty task
   */
  async createBounty(params: CreateBountyParams): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'bounties_create',
        params,
      }),
    });
  }

  /**
   * List bounties with optional filters
   */
  async listBounties(filters: BountyFilter): Promise<ApiResponse<{ bounties: unknown[]; total: number }>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'bounties_list',
        params: filters,
      }),
    });
  }

  /**
   * Accept a bounty and assign it to a human worker
   */
  async acceptBounty(bountyId: string, humanId: string): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'bounties_accept',
        params: { bounty_id: bountyId, human_id: humanId },
      }),
    });
  }

  /**
   * Submit completion for a bounty with evidence
   */
  async completeBounty(bountyId: string, submittedBy: string, evidence?: string[], notes?: string): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'bounties_complete',
        params: {
          bounty_id: bountyId,
          submitted_by: submittedBy,
          evidence_urls: evidence || [],
          notes,
        },
      }),
    });
  }

  /**
   * Review a submitted bounty
   */
  async reviewBounty(params: ReviewBountyParams): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'bounties_review',
        params,
      }),
    });
  }

  // ============ Messages ============

  /**
   * Send a message in a bounty thread
   */
  async sendMessage(bountyId: string, senderId: string, content: string): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'messages_send',
        params: {
          bounty_id: bountyId,
          sender_id: senderId,
          content,
        },
      }),
    });
  }

  // ============ Disputes ============

  /**
   * Create a dispute for a bounty
   */
  async createDispute(params: CreateDisputeParams): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'disputes_create',
        params,
      }),
    });
  }

  // ============ Payments ============

  /**
   * Initiate payment for a bounty
   */
  async initiatePayment(bountyId: string, amount: number, currency: 'USD' | 'EUR' | 'GBP' | 'INR' = 'USD'): Promise<ApiResponse<unknown>> {
    return this.request('/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        tool: 'payments_initiate',
        params: {
          bounty_id: bountyId,
          amount,
          currency,
        },
      }),
    });
  }
}

export default HireAHumanClient;
