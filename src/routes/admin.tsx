import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListUsers,
  adminCreateUser,
  adminUpsertLicense,
  adminToggleLicense,
  adminListTeams,
  adminCreateTeam,
  adminUpdateTeam,
  adminDeleteTeam,
} from "@/server/admin.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ADMIN_EMAIL = "mix.maketing.bc@gmail.com";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Lic = {
  id: string;
  user_id: string;
  plan: string;
  active: boolean;
  expires_at: string;
};
type U = { id: string; email: string | undefined; created_at: string };

function AdminPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const listFn = useServerFn(adminListUsers);
  const createUserFn = useServerFn(adminCreateUser);
  const upsertFn = useServerFn(adminUpsertLicense);
  const toggleFn = useServerFn(adminToggleLicense);

  const [users, setUsers] = useState<U[]>([]);
  const [licenses, setLicenses] = useState<Lic[]>([]);
  const [busy, setBusy] = useState(true);

  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPwd, setNewPwd] = useState("");

  const [licOpen, setLicOpen] = useState(false);
  const [licEdit, setLicEdit] = useState<Partial<Lic> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/login" });
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      nav({ to: "/" });
      return;
    }
    reload();
  }, [user, loading]);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  };

  const reload = async () => {
    setBusy(true);
    try {
      const token = await getToken();
      const r = await listFn({ data: { token } });
      setUsers(r.users as U[]);
      setLicenses(r.licenses as Lic[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar");
    } finally {
      setBusy(false);
    }
  };

  const userById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users]);
  const licByUser = useMemo(() => {
    const m: Record<string, Lic> = {};
    for (const l of licenses) m[l.user_id] = l;
    return m;
  }, [licenses]);

  const now = Date.now();
  const in30 = now + 30 * 86400000;
  const stats = {
    totalUsers: users.length,
    active: licenses.filter((l) => l.active && new Date(l.expires_at).getTime() > now).length,
    expired: licenses.filter((l) => !l.active || new Date(l.expires_at).getTime() <= now).length,
    monthly: licenses.filter((l) => l.plan === "monthly").length,
    annual: licenses.filter((l) => l.plan === "annual").length,
    lifetime: licenses.filter((l) => l.plan === "lifetime").length,
    soon: licenses
      .filter((l) => {
        const t = new Date(l.expires_at).getTime();
        return l.active && t > now && t < in30;
      })
      .sort((a, b) => a.expires_at.localeCompare(b.expires_at)),
  };

  const submitNewUser = async () => {
    try {
      await createUserFn({ data: { token: await getToken(), email: newEmail, password: newPwd } });
      toast.success("Usuário criado");
      setNewUserOpen(false);
      setNewEmail("");
      setNewPwd("");
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  };

  const submitLic = async () => {
    if (!licEdit?.user_id || !licEdit?.plan || !licEdit?.expires_at) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await upsertFn({
        data: {
          token: await getToken(),
          id: licEdit.id,
          user_id: licEdit.user_id!,
          plan: licEdit.plan as any,
          expires_at: licEdit.expires_at!,
          active: licEdit.active ?? true,
        },
      });
      toast.success("Salvo");
      setLicOpen(false);
      setLicEdit(null);
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  };

  const toggleLic = async (l: Lic) => {
    try {
      await toggleFn({ data: { token: await getToken(), id: l.id, active: !l.active } });
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  };

  if (loading || busy) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-10 bg-[#060b14]/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold tracking-wide">⚙️ ADMIN</div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="licenses">Licenças</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex justify-end mb-3">
              <Button onClick={() => setNewUserOpen(true)}>+ Criar usuário</Button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden text-[1.2em]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const l = licByUser[u.id];
                    const valid = l && l.active && new Date(l.expires_at).getTime() > now;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {!l ? (
                            <Badge variant="outline">Sem licença</Badge>
                          ) : valid ? (
                            <Badge>Ativa</Badge>
                          ) : (
                            <Badge variant="destructive">Expirada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {l ? new Date(l.expires_at).toLocaleDateString("pt-BR") : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="licenses">
            <div className="flex justify-end mb-3">
              <Button
                onClick={() => {
                  setLicEdit({ active: true, plan: "monthly" });
                  setLicOpen(true);
                }}
              >
                + Nova licença
              </Button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden text-[1.2em]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{userById[l.user_id]?.email ?? l.user_id}</TableCell>
                      <TableCell className="uppercase">{l.plan}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleLic(l)}
                          className={`px-2 py-1 rounded text-xs ${l.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                        >
                          {l.active ? "Ativo" : "Inativo"}
                        </button>
                      </TableCell>
                      <TableCell>{new Date(l.expires_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLicEdit({
                              id: l.id,
                              user_id: l.user_id,
                              plan: l.plan,
                              active: l.active,
                              expires_at: l.expires_at.slice(0, 10),
                            });
                            setLicOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard label="Usuários" value={stats.totalUsers} color="blue" />
              <StatCard label="Licenças ativas" value={stats.active} color="blue" />
              <StatCard label="Expiradas" value={stats.expired} color="red" />
              <StatCard label="Mensais" value={stats.monthly} color="blue" />
              <StatCard label="Anuais" value={stats.annual} color="blue" />
              <StatCard label="Vitalícias" value={stats.lifetime} color="blue" />
            </div>
            <div className="mt-6 rounded-xl border-2 border-yellow-500/60 p-4 text-[1.2em]">
              <h3 className="font-bold mb-2 text-yellow-400">Vencem nos próximos 30 dias</h3>
              {stats.soon.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {stats.soon.map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <span>{userById[l.user_id]?.email ?? l.user_id}</span>
                      <span className="text-yellow-400">
                        {new Date(l.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            placeholder="senha"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <Button onClick={submitNewUser}>Criar</Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={licOpen}
        onOpenChange={(v) => {
          setLicOpen(v);
          if (!v) setLicEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{licEdit?.id ? "Editar licença" : "Nova licença"}</DialogTitle>
          </DialogHeader>
          <label className="text-xs text-muted-foreground">Usuário</label>
          <select
            className="bg-background border border-input rounded-md h-9 px-2"
            value={licEdit?.user_id ?? ""}
            onChange={(e) => setLicEdit({ ...licEdit, user_id: e.target.value })}
            disabled={!!licEdit?.id}
          >
            <option value="">Selecione...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
          <label className="text-xs text-muted-foreground">Plano</label>
          <select
            className="bg-background border border-input rounded-md h-9 px-2"
            value={licEdit?.plan ?? "monthly"}
            onChange={(e) => setLicEdit({ ...licEdit, plan: e.target.value })}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <label className="text-xs text-muted-foreground">Validade</label>
          <Input
            type="date"
            value={licEdit?.expires_at ?? ""}
            onChange={(e) => setLicEdit({ ...licEdit, expires_at: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={licEdit?.active ?? true}
              onChange={(e) => setLicEdit({ ...licEdit, active: e.target.checked })}
            />
            Ativo
          </label>
          <Button onClick={submitLic}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "red" | "yellow";
}) {
  const cls =
    color === "red"
      ? "border-loss text-loss"
      : color === "yellow"
        ? "border-yellow-500 text-yellow-400"
        : "border-primary text-primary";
  return (
    <div className={`rounded-xl border-2 p-4 text-[1.2em] ${cls}`}>
      <div className="text-xs uppercase opacity-80">{label}</div>
      <div className="font-bold text-3xl">{value}</div>
    </div>
  );
}
