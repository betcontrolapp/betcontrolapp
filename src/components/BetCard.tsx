import { Pencil, Trash2, Check } from "lucide-react";
import { brl, formatBilhete } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

const STATUS_STYLES = {
  pendente: "border-pending bg-pending-bg",
  ganhou: "border-win bg-win-bg",
  perdeu: "border-loss bg-loss-bg",
};

const CHIP = {
  pendente: "bg-pending text-white",
  ganhou: "bg-win text-white",
  perdeu: "bg-loss text-white",
};

const STATUS_BORDER_COLOR = {
  pendente: "#f59e0b",
  ganhou: "#3b82f6",
  perdeu: "#ef4444",
};

const fmtDateTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function BetCard({
  bet,
  onDelete,
  onEdit,
  onConcluir,
}: {
  bet: Tables<"bets">;
  onDelete: () => void;
  onEdit: () => void;
  onConcluir: () => void;
}) {
  const investido = Number(bet.investido);
  const retorno = Number(bet.retorno);
  const status = bet.status as keyof typeof STATUS_STYLES;
  const lucro = status !== "pendente" ? retorno - investido : 0;
  const t1 = (bet as any).time1 as string | null;
  const t2 = (bet as any).time2 as string | null;
  const bilhete = (bet as any).bilhete as string | null;

  return (
    <div className={`rounded-xl border-2 ${STATUS_STYLES[status]} overflow-hidden text-[1.66em]`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{bet.esporte}</span>
            <div className="min-w-0">
              <div
                className="flex items-center justify-between gap-2 text-xs"
                style={{ color: "#64748b", marginBottom: 6 }}
              >
                {bilhete && <span className="font-bold">Bilhete #{formatBilhete(bilhete)}</span>}
                <span>Jogo Principal</span>
              </div>
              <span
                className="font-semibold block break-words"
                style={{ fontSize: "14px", whiteSpace: "normal", lineHeight: 1.2 }}
              >
                {t1 && t2 ? `${t1} × ${t2}` : bet.descricao}
              </span>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${CHIP[status]}`}>
            {status === "pendente" ? "Pendente" : status === "ganhou" ? "Ganhou" : "Perdeu"}
          </span>
        </div>

        <div
          className="rounded-md"
          style={{
            border: `1px solid ${STATUS_BORDER_COLOR[status]}`,
            borderRadius: 8,
            padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <div className="text-[10px] uppercase text-muted-foreground">Apostou</div>
          <div className="font-bold">{brl(investido)}</div>
        </div>

        {status !== "pendente" && (
          <div
            className={`text-center p-2 rounded-md font-bold ${lucro >= 0 ? "bg-win-bg text-win" : "bg-loss-bg text-loss"}`}
          >
            {lucro >= 0 ? "Lucro " : "Perda "}
            {brl(lucro)}
          </div>
        )}

        <div className="text-[10px] text-muted-foreground text-right">
          {fmtDateTime(bet.created_at)}
        </div>
      </div>

      <div className="border-t border-border grid grid-cols-3">
        <button
          onClick={onDelete}
          className="py-3 text-sm font-bold text-white flex items-center justify-center gap-1"
          style={{ background: "#dc2626" }}
        >
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <button
          onClick={onEdit}
          className="py-3 text-sm font-bold text-white flex items-center justify-center gap-1"
          style={{ background: "#ff6b1a" }}
        >
          <Pencil className="w-4 h-4" /> Editar
        </button>
        {status === "pendente" ? (
          <button
            onClick={onConcluir}
            className="py-3 text-sm font-bold text-white flex items-center justify-center gap-1"
            style={{ background: "#2563eb" }}
          >
            <Check className="w-4 h-4" /> Concluir
          </button>
        ) : (
          <div
            className="py-3 text-sm font-bold text-white flex items-center justify-center"
            style={{ background: "#1e293b", cursor: "default" }}
          >
            —
          </div>
        )}
      </div>
    </div>
  );
}
