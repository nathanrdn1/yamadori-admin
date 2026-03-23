import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies the current request is from an authenticated superadmin.
 * Returns the user_id string if valid, null otherwise.
 * Use in API route handlers before performing any privileged action.
 */
export async function requireSuperadmin(): Promise<string | null> {
  const serverClient = createClient();

  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("superadmins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  return data ? user.id : null;
}
