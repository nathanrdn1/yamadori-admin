import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: { id: string };
}

export async function PATCH(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const superadminId = await requireSuperadmin();
  if (!superadminId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = params;
  const adminClient = createAdminClient();

  // Fetch current state
  const { data: agency, error: fetchError } = await adminClient
    .from("agencies")
    .select("is_active")
    .eq("id", id)
    .single();

  if (fetchError || !agency) {
    return NextResponse.json({ error: "Agência não encontrada." }, { status: 404 });
  }

  const newIsActive = !agency.is_active;

  const { error: updateError } = await adminClient
    .from("agencies")
    .update({ is_active: newIsActive })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the action
  await adminClient.from("activity_logs").insert({
    agency_id: id,
    action: newIsActive ? "agency_activated" : "agency_deactivated",
    user_id: superadminId,
    metadata: { is_active: newIsActive },
  });

  return NextResponse.json({ is_active: newIsActive });
}
