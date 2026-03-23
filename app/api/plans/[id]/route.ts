import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanUpdate = {
  name?: string;
  max_analysts?: number | null;
  max_clients?: number | null;
  max_reports_per_month?: number | null;
  has_ai?: boolean;
  has_priority_support?: boolean;
  is_active?: boolean;
};

// ─── Validation ───────────────────────────────────────────────────────────────

function sanitizeBody(raw: unknown): PlanUpdate {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const body = raw as Record<string, unknown>;
  const update: PlanUpdate = {};

  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim();
  }

  const numericFields = [
    "max_analysts",
    "max_clients",
    "max_reports_per_month",
  ] as const;

  for (const field of numericFields) {
    if (!(field in body)) continue;
    const val = body[field];
    if (val === null) {
      update[field] = null;
    } else if (typeof val === "number" && Number.isFinite(val)) {
      update[field] = Math.max(0, Math.trunc(val));
    }
  }

  if (typeof body.has_ai === "boolean") update.has_ai = body.has_ai;
  if (typeof body.has_priority_support === "boolean")
    update.has_priority_support = body.has_priority_support;
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  return update;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

interface Params {
  params: { id: string };
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
  const update = sanitizeBody(body);

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo válido enviado." },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("plans")
    .update(update)
    .eq("id", params.id)
    .select(
      "id, name, max_analysts, max_clients, max_reports_per_month, has_ai, has_priority_support, is_active, sort_order"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Plano não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
