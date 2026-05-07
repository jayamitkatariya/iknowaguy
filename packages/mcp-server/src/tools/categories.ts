import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";

export const CategoryListSchema = z.object({
  limit: z.number().optional().default(50).describe("Max results"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

export const CategoryGetSchema = z.object({
  category_id: z.string().describe("Category UUID or slug"),
});

export async function handleListCategories(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .range(args.offset ?? 0, (args.offset ?? 0) + (args.limit ?? 50) - 1);

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ categories: data ?? [], total: data?.length ?? 0 }, null, 2) },
    ],
  };
}

export async function handleGetCategory(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.category_id);

  let query = supabase.from("categories").select("*");
  if (isUuid) {
    query = query.eq("id", args.category_id);
  } else {
    query = query.eq("slug", args.category_id);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Category not found" }) }] };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ category: data }, null, 2) }],
  };
}

export function registerCategoryTools(server: McpServer) {
  server.tool(
    "list_categories",
    "List all available categories",
    CategoryListSchema.shape,
    async (args) => handleListCategories(args, process.env.DEFAULT_TENANT_ID || "")
  );

  server.tool(
    "get_category",
    "Get a specific category by ID or slug",
    CategoryGetSchema.shape,
    async (args) => handleGetCategory(args, process.env.DEFAULT_TENANT_ID || "")
  );
}
