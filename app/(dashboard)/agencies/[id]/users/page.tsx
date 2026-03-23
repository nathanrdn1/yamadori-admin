import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export default async function AgencyUsersPage({ params }: Props) {
  const supabase = createClient();

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, name")
    .eq("id", params.id)
    .single();

  if (!agency) {
    notFound();
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("agency_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center gap-2 text-text-secondary text-sm mb-6">
        <Link href="/agencies" className="hover:text-text-primary transition-colors">
          Agências
        </Link>
        <span>/</span>
        <Link
          href={`/agencies/${params.id}`}
          className="hover:text-text-primary transition-colors"
        >
          {agency.name}
        </Link>
        <span>/</span>
        <span className="text-text-primary">Usuários</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Usuários — {agency.name}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {users?.length ?? 0} usuário(s) cadastrado(s)
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {error ? (
          <div className="p-6 text-danger text-sm">
            Erro: {error.message}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            Nenhum usuário encontrado nesta agência.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-text-muted font-medium px-6 py-3">Nome</th>
                <th className="text-left text-text-muted font-medium px-6 py-3">E-mail</th>
                <th className="text-left text-text-muted font-medium px-6 py-3">Papel</th>
                <th className="text-left text-text-muted font-medium px-6 py-3">Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {user.full_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light">
                      {user.role ?? "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
