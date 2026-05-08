/**
 * SSE (Server-Sent Events) realtime subsystem.
 *
 * Broadcasts bounty state-change events to all connected SSE clients.
 * Clients connect to GET /events and receive event streams for:
 *   - bounty.created
 *   - bounty.accepted
 *   - bounty.submitted
 *   - bounty.approved
 *   - bounty.rejected
 *   - bounty.disputed
 *   - bounty.cancelled
 *
 * Usage:
 *   import { sseEmitter } from "./lib/sse";
 *   sseEmitter.broadcast("bounty.created", tenantId, { bounty_id, title, ... });
 */

// ── Event types ─────────────────────────────────────────────────────────────────

export type BountyEventType =
  | "bounty.created"
  | "bounty.accepted"
  | "bounty.submitted"
  | "bounty.approved"
  | "bounty.rejected"
  | "bounty.disputed"
  | "bounty.cancelled"
  | "bounty.refunded";

export interface BountyEvent {
  type: BountyEventType;
  timestamp: string; // ISO 8601
  tenant_id: string;
  data: Record<string, any>;
}

// ── SSE client ──────────────────────────────────────────────────────────────────

interface SseClient {
  id: string;
  tenantId: string | null; // null = global (all events)
  response: import("express").Response;
}

/**
 * Singleton emitter that manages SSE client connections and broadcasts.
 */
export class SseEmitter {
  private clients = new Map<string, SseClient>();
  private nextId = 1;

  /**
   * Register a new SSE client connection.
   * @param tenantId Optional tenant filter. If null, client receives all events.
   */
  addClient(tenantId: string | null, response: import("express").Response): string {
    const id = `client_${this.nextId++}`;
    const client: SseClient = { id, tenantId, response };

    // Set SSE headers
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    response.flushHeaders();

    // Send initial keepalive comment
    response.write(`: connected\n\n`);

    this.clients.set(id, client);
    console.log(`[sse] Client connected: ${id} (tenant=${tenantId ?? "*"})`);

    return id;
  }

  /**
   * Remove a client by id (e.g. on disconnect).
   */
  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client) {
      client.response.end();
      this.clients.delete(id);
      console.log(`[sse] Client disconnected: ${id}`);
    }
  }

  /**
   * Broadcast an event to all matching clients.
   * - Clients with tenantId === null receive all events.
   * - Clients with tenantId === event.tenant_id receive that event.
   */
  broadcast(type: BountyEventType, tenantId: string, data: Record<string, any>): void {
    const event: BountyEvent = {
      type,
      timestamp: new Date().toISOString(),
      tenant_id: tenantId,
      data,
    };

    const payload = `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;

    const clientArray = Array.from(this.clients.values());
    for (const client of clientArray) {
      // Global clients receive everything; tenant clients only their tenant's events
      if (client.tenantId === null || client.tenantId === tenantId) {
        try {
          client.response.write(payload);
        } catch (err) {
          console.warn(`[sse] Failed to write to client ${client.id}, removing:`, err);
          this.clients.delete(client.id);
        }
      }
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

// ── Singleton instance ──────────────────────────────────────────────────────────

export const sseEmitter = new SseEmitter();
