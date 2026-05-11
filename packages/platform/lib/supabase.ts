import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | undefined;

function getClient() {
  if (_client) return _client;
  try {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  } catch {
    _client = null as any;
  }
  return _client;
}

const handler: ProxyHandler<object> = {
  get(_, prop: string) {
    const client = getClient();
    if (!client) return (..._args: any[]) => ({ data: null, error: new Error("Supabase not configured") });
    return Reflect.get(client, prop, client);
  },
};

export const supabase = new Proxy({}, handler) as ReturnType<typeof createBrowserClient>;
export { getClient as createClient };
