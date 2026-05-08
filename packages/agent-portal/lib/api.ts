// API client for agent-portal — all requests go through this

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

function getAuthHeaders(): HeadersInit {
  const apiKey = getCookie("hah_api_key");
  const tenantId = getCookie("hah_tenant_id");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }

  return headers;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    const json = await res.json();

    if (!res.ok) {
      return { error: json.error || `HTTP ${res.status}` };
    }

    return { data: json.data || json };
  } catch (err: any) {
    return { error: err.message };
  }
}

// Auth
export async function login(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, slug: string, email: string, password: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, slug, email, password }),
  });
}

// Bounties
export async function listBounties(params?: { status?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/api/bounties${query}`);
}

export async function createBounty(bounty: {
  title: string;
  description: string;
  instructions?: string;
  category_id?: string;
  reward_amount: number;
  currency?: string;
  deadline?: string;
}) {
  return apiFetch("/api/bounties", {
    method: "POST",
    body: JSON.stringify(bounty),
  });
}

// API Keys
export async function getAccountInfo() {
  return apiFetch("/auth/me");
}
