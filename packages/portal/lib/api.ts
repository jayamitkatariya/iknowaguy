// API client for portal — MCP/REST API calls for agent features

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    // Get stored API key from localStorage and attach as Bearer token
    let apiKey = "";
    if (typeof window !== "undefined") {
      apiKey = localStorage.getItem("api_key") || "";
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
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
