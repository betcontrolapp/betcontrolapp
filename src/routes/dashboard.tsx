import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { brl, monthKey, monthLabel } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [bets, setBets] = useState<Tables<"bets">[]>([]);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  useEffect(() => {
    if (user) supabase.from("bets").select("*").then(({ data }) => setBets(data ?? []));
  }, [user]);

  const stats = useMemo(() => {
    const closed = bets.filter((b) => b.status !== "pendente");
    const totInv = closed.reduce((s, b) => s + Number(b.investido), 0);
    const totRet = closed.reduce((s, b) => s + Number(b.retorno), 0);
    const lucro = totRet - totInv;
    const roi = totInv > 0 ? (lucro / totInv) * 100 : 0;
    const wins = closed.filter((b) => b.status === "ganhou").length;
    const losses = closed.filter((b) => b.status === "perdeu").length;
    const taxa = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    return { totInv, totRet, lucro, roi, wins, losses, taxa };
  }, [bets]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bets) {
      if (b.status === "pendente") continue;
      const k = monthKey(b.date);
      map.set(k, (map.get(k) ?? 0) + Number(b.retorno) - Number(b.investido));
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [bets]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[#060b14]/90 backdrop-blur border-b border-border">
        <div className="max-w-[500px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="font-bold">Dashboard</div>
        </div>
      </header>

      <main className="max-w-[500px] mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card label="Total Apostado" value={brl(stats.totInv)} />
          <Card label="Total Retornado" value={brl(stats.totRet)} />
          <Card
            label="Lucro / Perda"
            value={brl(stats.lucro)}
            sub={`ROI ${stats.roi.toFixed(1)}%`}
            tone={stats.lucro >= 0 ? "win" : "loss"}
          />
          <Card
            label="Taxa de acerto"
            value={`${stats.taxa.toFixed(0)}%`}
            sub={`${stats.wins}G · ${stats.losses}P`}
          />
        </div>

        <h3 className="text-sm font-bold uppercase text-muted-foreground pt-4">Por mês</h3>
        <div className="space-y-2">
          {monthly.map(([k, v]) => (
            <div key={k} className={`flex justify-between p-3 rounded-xl border-2 ${v >= 0 ? "border-win text-win" : "border-loss text-loss"}`}>
              <span className="font-semibold">{monthLabel(k)}</span>
              <span className="font-bold">{brl(v)}</span>
            </div>
          ))}
          {monthly.length === 0 && <div className="text-center text-muted-foreground py-8">Sem dados</div>}
        </div>
      </main>
    </div>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "win" | "loss" }) {
  const color = tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "";
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
