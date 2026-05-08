/**
 * iknowaguy Agent SDK
 *
 * A TypeScript SDK for AI agents to interact with iknowaguy via JSON-RPC 2.0 over MCP.
 *
 * @example
 * ```typescript
 * import { iknowaguyClient } from '@iknowaguy/sdk';
 *
 * const client = new iknowaguyClient({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'http://localhost:3001'
 * });
 *
 * const humans = await client.listHumans({
 *   skills: ['delivery', 'photography'],
 *   location_city: 'New York'
 * });
 *
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
  id: string;
  content: string;
  media_urls?: string[];
  completion_code?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ReviewBountyParams {
  id: string;
  decision: 'approved' | 'rejected';
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
  description: string;
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

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

export class iknowaguyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor({ apiKey, baseUrl = 'http://localhost:3001' }: { apiKey: string; baseUrl?: string }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private jsonRpcId = 0;

  private async rpcrequest<T>(method: string, toolName: string, args: Record<string, unknown> | object): Promise<ApiResponse<T>> {
    const body = {
      jsonrpc: '2.0',
      id: ++this.jsonRpcId,
      method,
      params: {
        name: toolName,
        arguments: args as Record<string, unknown>,
      },
    };

    const url = `${this.baseUrl}/mcp`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    let lastError: string = '';
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error || `HTTP ${response.status}: ${response.statusText}` };
        }

        if (data.error) {
          return { error: data.error.message || JSON.stringify(data.error) };
        }

        return { data: data.result };
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = `Request timed out after ${TIMEOUT_MS}ms`;
        } else if (err instanceof Error) {
          lastError = err.message;
        } else {
          lastError = String(err);
        }
        if (attempt < MAX_RETRIES) continue;
      }
    }

    return { error: lastError };
  }

  // ============ Human Workers ============

  async listHumans(filters?: HumanFilter): Promise<ApiResponse<{ humans: unknown[]; total: number }>> {
    return this.rpcrequest('tools/call', 'list_humans', filters || {});
  }

  async getHuman(humanId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'get_human', { human_id: humanId });
  }

  // ============ Bounties ============

  async createBounty(params: CreateBountyParams): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'create_bounty', params);
  }

  async listBounties(filters: BountyFilter): Promise<ApiResponse<{ bounties: unknown[]; total: number }>> {
    return this.rpcrequest('tools/call', 'list_bounties', filters);
  }

  async acceptBounty(bountyId: string, humanId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'accept_bounty', {
      id: bountyId,
      assigned_human_id: humanId,
    });
  }

  async completeBounty(params: CompleteBountyParams): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'submit_bounty', {
      id: params.id,
      content: params.content,
      media_urls: params.media_urls || [],
    });
  }

  async reviewBounty(params: ReviewBountyParams): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'review_bounty', params);
  }

  // ============ Messages ============

  async sendMessage(bountyId: string, senderId: string, content: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'send_message', {
      bounty_id: bountyId,
      sender_id: senderId,
      content,
    });
  }

  // ============ Disputes ============

  async createDispute(params: CreateDisputeParams): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'raise_dispute', {
      bounty_id: params.bounty_id,
      description: params.description,
      evidence_urls: params.evidence_urls || [],
    });
  }

  // ============ Payments ============

  async initiatePayment(bountyId: string, amount: number, currency: 'USD' | 'EUR' | 'GBP' | 'INR' = 'USD'): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'initiate_payment', {
      bounty_id: bountyId,
      amount,
      currency,
    });
  }

  // ============ Additional Methods ============

  async requestHuman(filters?: HumanFilter): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'request_human', filters || {});
  }

  async getBounty(id: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'get_bounty', { id });
  }

  async listCategories(): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'list_categories', {});
  }

  async getCategory(id: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'get_category', { id });
  }

  async listMessages(bountyId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'list_messages', { bounty_id: bountyId });
  }

  async getPaymentStatus(bountyId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'get_payment_status', { bounty_id: bountyId });
  }

  async releasePayment(bountyId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'release_payment', { bounty_id: bountyId });
  }

  async refundPayment(bountyId: string): Promise<ApiResponse<unknown>> {
    return this.rpcrequest('tools/call', 'refund_payment', { bounty_id: bountyId });
  }
}

export default iknowaguyClient;