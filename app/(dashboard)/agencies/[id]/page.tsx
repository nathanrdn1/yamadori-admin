import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import AgencyDetailActions from "@/components/AgencyDetailActions";
import SubscriptionControls from "@/components/SubscriptionControls";
import MembersPanel, { type Member } from "@/components/MembersPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params: { id: string };
}

type Agency = {
  id: string;
  name: string;
  slug: string | null;
  document: string | null;
  document_type: string | null;
  is_active: boolean;
  created_at: string;
};

type Subscription = {
  plan_id: string | null;
  status: string | null;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskDocument(doc: string | null, type: string | null): string {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (type === "cpf" || digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (type === "cnpj" || digits.length === 14) {
    return `**.***.${digits.slice(4, 7)}/${digits.slice(7, 11)}-${digits.slice(12)}`;
  }
  return "*".repeat(Math.max(0, doc.length - 4)) + doc.slice(-4);
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

const PLAN_CLASSES: Record<string, string> = {
  starter: "bg-brand/10 text-brand-light",
  pro: "bg-blue-500/10 text-blue-400",
  agency: "bg-success/10 text-success",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  trialing: "Trial",
  paused: "Pausado",
  cancelled: "Cancelado",
  canceled: "Cancelado",
};

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-success/10 text-success",
  trialing: "bg-warning/10 text-warning",
  paused: "bg-border/60 text-text-muted",
  cancelled: "bg-danger/10 text-danger",
  canceled: "bg-danger/10 text-danger",
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 animate-pulse">
      <div className="px-6 py-4 border-b border-border">
        <div className="h-4 w-32 bg-border/40 rounded" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex px-6 py-4 gap-4">
            <div className="h-4 w-28 bg-border/40 rounded flex-shrink-0" />
            <div className="h-4 w-48 bg-border/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6 animate-pulse">
      <div className="px-6 py-4 border-b border-border">
        <div className="h-4 w-24 bg-border/40 rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-border last:border-0 flex gap-6"
        >
          <div className="h-4 w-36 bg-border/40 rounded" />
          <div className="h-4 w-48 bg-border/40 rounded" />
          <div className="h-4 w-20 bg-border/40 rounded" />
          <div className="h-4 w-24 bg-border/40 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Async sections ───────────────────────────────────────────────────────────

async function SubscriptionSection({ agencyId }: { agencyId: string }) {
  const adminClient = createAdminClient();

  const { data } = (await adminClient
    .from("subscriptions")
    .select("plan_id, status, trial_ends_at, stripe_subscription_id")
    .eq("agency_id", agencyId)
    .limit(1)
    .maybeSingle()) as { data: Subscription | null };

  const planLabel = data?.plan_id
    ? (PLAN_LABELS[data.plan_id] ?? data.plan_id)
    : null;
  const planClass = data?.plan_id ? (PLAN_CLASSES[data.plan_id] ?? "bg-border/40 text-text-muted") : null;
  const statusLabel = data?.status
    ? (STATUS_LABELS[data.status] ?? data.status)
    : null;
  const statusClass = data?.status
    ? (STATUS_CLASSES[data.status] ?? "bg-border/40 text-text-muted")
    : null;

  const rows: Array<{ label: string; value: ReactNode }> = [
    {
      label: "Plano",
      value:
        planLabel && planClass ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planClass}`}
          >
            {planLabel}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      label: "Status",
      value:
        statusLabel && statusClass ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      label: "Trial / Período",
      value: data?.trial_ends_at
        ? new Date(data.trial_ends_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "—",
    },
    {
      label: "Stripe Sub ID",
      value: data?.stripe_subscription_id ? (
        <span className="font-mono text-xs text-text-secondary">
          {data.stripe_subscription_id}
        </span>
      ) : (
        "—"
      ),
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">Assinatura</h2>
      </div>
      <dl className="divide-y divide-border">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center px-6 py-4">
            <dt className="w-40 shrink-0 text-text-secondary text-sm">
              {label}
            </dt>
            <dd className="text-text-primary text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-text-muted mb-3">Ações manuais</p>
        <SubscriptionControls
          agencyId={agencyId}
          currentPlanId={data?.plan_id ?? null}
          currentStatus={data?.status ?? null}
        />
      </div>
    </div>
  );
}

async function MembersSection({ agencyId }: { agencyId: string }) {
  const adminClient = createAdminClient();

  const { data: profiles } = (await adminClient
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: true })) as {
    data: Array<{
      id: string;
      full_name: string | null;
      role: string | null;
      created_at: string;
    }> | null;
  };

  const members: Member[] = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const { data: authData } =
        await adminClient.auth.admin.getUserById(profile.id);
      return {
        id: profile.id,
        full_name: profile.full_name ?? "—",
        role: profile.role ?? "—",
        created_at: profile.created_at,
        email: authData.user?.email ?? "—",
      };
    })
  );

  return <MembersPanel agencyId={agencyId} initialMembers={members} />;
}

async function ActivityLogsSection({ agencyId }: { agencyId: string }) {
  const adminClient = createAdminClient();

  const { data: logs } = (await adminClient
    .from("activity_logs")
    .select("id, action, user_id, metadata, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(20)) as {
    data: Array<{
      id: string;
      action: string;
      user_id: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }> | null;
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">
          Log de atividade
          <span className="ml-2 text-text-muted font-normal">
            (últimas 20 entradas)
          </span>
        </h2>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-text-muted text-sm">
            Nenhuma atividade registrada.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-start gap-4">
              <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-surface-2 text-text-secondary whitespace-nowrap">
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <p className="text-text-muted text-xs font-mono truncate">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
              </div>
              <span className="text-text-muted text-xs whitespace-nowrap flex-shrink-0">
                {new Date(log.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgencyDetailPage({ params }: Props) {
  const adminClient = createAdminClient();

  const { data: agency, error } = (await adminClient
    .from("agencies")
    .select("id, name, slug, document, document_type, is_active, created_at")
    .eq("id", params.id)
    .single()) as { data: Agency | null; error: unknown };

  if (error || !agency) {
    notFound();
  }

  const infoRows: Array<{ label: string; value: ReactNode }> = [
    { label: "Nome", value: agency.name },
    {
      label: "Slug",
      value: agency.slug ? (
        <span className="font-mono text-sm">{agency.slug}</span>
      ) : (
        "—"
      ),
    },
    {
      label: "Documento",
      value: (
        <span className="font-mono text-sm">
          {maskDocument(agency.document, agency.document_type)}
        </span>
      ),
    },
    {
      label: "Status",
      value: agency.is_active ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
          Ativa
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
          Inativa
        </span>
      ),
    },
    {
      label: "Cadastrada em",
      value: new Date(agency.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-text-secondary text-sm mb-6">
        <Link
          href="/agencies"
          className="hover:text-text-primary transition-colors"
        >
          Agências
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-primary">{agency.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{agency.name}</h1>
          <p className="text-text-secondary text-sm mt-1">
            Detalhes e controles da agência
          </p>
        </div>
      </div>

      {/* Section 1 — Agency info */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">
            Dados da agência
          </h2>
        </div>
        <dl className="divide-y divide-border">
          {infoRows.map(({ label, value }) => (
            <div key={label} className="flex items-center px-6 py-4">
              <dt className="w-40 shrink-0 text-text-secondary text-sm">
                {label}
              </dt>
              <dd className="text-text-primary text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 py-4 border-t border-border">
          <AgencyDetailActions
            agencyId={agency.id}
            isActive={agency.is_active}
          />
        </div>
      </div>

      {/* Section 2 — Subscription */}
      <Suspense fallback={<SectionSkeleton rows={4} />}>
        <SubscriptionSection agencyId={params.id} />
      </Suspense>

      {/* Section 3 — Members */}
      <Suspense fallback={<MembersSkeleton />}>
        <MembersSection agencyId={params.id} />
      </Suspense>

      {/* Section 4 — Activity log */}
      <Suspense
        fallback={
          <div className="bg-surface border border-border rounded-xl p-6 animate-pulse">
            <div className="h-4 w-36 bg-border/40 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 w-32 bg-border/40 rounded" />
                  <div className="h-4 w-64 bg-border/40 rounded" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <ActivityLogsSection agencyId={params.id} />
      </Suspense>
    </div>
  );
}
