import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: { id: string };
}

const VALID_PLANS = ["starter", "pro", "agency"] as const;
type Plan = (typeof VALID_PLANS)[number];

function isValidPlan(value: unknown): value is Plan {
  return VALID_PLANS.includes(value as Plan);
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
  const planId: unknown = body?.planId;

  if (!isValidPlan(planId)) {
    return NextResponse.json(
      { error: "planId inválido. Use: starter, pro ou agency." },
      { status: 400 }
    );
  }

  const { id } = params;
  const adminClient = createAdminClient();

  // Upsert so agencies without a subscription record still get one
  const { error } = await adminClient.from("subscriptions").upsert(
    { agency_id: id, plan_id: planId },
    { onConflict: "agency_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the action
  await adminClient.from("activity_logs").insert({
    agency_id: id,
    action: "plan_changed",
    performed_by: superadminId,
    metadata: { plan_id: planId },
  });

  return NextResponse.json({ plan_id: planId });
}
