// API client for portal — MCP/REST API calls for agent features

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
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
