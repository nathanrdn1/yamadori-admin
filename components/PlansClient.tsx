"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = {
  id: string;
  name: string;
  max_analysts: number | null;
  max_clients: number | null;
  max_reports_per_month: number | null;
  has_ai: boolean;
  has_priority_support: boolean;
  is_active: boolean;
  sort_order: number | null;
};

type FormState = {
  name: string;
  max_analysts: number | null;
  max_clients: number | null;
  max_reports_per_month: number | null;
  has_ai: boolean;
  has_priority_support: boolean;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BoolBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        value
          ? "bg-success/10 text-success"
          : "bg-border/40 text-text-muted"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-wait ${
        checked ? "bg-success" : "bg-border"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-text-secondary text-xs mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={value ?? ""}
          disabled={value === null}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))
          }
          placeholder="0"
          className="w-28 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 disabled:opacity-40 transition-colors"
        />
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value === null}
            onChange={(e) => onChange(e.target.checked ? null : 0)}
            className="accent-brand"
          />
          <span className="text-sm text-text-secondary">Ilimitado</span>
        </label>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlansClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openModal(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      max_analysts: plan.max_analysts,
      max_clients: plan.max_clients,
      max_reports_per_month: plan.max_reports_per_month,
      has_ai: plan.has_ai,
      has_priority_support: plan.has_priority_support,
    });
    setError(null);
  }

  function closeModal() {
    setEditingPlan(null);
    setForm(null);
    setError(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!editingPlan || !form) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/plans/${editingPlan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Erro ao salvar o plano.");
      return;
    }

    setPlans((prev) =>
      prev.map((p) => (p.id === editingPlan.id ? { ...p, ...(json as Plan) } : p))
    );
    closeModal();
  }

  async function handleToggleActive(plan: Plan) {
    setToggling(plan.id);
    const res = await fetch(`/api/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !plan.is_active }),
    });

    if (res.ok) {
      const json = (await res.json()) as Plan;
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, ...json } : p))
      );
    }
    setToggling(null);
  }

  function displayLimit(v: number | null) {
    return v === null ? "∞" : v.toLocaleString("pt-BR");
  }

  return (
    <>
      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Nome",
                  "Analistas",
                  "Clientes",
                  "Relatórios/mês",
                  "IA",
                  "Suporte",
                  "Ativo",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-muted text-sm"
                  >
                    Nenhum plano cadastrado.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 text-text-secondary tabular-nums">
                      {displayLimit(plan.max_analysts)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary tabular-nums">
                      {displayLimit(plan.max_clients)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary tabular-nums">
                      {displayLimit(plan.max_reports_per_month)}
                    </td>
                    <td className="px-6 py-4">
                      <BoolBadge value={plan.has_ai} trueLabel="Sim" falseLabel="Não" />
                    </td>
                    <td className="px-6 py-4">
                      <BoolBadge
                        value={plan.has_priority_support}
                        trueLabel="Prioritário"
                        falseLabel="Padrão"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Toggle
                        checked={plan.is_active}
                        onChange={() => handleToggleActive(plan)}
                        disabled={toggling === plan.id}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(plan)}
                        className="text-brand-light hover:text-brand text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editingPlan && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">
                Editar — {editingPlan.name}
              </h2>
              <button
                onClick={closeModal}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Fechar"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-text-secondary text-xs mb-1.5">
                  Nome do plano
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand/50 transition-colors"
                />
              </div>

              {/* Numeric limits */}
              <NumberField
                label="Máx. analistas"
                value={form.max_analysts}
                onChange={(v) => updateForm("max_analysts", v)}
              />
              <NumberField
                label="Máx. clientes"
                value={form.max_clients}
                onChange={(v) => updateForm("max_clients", v)}
              />
              <NumberField
                label="Máx. relatórios / mês"
                value={form.max_reports_per_month}
                onChange={(v) => updateForm("max_reports_per_month", v)}
              />

              {/* Boolean flags */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.has_ai}
                    onChange={(e) => updateForm("has_ai", e.target.checked)}
                    className="accent-brand rounded"
                  />
                  <span className="text-sm text-text-secondary">
                    Acesso à IA
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.has_priority_support}
                    onChange={(e) =>
                      updateForm("has_priority_support", e.target.checked)
                    }
                    className="accent-brand rounded"
                  />
                  <span className="text-sm text-text-secondary">
                    Suporte prioritário
                  </span>
                </label>
              </div>

              {error && <p className="text-danger text-xs pt-1">{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
