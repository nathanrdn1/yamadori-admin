"use client";

import { useState, useTransition } from "react";
import { updateAgencyStatus, updateAgencyPlan } from "@/app/actions/agency";

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
];

interface Props {
  agencyId: string;
  currentStatus: string;
  currentPlan: string;
}

export default function AgencyActions({
  agencyId,
  currentStatus,
  currentPlan,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [plan, setPlan] = useState(currentPlan ?? "free");
  const [status, setStatus] = useState(currentStatus ?? "active");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isActive = status === "active";

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  function handleStatusToggle() {
    const newStatus = isActive ? "suspended" : "active";
    setError(null);
    startTransition(async () => {
      try {
        await updateAgencyStatus(agencyId, newStatus);
        setStatus(newStatus);
        flash(
          newStatus === "suspended"
            ? "Agência suspensa com sucesso."
            : "Agência ativada com sucesso."
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      }
    });
  }

  function handlePlanChange(newPlan: string) {
    setPlan(newPlan);
    setError(null);
    startTransition(async () => {
      try {
        await updateAgencyPlan(agencyId, newPlan);
        flash("Plano atualizado com sucesso.");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro desconhecido");
      }
    });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h2 className="font-semibold text-text-primary text-sm mb-4">Ações</h2>

      {error && (
        <div className="mb-4 px-3 py-2 bg-danger/10 border border-danger/20 text-danger text-xs rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-3 py-2 bg-success/10 border border-success/20 text-success text-xs rounded-lg">
          {success}
        </div>
      )}

      <div className="divide-y divide-border">
        {/* Status toggle */}
        <div className="flex items-center justify-between py-4 first:pt-0">
          <div>
            <p className="text-sm font-medium text-text-primary">Status</p>
            <p className="text-xs text-text-muted mt-0.5">
              {isActive ? "Agência ativa na plataforma" : "Agência suspensa"}
            </p>
          </div>
          <button
            onClick={handleStatusToggle}
            disabled={isPending}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isActive
                ? "bg-danger/10 text-danger hover:bg-danger/20"
                : "bg-success/10 text-success hover:bg-success/20"
            }`}
          >
            {isPending ? "Salvando..." : isActive ? "Suspender" : "Ativar"}
          </button>
        </div>

        {/* Plan change */}
        <div className="flex items-center justify-between py-4 last:pb-0">
          <div>
            <p className="text-sm font-medium text-text-primary">Plano</p>
            <p className="text-xs text-text-muted mt-0.5">
              Alterar o plano da agência
            </p>
          </div>
          <select
            value={plan}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={isPending}
            className="px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 cursor-pointer"
          >
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
