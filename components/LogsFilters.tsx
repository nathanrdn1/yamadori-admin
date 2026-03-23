"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Agency = { id: string; name: string };

interface Props {
  agencies: Agency[];
  initialAction: string;
  initialAgencyId: string;
  initialFrom: string;
  initialTo: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LogsFilters({
  agencies,
  initialAction,
  initialAgencyId,
  initialFrom,
  initialTo,
}: Props) {
  const router = useRouter();

  const [action, setAction] = useState(initialAction);
  const [agencyId, setAgencyId] = useState(initialAgencyId);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function buildParams(overrides?: { page?: string }) {
    const params = new URLSearchParams();
    if (action.trim()) params.set("action", action.trim());
    if (agencyId) params.set("agency_id", agencyId);
    params.set("from", from);
    params.set("to", to);
    params.set("page", overrides?.page ?? "1");
    return params.toString();
  }

  function applyFilters() {
    router.push(`/logs?${buildParams()}`);
  }

  function clearFilters() {
    const now = new Date();
    const sevenAgo = new Date(now);
    sevenAgo.setDate(now.getDate() - 7);
    const defaultFrom = sevenAgo.toISOString().split("T")[0];
    const defaultTo = now.toISOString().split("T")[0];

    setAction("");
    setAgencyId("");
    setFrom(defaultFrom);
    setTo(defaultTo);
    router.push("/logs");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") applyFilters();
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        {/* Action search */}
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-text-muted text-xs mb-1">Ação</label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
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
              value={action}
              onChange={(e) => setAction(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="ex: plan_changed"
              className="w-full pl-8 pr-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </div>

        {/* Agency filter */}
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-text-muted text-xs mb-1">Agência</label>
          <select
            value={agencyId}
            onChange={(e) => setAgencyId(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
          >
            <option value="">Todas as agências</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div>
          <label className="block text-text-muted text-xs mb-1">De</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        {/* Date to */}
        <div>
          <label className="block text-text-muted text-xs mb-1">Até</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors"
          >
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface-2 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
