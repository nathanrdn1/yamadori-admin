"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  agencyId: string;
  isActive: boolean;
}

export default function AgencyDetailActions({ agencyId, isActive }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [impersonating, setImpersonating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggleStatus() {
    setError(null);
    const res = await fetch(`/api/agencies/${agencyId}/status`, {
      method: "PATCH",
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Erro ao alterar status.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleImpersonate() {
    setError(null);
    setImpersonating(true);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/impersonate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao gerar link de impersonação.");
        return;
      }
      window.open(json.url as string, "_blank", "noopener,noreferrer");
    } finally {
      setImpersonating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-danger text-xs">{error}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleToggleStatus}
          disabled={isPending}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
            isActive
              ? "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
              : "bg-success/10 text-success hover:bg-success/20 border border-success/20"
          }`}
        >
          {isPending
            ? "Salvando..."
            : isActive
            ? "Desativar agência"
            : "Reativar agência"}
        </button>

        <button
          onClick={handleImpersonate}
          disabled={impersonating}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-brand/20 bg-brand/10 text-brand-light hover:bg-brand/20 transition-colors disabled:opacity-60"
        >
          {impersonating ? "Gerando link..." : "Impersonar"}
        </button>
      </div>
    </div>
  );
}
