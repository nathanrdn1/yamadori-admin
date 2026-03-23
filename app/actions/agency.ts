"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateAgencyStatus(
  id: string,
  status: "active" | "suspended"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("agencies")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/agencies/${id}`);
  revalidatePath("/agencies");
}

export async function updateAgencyPlan(id: string, plan: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("agencies")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/agencies/${id}`);
  revalidatePath("/agencies");
  revalidatePath("/plans");
}
