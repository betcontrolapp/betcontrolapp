import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { brl, monthKey, monthLabel } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import heroImg from "@/assets/dashboard-hero.jpg";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [bets, setBets] = useState<Tables<"bets">[]>([]);
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);
  useEffect(() => {
    if (user) supabase.from("bets").select("*").then(({ data }) => setBets(data ?? []));
  }, [user]);

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (from && b.date < from) return false;
      if (to && b.date > to) return false;
      if (!from && !to) {
        return new Date(b.date + "T00:00:00").getFullYear() === year;
      }
      return true;
    });
  }, [bets, year, from, to]);

  const stats = useMemo(() => {
    const closed = filtered.filter((b) => b.status !== "pendente");
    const totInv = closed.reduce((s, b) => s + Number(b.investido), 0);
    const totRet = closed.reduce((s, b) => s + Number(b.retorno), 0);
    const lucro = totRet - totInv;
    const roi = totInv > 0 ? (lucro / totInv) * 100 : 0;
    const wins = closed.filter((b) => b.status === "ganhou").length;
    const losses = closed.filter((b) => b.status === "perdeu").length;
    const taxa = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    return { totInv, totRet, lucro, roi, wins, losses, taxa };
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      if (b.status === "pendente") continue;
      const k = monthKey(b.date);
      map.set(k, (map.get(k) ?? 0) + Number(b.retorno) - Number(b.investido));
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const chartData = monthly.map(([k, v]) => ({
    mes: monthLabel(k).split(" ")[0].slice(0, 3),
    saldo: +v.toFixed(2),
  }));

  const years = Array.from(new Set(bets.map((b) => new Date(b.date + "T00:00:00").getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-10 bg-[#060b14]/90 backdrop-blur border-b border-border">
        <div className="max-w-[500px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="font-bold">Dashboard</div>
        </div>
      </header>

      <main className="max-w-[500px] mx-auto px-4 py-4 space-y-4">
        <div className="relative h-44 rounded-2xl overflow-hidden border border-border">
          <img src={heroImg} alt="Dashboard" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Performance</div>
            <h1 className="text-3xl font-extrabold leading-tight bg-gradient-to-r from-blue-400 via-fuchsia-400 to-red-400 bg-clip-text text-transparent drop-shadow">
              SEUS RESULTADOS
            </h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 space-y-3 text-[1.2em]">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Ano</div>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setFrom(""); setTo(""); }}
                  className={`px-3 py-1 rounded-md text-sm font-bold border ${year === y && !from && !to ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">De</div>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Até</div>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }} className="text-xs text-muted-foreground underline">
              Limpar período
            </button>
          )}
        </div>

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

        <div className="bg-card border border-border rounded-xl p-3 text-[1.2em]">
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">Saldo por mês</h3>
          {chartData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Sem dados no período</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "#0f1218", border: "1px solid #1f2937", borderRadius: 8 }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.saldo >= 0 ? "#2563eb" : "#dc2626"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <h3 className="text-sm font-bold uppercase text-muted-foreground pt-2">Detalhe mensal</h3>
        <div className="space-y-2">
          {monthly.slice().reverse().map(([k, v]) => (
            <div key={k} className={`flex justify-between p-3 rounded-xl border-2 text-[1.2em] ${v >= 0 ? "border-win text-win" : "border-loss text-loss"}`}>
              <span className="font-semibold">{monthLabel(k)}</span>
              <span className="font-bold">{brl(v)}</span>
            </div>
          ))}
          {monthly.length === 0 && <div className="text-center text-muted-foreground py-4 text-sm">Sem dados</div>}
        </div>
      </main>
    </div>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "win" | "loss" }) {
  const color = tone === "win" ? "text-win" : tone === "loss" ? "text-loss" : "";
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-[1.2em]">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
