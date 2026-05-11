function getApiKey() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('api_key');
}

function getAuthHeaders(): Record<string, string> {
  const key = getApiKey();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return headers;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authDataStr = localStorage.getItem('auth_data');
    if (!authDataStr) return null;
    const authData = JSON.parse(authDataStr);
    return authData.user?.id || authData.user?.human_id || null;
  } catch {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}