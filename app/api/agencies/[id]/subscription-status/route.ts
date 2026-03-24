import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: { id: string };
}

const VALID_STATUSES = ["trialing", "active", "paused", "cancelled"] as const;
type SubStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is SubStatus {
  return VALID_STATUSES.includes(value as SubStatus);
}

export async function PATCH(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const superadminId = await requireSuperadmin();
  if (!superadminId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status: unknown = body?.status;

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { error: "Status inválido. Use: trialing, active, paused ou cancelled." },
      { status: 400 }
    );
  }

  const { id } = params;
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("subscriptions")
    .update({ status })
    .eq("agency_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await adminClient.from("activity_logs").insert({
    agency_id: id,
    action: "subscription_status_forced",
    user_id: superadminId,
    metadata: { status },
  });

  return NextResponse.json({ status });
}
