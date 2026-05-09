import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import type { Tables } from "@/integrations/supabase/types";
import { brl, monthKey, monthLabel, formatBilhete } from "@/lib/format";
import { BetCard } from "@/components/BetCard";
import { BetModal, type BetFormData } from "@/components/BetModal";
import { ConcluirModal } from "@/components/ConcluirModal";
import { ensureTeam } from "@/components/TeamAutocomplete";
import { Plus, BarChart3, LogOut } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/bet-control-logo.webp";

export const Route = createFileRoute("/")({ component: Index });

async function generateBilhete(userId: string, date: string): Promise<string> {
  const d = new Date(date + "T00:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const start = `${yyyy}-${mm}-01`;
  const nextMonth = new Date(yyyy, d.getMonth() + 1, 1);
  const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const { data } = await supabase
    .from("bets")
    .select("bilhete")
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", end);
  const nums = (data ?? [])
    .map((b: any) => {
      const s = b.bilhete ?? "";
      const m1 = /^(\d{3})\/(\d{2})$/.exec(s);
      if (m1) return parseInt(m1[1], 10);
      const m2 = /^(\d{2})\/(\d{3})$/.exec(s);
      if (m2) return parseInt(m2[2], 10);
      return 0;
    })
    .filter((n) => n > 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${String(next).padStart(3, "0")}/${mm}`;
}

function Index() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const lic = useLicense(user?.id);
  const [bets, setBets] = useState<Tables<"bets">[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"bets"> | null>(null);
  const [concluding, setConcluding] = useState<Tables<"bets"> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  const reload = async () => {
    const { data } = await supabase
      .from("bets")
      .select("*")
      .order("created_at", { ascending: false });
    setBets(data ?? []);
  };

  useEffect(() => {
    if (user && lic.valid) reload();
  }, [user, lic.valid]);

  const grouped = useMemo(() => {
    const map = new Map<string, Tables<"bets">[]>();
    for (const b of bets) {
      const k = monthKey(b.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(b);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [bets]);

  if (authLoading || lic.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!user) return null;

  if (!lic.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center bg-card border-2 border-loss rounded-2xl p-6 space-y-3 text-[1.2em]">
          <div className="text-5xl">⛔</div>
          <h2 className="text-xl font-bold">Licença expirada</h2>
          <p className="text-sm text-muted-foreground">Entre em contato para renovar seu acesso.</p>
          {lic.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Expirou em {new Date(lic.expiresAt).toLocaleDateString("pt-BR")}
            </p>
          )}
          <button
            onClick={() => supabase.auth.signOut().then(() => nav({ to: "/login" }))}
            className="text-xs underline"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const save = async (data: BetFormData) => {
    if (data.time1) await ensureTeam(data.time1, user.id);
    if (data.time2) await ensureTeam(data.time2, user.id);

    if (data.id) {
      const { error } = await supabase
        .from("bets")
        .update({
          date: data.date,
          descricao: data.descricao,
          esporte: data.esporte,
          investido: data.investido,
          retorno: data.retorno,
          status: data.status,
          time1: data.time1,
          time2: data.time2,
        })
        .eq("id", data.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Atualizado");
    } else {
      const bilhete = await generateBilhete(user.id, data.date);
      const { error } = await supabase.from("bets").insert({
        user_id: user.id,
        date: data.date,
        descricao: data.descricao,
        esporte: data.esporte,
        investido: data.investido,
        retorno: data.retorno,
        status: data.status,
        time1: data.time1,
        time2: data.time2,
        bilhete,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(`Aposta salva · #${formatBilhete(bilhete)}`);
    }
    reload();
  };

  const deleteBet = async (id: string) => {
    if (!confirm("Excluir esta aposta?")) return;
    await supabase.from("bets").delete().eq("id", id);
    reload();
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-10 bg-[#060b14]/90 backdrop-blur border-b border-border">
        <div className="max-w-[500px] mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logo} alt="Bet Control" style={{ height: 36 }} className="w-auto" />
          <button
            onClick={() => supabase.auth.signOut().then(() => nav({ to: "/login" }))}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-[500px] mx-auto px-4 py-4 space-y-8">
        {grouped.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            Nenhuma aposta ainda. Clique em + para começar.
          </div>
        )}

        {grouped.map(([key, items]) => {
          const closed = items.filter((b) => b.status !== "pendente");
          const totInv = closed.reduce((s, b) => s + Number(b.investido), 0);
          const totRet = closed.reduce((s, b) => s + Number(b.retorno), 0);
          const saldo = totRet - totInv;
          const positive = saldo >= 0;
          return (
            <section key={key} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold">{monthLabel(key)}</h2>
                <span className="text-xs text-muted-foreground">{items.length} apostas</span>
              </div>
              {items.map((b) => (
                <BetCard
                  key={b.id}
                  bet={b}
                  onDelete={() => deleteBet(b.id)}
                  onEdit={() => setEditing(b)}
                  onConcluir={() => setConcluding(b)}
                />
              ))}
              <div
                className={`rounded-xl border-2 p-4 text-[1.2em] ${positive ? "border-win text-win" : "border-loss text-loss"}`}
              >
                <div className="text-xs uppercase opacity-80">Saldo do mês</div>
                <div className="font-bold text-2xl">{brl(saldo)}</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  Apostado {brl(totInv)} · Retornado {brl(totRet)}
                </div>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full border-2 border-dashed border-border rounded-xl py-4 text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Plus className="inline w-4 h-4" /> Nova Aposta
              </button>
            </section>
          );
        })}

        {grouped.length === 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full border-2 border-dashed border-border rounded-xl py-4"
          >
            <Plus className="inline w-4 h-4" /> Nova Aposta
          </button>
        )}

        <Link
          to="/dashboard"
          className="block w-full text-center bg-primary text-primary-foreground font-bold py-3 rounded-xl"
        >
          <BarChart3 className="inline w-4 h-4 mr-1" /> Dashboard
        </Link>

        <footer className="text-center text-xs text-muted-foreground pt-6 space-y-1">
          <div>{user.email}</div>
          <div>
            Plano <span className="font-semibold uppercase">{lic.plan}</span>
            {lic.expiresAt && lic.plan !== "lifetime" && (
              <> · válido até {new Date(lic.expiresAt).toLocaleDateString("pt-BR")}</>
            )}
          </div>
          {user.email === "mix.maketing.bc@gmail.com" && (
            <div>
              <Link to="/admin" className="opacity-50 hover:opacity-100">
                ⚙️ Admin
              </Link>
            </div>
          )}
        </footer>
      </main>

      <BetModal
        key={editing?.id ?? (modalOpen ? "new" : "closed")}
        open={modalOpen || !!editing}
        onOpenChange={(v) => {
          if (!v) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        initial={
          editing
            ? {
                id: editing.id,
                date: editing.date,
                descricao: editing.descricao,
                esporte: editing.esporte,
                investido: Number(editing.investido),
                retorno: Number(editing.retorno),
                status: editing.status as "pendente" | "ganhou" | "perdeu",
                time1: (editing as any).time1 ?? "",
                time2: (editing as any).time2 ?? "",
              }
            : undefined
        }
        onSave={save}
      />
      <ConcluirModal
        bet={concluding}
        onOpenChange={(v) => {
          if (!v) setConcluding(null);
        }}
        onConfirm={async (status, retorno) => {
          if (!concluding) return;
          await supabase.from("bets").update({ status, retorno }).eq("id", concluding.id);
          setConcluding(null);
          reload();
        }}
      />
    </div>
  );
}
