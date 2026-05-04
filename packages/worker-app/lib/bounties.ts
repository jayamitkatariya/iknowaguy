import { supabase } from "./supabase";

export async function getOpenBounties() {
  const { data: bounties, error } = await supabase
    .from("bounties")
    .select(`
      id,
      title,
      description,
      instructions,
      reward_amount,
      currency,
      deadline,
      status,
      category_id,
      created_at
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return bounties || [];
}

export async function getCategories() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, icon, slug")
    .order("name");

  if (error) throw error;
  return categories || [];
}

export async function acceptBounty(bountyId: string, humanId: string) {
  const { data, error } = await supabase
    .from("bounties")
    .update({
      status: "assigned",
      assigned_human_id: humanId,
    })
    .eq("id", bountyId)
    .eq("status", "open")
    .select()
    .single();

  if (error) throw error;
  return data;
}
