import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Suspense } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  starter: 97,
  pro: 147,
  agency: 297,
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4 animate-pulse"
        >
          <div className="w-10 h-10 rounded-lg bg-border/40 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-border/40 rounded" />
            <div className="h-7 w-16 bg-border/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GrowthSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-8 animate-pulse">
      <div className="h-5 w-64 bg-border/40 rounded mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-16 bg-border/40 rounded flex-shrink-0" />
            <div className="flex-1 h-5 bg-border/40 rounded-full" />
            <div className="h-3 w-6 bg-border/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TrialsSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-border">
        <div className="h-5 w-52 bg-border/40 rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-border last:border-0 flex items-center justify-between"
        >
          <div className="space-y-2">
            <div className="h-4 w-44 bg-border/40 rounded" />
            <div className="h-3 w-28 bg-border/40 rounded" />
          </div>
          <div className="h-8 w-24 bg-border/40 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── Async sections ───────────────────────────────────────────────────────────

async function MetricCards() {
  const supabase = createAdminClient();

  const [activeAgenciesRes, trialCountRes, activeSubsRes] = await Promise.all([
    supabase
      .from("agencies")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "trialing"),
    supabase.from("subscriptions").select("plan_id").eq("status", "active"),
  ]);

  const totalActive = activeAgenciesRes.count ?? 0;
  const totalTrialing = trialCountRes.count ?? 0;
  const activeSubs = (activeSubsRes.data ?? []) as Array<{
    plan_id: string | null;
  }>;
  const totalPaid = activeSubs.length;

  const mrr = activeSubs.reduce(
    (sum, sub) => sum + (PLAN_PRICES[sub.plan_id ?? ""] ?? 0),
    0
  );
  const mrrStr =
    "R$ " +
    mrr.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const cards = [
    {
      label: "Agências ativas",
      value: totalActive.toLocaleString("pt-BR"),
      colorClass: "text-brand-light",
      bgClass: "bg-brand/10",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 21h18M3 7l9-4 9 4M4 21V7m16 14V7M9 21V9h6v12"
          />
        </svg>
      ),
    },
    {
      label: "Trials ativos",
      value: totalTrialing.toLocaleString("pt-BR"),
      colorClass: "text-warning",
      bgClass: "bg-warning/10",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          />
        </svg>
      ),
    },
    {
      label: "Assinantes pagos",
      value: totalPaid.toLocaleString("pt-BR"),
      colorClass: "text-success",
      bgClass: "bg-success/10",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          />
        </svg>
      ),
    },
    {
      label: "MRR estimado",
      value: mrrStr,
      colorClass: "text-brand-light",
      bgClass: "bg-brand/10",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4"
        >
          <div
            className={`p-2.5 rounded-lg flex-shrink-0 ${card.bgClass} ${card.colorClass}`}
          >
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-text-secondary text-sm truncate">{card.label}</p>
            <p className="text-xl font-bold text-text-primary mt-0.5 truncate">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function GrowthChart() {
  const supabase = createAdminClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data: agencies } = (await supabase
    .from("agencies")
    .select("created_at")
    .gte("created_at", sixMonthsAgo.toISOString())) as {
    data: Array<{ created_at: string }> | null;
  };

  // Build ordered month buckets (last 6 months)
  const buckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const agency of agencies ?? []) {
    const d = new Date(agency.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  const rows = Array.from(buckets.entries()).map(([key, count]) => {
    const [yr, mo] = key.split("-").map(Number);
    const label = new Date(yr, mo - 1, 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    return { key, label, count };
  });

  const maxCount = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-8">
      <h2 className="text-base font-semibold text-text-primary mb-5">
        Crescimento — agências por mês (últimos 6 meses)
      </h2>
      <div className="space-y-3">
        {rows.map(({ key, label, count }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-text-secondary text-xs w-[5.5rem] flex-shrink-0 capitalize">
              {label}
            </span>
            <div className="flex-1 h-5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand/50 rounded-full transition-all"
                style={{
                  width:
                    count === 0
                      ? "0%"
                      : `${Math.max((count / maxCount) * 100, 3)}%`,
                }}
              />
            </div>
            <span className="text-text-primary text-sm font-semibold w-7 text-right tabular-nums">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function ExpiringTrials() {
  const supabase = createAdminClient();

  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  const { data: subs } = (await supabase
    .from("subscriptions")
    .select("agency_id, plan_id, trial_ends_at")
    .eq("status", "trialing")
    .lte("trial_ends_at", threeDaysFromNow.toISOString())
    .order("trial_ends_at", { ascending: true })) as {
    data: Array<{
      agency_id: string;
      plan_id: string | null;
      trial_ends_at: string;
    }> | null;
  };

  if (!subs || subs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            Trials expirando em breve
          </h2>
        </div>
        <div className="px-6 py-10 text-center">
          <p className="text-text-muted text-sm">
            Nenhum trial expirando nos próximos 3 dias.
          </p>
        </div>
      </div>
    );
  }

  const agencyIds = [...new Set(subs.map((s) => s.agency_id))];
  const { data: agencies } = (await supabase
    .from("agencies")
    .select("id, name")
    .in("id", agencyIds)) as {
    data: Array<{ id: string; name: string }> | null;
  };

  const agencyMap = new Map((agencies ?? []).map((a) => [a.id, a.name]));
  const nowMs = now.getTime();

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <h2 className="text-base font-semibold text-text-primary">
          Trials expirando em breve
        </h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
          {subs.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {subs.map((sub) => {
          const name = agencyMap.get(sub.agency_id) ?? "—";
          const endsAt = new Date(sub.trial_ends_at);
          const msLeft = endsAt.getTime() - nowMs;
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

          return (
            <div
              key={sub.agency_id}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-text-primary font-medium text-sm">{name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {sub.plan_id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light capitalize">
                      {sub.plan_id}
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      daysLeft <= 0 ? "text-danger" : "text-warning"
                    }`}
                  >
                    {daysLeft <= 0
                      ? "Expirado"
                      : daysLeft === 1
                      ? "1 dia restante"
                      : `${daysLeft} dias restantes`}
                  </span>
                </div>
              </div>
              <Link
                href={`/agencies/${sub.agency_id}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-light border border-brand/30 hover:bg-brand/10 transition-colors"
              >
                Ver agência
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Dashboard Global
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Visão geral da plataforma Yamadori
        </p>
      </div>

      <Suspense fallback={<MetricCardsSkeleton />}>
        <MetricCards />
      </Suspense>

      <Suspense fallback={<GrowthSkeleton />}>
        <GrowthChart />
      </Suspense>

      <Suspense fallback={<TrialsSkeleton />}>
        <ExpiringTrials />
      </Suspense>
    </div>
  );
}
