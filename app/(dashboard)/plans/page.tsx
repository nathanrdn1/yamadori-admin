import { createAdminClient } from "@/lib/supabase/admin";
import PlansClient, { type Plan } from "@/components/PlansClient";

export default async function PlansPage() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("plans")
    .select(
      "id, name, max_analysts, max_clients, max_reports_per_month, has_ai, has_priority_support, is_active, sort_order"
    )
    .order("sort_order", { ascending: true });

  const plans = (data ?? []) as Plan[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Planos</h1>
        <p className="text-text-secondary text-sm mt-1">
          Gerenciar configurações e limites dos planos da plataforma
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-danger/10 border border-danger/20 rounded-xl px-5 py-3 text-danger text-sm">
          Erro ao carregar planos: {error.message}
        </div>
      )}

      <PlansClient initialPlans={plans} />
    </div>
  );
}
