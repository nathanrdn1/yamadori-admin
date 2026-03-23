"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgencyRow = {
  id: string;
  name: string;
  document: string | null;
  document_type: string | null;
  is_active: boolean;
  created_at: string;
  subscription_plan_id: string | null;
  subscription_status: string | null;
  member_count: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Ativo", value: "active" },
  { label: "Trial", value: "trialing" },
  { label: "Pausado", value: "paused" },
  { label: "Cancelado", value: "cancelled" },
] as const;

const PLAN_BADGE: Record<string, { label: string; classes: string }> = {
  starter: { label: "Starter", classes: "bg-brand/10 text-brand-light" },
  pro: { label: "Pro", classes: "bg-blue-500/10 text-blue-400" },
  agency: { label: "Agency", classes: "bg-success/10 text-success" },
};

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  active: { label: "Ativo", classes: "bg-success/10 text-success" },
  trialing: { label: "Trial", classes: "bg-warning/10 text-warning" },
  paused: { label: "Pausado", classes: "bg-border/60 text-text-muted" },
  cancelled: { label: "Cancelado", classes: "bg-danger/10 text-danger" },
  canceled: { label: "Cancelado", classes: "bg-danger/10 text-danger" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskDocument(doc: string | null, type: string | null): string {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (type === "cpf" || digits.length === 11) {
    // ***.***.XXX-XX
    return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (type === "cnpj" || digits.length === 14) {
    // **.***.XXX/XXXX-XX
    return `**.***.${digits.slice(4, 7)}/${digits.slice(7, 11)}-${digits.slice(12)}`;
  }
  return "*".repeat(Math.max(0, doc.length - 4)) + doc.slice(-4);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgenciesTable({ agencies }: { agencies: AgencyRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = agencies;
    if (statusFilter) {
      result = result.filter(
        (a) =>
          a.subscription_status === statusFilter ||
          // Handle "cancelled"/"canceled" variant
          (statusFilter === "cancelled" && a.subscription_status === "canceled")
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    return result;
  }, [agencies, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatus(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9 pr-4 py-2 w-64 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleStatus(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-brand/20 text-brand-light"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Counter */}
        <span className="ml-auto text-text-secondary text-sm">
          <span className="font-semibold text-text-primary">
            {filtered.length}
          </span>{" "}
          agência{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-text-muted text-sm">
              {search || statusFilter
                ? "Nenhuma agência encontrada com os filtros aplicados."
                : "Nenhuma agência cadastrada."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Nome / Documento
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Plano
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Membros
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Criada em
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((agency) => {
                  const plan = agency.subscription_plan_id
                    ? (PLAN_BADGE[agency.subscription_plan_id] ?? {
                        label: agency.subscription_plan_id,
                        classes: "bg-border/40 text-text-muted",
                      })
                    : null;

                  const status = agency.subscription_status
                    ? (STATUS_BADGE[agency.subscription_status] ?? {
                        label: agency.subscription_status,
                        classes: "bg-border/40 text-text-muted",
                      })
                    : null;

                  return (
                    <tr
                      key={agency.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-text-primary">
                          {agency.name}
                        </p>
                        <p className="text-text-muted text-xs mt-0.5 font-mono">
                          {maskDocument(agency.document, agency.document_type)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {plan ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${plan.classes}`}
                          >
                            {plan.label}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {status ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.classes}`}
                          >
                            {status.label}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary tabular-nums">
                        {agency.member_count}
                      </td>
                      <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                        {new Date(agency.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/agencies/${agency.id}`}
                          className="text-brand-light hover:text-brand text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          Ver detalhes →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-text-secondary text-sm">
            Página{" "}
            <span className="font-medium text-text-primary">{safePage}</span>{" "}
            de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
