import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: { id: string };
}

export async function POST(
  _request: NextRequest,
  { params }: Params
): Promise<NextResponse> {
  const superadminId = await requireSuperadmin();
  if (!superadminId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id: agencyId } = params;
  const adminClient = createAdminClient();

  // Find the agency's primary admin user
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("role", "admin")
    .limit(1)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Nenhum usuário admin encontrado para esta agência." },
      { status: 404 }
    );
  }

  // Resolve the auth user to get the email
  const { data: authData, error: authError } =
    await adminClient.auth.admin.getUserById(profile.id);

  if (authError || !authData.user?.email) {
    return NextResponse.json(
      { error: "Não foi possível obter o email do admin." },
      { status: 500 }
    );
  }

  const { email } = authData.user;

  // Generate a magic link that signs the user in on the target app
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: appUrl ? `${appUrl}/dashboard` : undefined,
      },
    });

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.json(
      { error: "Erro ao gerar o link de acesso." },
      { status: 500 }
    );
  }

  // Always log impersonation attempts
  await adminClient.from("impersonation_logs").insert({
    superadmin_id: superadminId,
    agency_id: agencyId,
    target_user_id: profile.id,
    target_email: email,
  });

  return NextResponse.json({ url: linkData.properties.action_link });
}
