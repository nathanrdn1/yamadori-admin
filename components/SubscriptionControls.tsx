"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  { value: "starter", label: "Starter — R$ 97/mês" },
  { value: "pro", label: "Pro — R$ 147/mês" },
  { value: "agency", label: "Agency — R$ 297/mês" },
] as const;

const STATUSES = [
  { value: "trialing", label: "Trial" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

interface Props {
  agencyId: string;
  currentPlanId: string | null;
  currentStatus: string | null;
}

export default function SubscriptionControls({
  agencyId,
  currentPlanId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId ?? "");
  const [selectedStatus, setSelectedStatus] = useState(currentStatus ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Keep selects in sync when parent re-fetches after router.refresh()
  useEffect(() => {
    setSelectedPlan(currentPlanId ?? "");
  }, [currentPlanId]);

  useEffect(() => {
    setSelectedStatus(currentStatus ?? "");
  }, [currentStatus]);

  async function handleChangePlan() {
    if (!selectedPlan || selectedPlan === currentPlanId) return;
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/agencies/${agencyId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao trocar plano.");
      return;
    }
    setSuccess("Plano atualizado com sucesso.");
    startTransition(() => router.refresh());
  }

  async function handleForceStatus() {
    if (!selectedStatus || selectedStatus === currentStatus) return;
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/agencies/${agencyId}/subscription-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selectedStatus }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao forçar status.");
      return;
    }
    setSuccess("Status atualizado com sucesso.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3 pt-2">
      {error && <p className="text-danger text-xs">{error}</p>}
      {success && <p className="text-success text-xs">{success}</p>}

      {/* Change plan */}
      <div className="flex items-center gap-3">
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
        >
          <option value="">Selecionar plano...</option>
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleChangePlan}
          disabled={
            isPending || !selectedPlan || selectedPlan === currentPlanId
          }
          className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-brand/20 bg-brand/10 text-brand-light hover:bg-brand/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Trocar plano
        </button>
      </div>

      {/* Force subscription status */}
      <div className="flex items-center gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
        >
          <option value="">Forçar status...</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleForceStatus}
          disabled={
            isPending || !selectedStatus || selectedStatus === currentStatus
          }
          className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-warning/20 bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Forçar status
        </button>
      </div>
    </div>
  );
}
