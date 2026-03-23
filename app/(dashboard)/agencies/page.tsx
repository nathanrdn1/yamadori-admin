import { createAdminClient } from "@/lib/supabase/admin";
import { Suspense } from "react";
import AgenciesTable, { type AgencyRow } from "@/components/AgenciesTable";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div>
      {/* Toolbar skeleton */}
      <div className="mb-6 flex items-center gap-3 animate-pulse">
        <div className="h-9 w-64 bg-border/40 rounded-lg" />
        <div className="h-9 w-80 bg-border/40 rounded-lg" />
        <div className="ml-auto h-4 w-24 bg-border/40 rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
        <div className="border-b border-border px-6 py-3 flex gap-8">
          {["Nome", "Plano", "Status", "Membros", "Criada em", ""].map((h) => (
            <div key={h} className="h-3 w-16 bg-border/40 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="px-6 py-4 border-b border-border last:border-0 flex items-center gap-8"
          >
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-border/40 rounded" />
              <div className="h-3 w-24 bg-border/40 rounded" />
            </div>
            <div className="h-5 w-16 bg-border/40 rounded-full" />
            <div className="h-5 w-16 bg-border/40 rounded-full" />
            <div className="h-4 w-8 bg-border/40 rounded" />
            <div className="h-4 w-20 bg-border/40 rounded" />
            <div className="h-4 w-20 bg-border/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function AgenciesContent() {
  const supabase = createAdminClient();

  const [agenciesRes, subsRes, profilesRes] = await Promise.all([
    supabase
      .from("agencies")
      .select("id, name, document, document_type, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("agency_id, plan_id, status"),
    supabase.from("profiles").select("agency_id"),
  ]);

  if (agenciesRes.error) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-danger text-sm">
        Erro ao carregar agências: {agenciesRes.error.message}
      </div>
    );
  }

  // Index subscriptions by agency_id (keep most recent if multiple)
  type SubRow = { agency_id: string; plan_id: string | null; status: string | null };
  const subsMap = new Map<string, SubRow>();
  for (const sub of (subsRes.data ?? []) as SubRow[]) {
    if (!subsMap.has(sub.agency_id)) {
      subsMap.set(sub.agency_id, sub);
    }
  }

  // Count members per agency
  const memberCounts = new Map<string, number>();
  for (const profile of (profilesRes.data ?? []) as Array<{
    agency_id: string | null;
  }>) {
    if (profile.agency_id) {
      memberCounts.set(
        profile.agency_id,
        (memberCounts.get(profile.agency_id) ?? 0) + 1
      );
    }
  }

  type RawAgency = {
    id: string;
    name: string;
    document: string | null;
    document_type: string | null;
    is_active: boolean;
    created_at: string;
  };

  const rows: AgencyRow[] = (agenciesRes.data as RawAgency[]).map((a) => {
    const sub = subsMap.get(a.id);
    return {
      id: a.id,
      name: a.name,
      document: a.document,
      document_type: a.document_type,
      is_active: a.is_active,
      created_at: a.created_at,
      subscription_plan_id: sub?.plan_id ?? null,
      subscription_status: sub?.status ?? null,
      member_count: memberCounts.get(a.id) ?? 0,
    };
  });

  return <AgenciesTable agencies={rows} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgenciesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Agências</h1>
        <p className="text-text-secondary text-sm mt-1">
          Todas as agências cadastradas na plataforma
        </p>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AgenciesContent />
      </Suspense>
    </div>
  );
}
