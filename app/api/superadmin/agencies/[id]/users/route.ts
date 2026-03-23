import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Params {
  params: { id: string };
}

type Body = {
  fullName: string;
  email: string;
  password: string;
  role: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function err(
  message: string,
  status: number,
  field?: string
): NextResponse {
  return NextResponse.json({ error: message, ...(field ? { field } : {}) }, { status });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseBody(raw: unknown): Body | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  if (
    typeof b.fullName !== "string" ||
    typeof b.email !== "string" ||
    typeof b.password !== "string" ||
    typeof b.role !== "string"
  ) {
    return null;
  }
  return {
    fullName: b.fullName,
    email: b.email,
    password: b.password,
    role: b.role,
  };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  // 1. Verify superadmin
  const superadminId = await requireSuperadmin();
  if (!superadminId) {
    return err("Não autorizado.", 401);
  }

  // 2. Parse body
  const raw = await request.json().catch(() => null);
  const body = parseBody(raw);
  if (!body) {
    return err("Corpo da requisição inválido.", 400);
  }

  const { fullName, email, password, role } = body;

  // 3. Validate fields
  if (!fullName.trim()) {
    return err("Nome completo é obrigatório.", 400, "fullName");
  }
  if (!email.trim()) {
    return err("E-mail é obrigatório.", 400, "email");
  }
  if (!isValidEmail(email.trim())) {
    return err("E-mail inválido.", 400, "email");
  }
  if (!password) {
    return err("Senha é obrigatória.", 400, "password");
  }
  if (password.length < 8) {
    return err("Senha deve ter no mínimo 8 caracteres.", 400, "password");
  }
  if (role !== "admin" && role !== "analyst") {
    return err("Função inválida. Use 'admin' ou 'analyst'.", 400, "role");
  }

  const agencyId = params.id;
  const adminClient = createAdminClient();

  // 4. Verify agency exists
  const { data: agency, error: agencyError } = await adminClient
    .from("agencies")
    .select("id")
    .eq("id", agencyId)
    .single();

  if (agencyError || !agency) {
    return err("Agência não encontrada.", 404);
  }

  // 5. Create auth user (email pre-confirmed, no welcome email)
  const { data: authData, error: createError } =
    await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        role,
      },
    });

  if (createError) {
    // Supabase returns a specific message for duplicate emails
    if (
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("duplicate") ||
      createError.message.toLowerCase().includes("email")
    ) {
      return err("Este e-mail já está cadastrado.", 409, "email");
    }
    return err(createError.message, 500);
  }

  const newUser = authData.user;
  if (!newUser) {
    return err("Falha ao criar o usuário.", 500);
  }

  // 6. Upsert profile with agency binding
  //    (Supabase may auto-create a profile via trigger — upsert covers both cases)
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(
      {
        id: newUser.id,
        full_name: fullName.trim(),
        role,
        agency_id: agencyId,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    // User was created but profile failed — attempt cleanup to avoid orphan
    await adminClient.auth.admin.deleteUser(newUser.id);
    return err("Erro ao criar o perfil do usuário.", 500);
  }

  // 7. Log the action (fire-and-forget — never block the response on this)
  void adminClient.from("activity_logs").insert({
    agency_id: agencyId,
    action: "user_created_by_superadmin",
    performed_by: superadminId,
    metadata: {
      email: email.trim().toLowerCase(),
      role,
      agency_id: agencyId,
    },
  });

  // 8. Return created user (never include password in response)
  return NextResponse.json(
    {
      ok: true,
      user: {
        id: newUser.id,
        email: newUser.email ?? email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
      },
    },
    { status: 201 }
  );
}
