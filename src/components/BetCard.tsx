import { Pencil, Trash2, Check } from "lucide-react";
import { brl } from "@/lib/format";
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
              {bilhete && (
                <div className="text-xs text-muted-foreground font-bold">Bilhete #{bilhete}</div>
              )}
              <span className="font-semibold truncate block">
                {t1 && t2 ? `${t1} × ${t2}` : bet.descricao}
              </span>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${CHIP[status]}`}>
            {status === "pendente" ? "Pendente" : status === "ganhou" ? "Ganhou" : "Perdeu"}
          </span>
        </div>

        <div className="bg-black/30 rounded-md p-3">
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

      <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
        <button
          onClick={onDelete}
          className="py-3 text-sm text-loss hover:bg-loss/10 flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <button
          onClick={onEdit}
          className="py-3 text-sm hover:bg-accent flex items-center justify-center gap-1"
        >
          <Pencil className="w-4 h-4" /> Editar
        </button>
        {status === "pendente" ? (
          <button
            onClick={onConcluir}
            className="py-3 text-sm text-win hover:bg-win/10 flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" /> Concluir
          </button>
        ) : (
          <div className="py-3 text-sm text-muted-foreground text-center">—</div>
        )}
      </div>
    </div>
  );
}
