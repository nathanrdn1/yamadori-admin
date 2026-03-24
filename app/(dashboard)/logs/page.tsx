import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Suspense } from "react";
import LogsFilters from "@/components/LogsFilters";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: {
    action?: string;
    agency_id?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}

type ActivityLog = {
  id: string;
  action: string;
  user_id: string | null;
  agency_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  agencies: { id: string; name: string } | null;
  profiles: { id: string; full_name: string | null } | null;
};

type ImpersonationLog = {
  id: string;
  superadmin_id: string | null;
  agency_id: string | null;
  target_email: string | null;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string | null) {
  if (!id) return "—";
  return id.slice(0, 8) + "…";
}

function defaultDateRange() {
  const now = new Date();
  const sevenAgo = new Date(now);
  sevenAgo.setDate(now.getDate() - 7);
  return {
    from: sevenAgo.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LogsPage({ searchParams }: Props) {
  const adminClient = createAdminClient();
  const defaults = defaultDateRange();

  const from = searchParams.from ?? defaults.from;
  const to = searchParams.to ?? defaults.to;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const actionFilter = searchParams.action?.trim() ?? "";
  const agencyFilter = searchParams.agency_id ?? "";

  // ── Parallel fetches ──────────────────────────────────────────────────────

  const [agenciesResult, impResult] = await Promise.all([
    adminClient.from("agencies").select("id, name").order("name"),
    adminClient
      .from("impersonation_logs")
      .select("id, superadmin_id, agency_id, target_email, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Activity logs query (with optional filters)
  let logsQuery = adminClient
    .from("activity_logs")
    .select(
      `id, action, user_id, agency_id, metadata, created_at,
       agencies (id, name),
       profiles (id, full_name)`,
      { count: "exact" }
    )
    .gte("created_at", `${from}T00:00:00`)
    .lte("created_at", `${to}T23:59:59`)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (actionFilter) logsQuery = logsQuery.ilike("action", `%${actionFilter}%`);
  if (agencyFilter) logsQuery = logsQuery.eq("agency_id", agencyFilter);

  const logsResult = await logsQuery;

  // ── Data ─────────────────────────────────────────────────────────────────

  const agencies = (agenciesResult.data ?? []) as Array<{
    id: string;
    name: string;
  }>;
  const logs = (logsResult.data ?? []) as unknown as ActivityLog[];
  const totalCount = logsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const impLogs = (impResult.data ?? []) as ImpersonationLog[];

  const agencyMap = new Map(agencies.map((a) => [a.id, a.name]));

  // ── Pagination URL builder ────────────────────────────────────────────────

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (agencyFilter) params.set("agency_id", agencyFilter);
    params.set("from", from);
    params.set("to", to);
    params.set("page", String(p));
    return `/logs?${params.toString()}`;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Logs Globais</h1>
        <p className="text-text-secondary text-sm mt-1">
          Registro de atividades e acessos na plataforma
        </p>
      </div>

      {/* Filters — client component, wrapped in Suspense per Next.js requirement */}
      <Suspense>
        <LogsFilters
          agencies={agencies}
          initialAction={actionFilter}
          initialAgencyId={agencyFilter}
          initialFrom={from}
          initialTo={to}
        />
      </Suspense>

      {/* ── Activity logs table ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Atividades
          </h2>
          <span className="text-text-secondary text-sm">
            <span className="font-semibold text-text-primary">
              {totalCount.toLocaleString("pt-BR")}
            </span>{" "}
            registro{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && (
              <span className="text-text-muted ml-1">
                · página {page}/{totalPages}
              </span>
            )}
          </span>
        </div>

        {logsResult.error ? (
          <div className="px-6 py-6 text-danger text-sm">
            Erro ao carregar logs: {logsResult.error.message}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-text-muted text-sm">
              Nenhum log encontrado para os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Data/Hora
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Agência
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Usuário
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Ação
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Dados
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const agencyName = log.agencies?.name ?? "—";
                  const userName = log.profiles?.full_name ?? "—";
                  const hasMetadata =
                    log.metadata &&
                    Object.keys(log.metadata).length > 0;

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                    >
                      <td className="px-6 py-4 text-text-muted text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-xs">
                        {agencyName}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-xs">
                        {userName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs bg-surface-2 text-brand-light whitespace-nowrap">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[16rem]">
                        {hasMetadata ? (
                          <details className="group">
                            <summary className="cursor-pointer list-none text-xs text-text-muted hover:text-text-secondary transition-colors select-none flex items-center gap-1">
                              <svg
                                className="w-3 h-3 transition-transform group-open:rotate-90"
                                fill="currentColor"
                                viewBox="0 0 6 10"
                              >
                                <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Ver dados
                            </summary>
                            <pre className="mt-1.5 text-[11px] text-text-secondary whitespace-pre-wrap break-all leading-relaxed">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-10">
          <p className="text-text-secondary text-sm">
            Página{" "}
            <span className="font-medium text-text-primary">{page}</span> de{" "}
            {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-2 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {/* Page number pills — show at most 5 around current */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(
                1,
                Math.min(page - 2, totalPages - 4)
              );
              const p = start + i;
              return (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors ${
                    p === page
                      ? "bg-brand/20 text-brand-light font-medium"
                      : "text-text-secondary hover:bg-surface-2"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-2 transition-colors"
              >
                Próxima →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Impersonation logs ───────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">
            Logs de impersonação
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            {impLogs.length}
          </span>
        </div>

        {impLogs.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-text-muted text-sm">
              Nenhum registro de impersonação.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Data/Hora
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Agência
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Superadmin
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Usuário impersonado
                  </th>
                </tr>
              </thead>
              <tbody>
                {impLogs.map((log) => {
                  const agencyName = log.agency_id
                    ? (agencyMap.get(log.agency_id) ?? shortId(log.agency_id))
                    : "—";
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                    >
                      <td className="px-6 py-4 text-text-muted text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-xs">
                        {agencyName}
                      </td>
                      <td className="px-6 py-4 font-mono text-text-muted text-xs">
                        {shortId(log.superadmin_id)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary text-sm">
                        {log.target_email ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
