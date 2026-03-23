"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Member = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "admin" | "analyst";
};

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  _form?: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  analyst: "Analista",
};

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "analyst",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validate(f: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!f.fullName.trim()) {
    errors.fullName = "Nome é obrigatório.";
  }

  if (!f.email.trim()) {
    errors.email = "E-mail é obrigatório.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
    errors.email = "E-mail inválido.";
  }

  if (!f.password) {
    errors.password = "Senha é obrigatória.";
  } else if (f.password.length < 8) {
    errors.password = "Mínimo de 8 caracteres.";
  }

  if (!f.confirmPassword) {
    errors.confirmPassword = "Confirme a senha.";
  } else if (f.password !== f.confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-text-secondary text-xs mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-danger text-xs">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand/50 transition-colors";

const inputErrCls =
  "w-full bg-surface-2 border border-danger/50 rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-danger transition-colors";

// ─── Main component ───────────────────────────────────────────────────────────

export default function MembersPanel({
  agencyId,
  initialMembers,
}: {
  agencyId: string;
  initialMembers: Member[];
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function openModal() {
    setForm(EMPTY_FORM);
    setErrors({});
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (errors[key as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(
        `/api/superadmin/agencies/${agencyId}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: form.role,
          }),
        }
      );

      const json = (await res.json()) as
        | { ok: true; user: { id: string; email: string; full_name: string; role: string } }
        | { error: string; field?: string };

      if (!res.ok || !("ok" in json)) {
        const apiErr = json as { error: string; field?: string };
        if (apiErr.field) {
          setErrors({ [apiErr.field]: apiErr.error });
        } else {
          setErrors({ _form: apiErr.error ?? "Erro ao criar o usuário." });
        }
        return;
      }

      // Success — prepend to list and close
      setMembers((prev) => [
        {
          id: json.user.id,
          full_name: json.user.full_name,
          email: json.user.email,
          role: json.user.role,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Section card ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">Membros</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-border/40 text-text-muted">
              {members.length}
            </span>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand/10 text-brand-light border border-brand/20 hover:bg-brand/20 rounded-lg transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adicionar usuário
          </button>
        </div>

        {/* Table */}
        {members.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-text-muted text-sm">
              Nenhum membro cadastrado nesta agência.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Nome
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    E-mail
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3">
                    Função
                  </th>
                  <th className="text-left text-text-muted font-medium px-6 py-3 whitespace-nowrap">
                    Membro desde
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {m.full_name}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{m.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light capitalize">
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add user modal ── */}
      {open && (
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
                Adicionar usuário
              </h2>
              <button
                onClick={closeModal}
                disabled={loading}
                className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
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

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* General error */}
                {errors._form && (
                  <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-danger text-sm">
                    {errors._form}
                  </div>
                )}

                {/* Full name */}
                <Field label="Nome completo *" error={errors.fullName}>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Maria da Silva"
                    autoComplete="off"
                    className={errors.fullName ? inputErrCls : inputCls}
                  />
                </Field>

                {/* Email */}
                <Field label="E-mail *" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="maria@agencia.com"
                    autoComplete="off"
                    className={errors.email ? inputErrCls : inputCls}
                  />
                </Field>

                {/* Password */}
                <Field label="Senha * (mín. 8 caracteres)" error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={
                        (errors.password ? inputErrCls : inputCls) + " pr-10"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>

                {/* Confirm password */}
                <Field label="Confirmar senha *" error={errors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={
                        (errors.confirmPassword ? inputErrCls : inputCls) +
                        " pr-10"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88 6.59 6.59m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>

                {/* Role */}
                <Field label="Função">
                  <select
                    value={form.role}
                    onChange={(e) =>
                      set("role", e.target.value as "admin" | "analyst")
                    }
                    className={inputCls}
                  >
                    <option value="analyst">Analista</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {loading && (
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {loading ? "Criando…" : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
