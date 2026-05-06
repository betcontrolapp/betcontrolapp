import { Pencil, Trash2, Check } from "lucide-react";
import { brl } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";
import { Stepper } from "./Stepper";

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

export function BetCard({
  bet,
  onUpdate,
  onDelete,
  onEdit,
  onConcluir,
}: {
  bet: Tables<"bets">;
  onUpdate: (patch: Partial<Tables<"bets">>) => void;
  onDelete: () => void;
  onEdit: () => void;
  onConcluir: () => void;
}) {
  const investido = Number(bet.investido);
  const retorno = Number(bet.retorno);
  const status = bet.status as keyof typeof STATUS_STYLES;
  const lucro = status === "ganhou" ? retorno - investido : status === "perdeu" ? -investido : 0;

  return (
    <div className={`rounded-xl border-2 ${STATUS_STYLES[status]} overflow-hidden text-[1.38em]`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{bet.esporte}</span>
            <span className="font-semibold truncate">{bet.descricao}</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${CHIP[status]}`}>
            {status === "pendente" ? "Pendente" : status === "ganhou" ? "Ganhou" : "Perdeu"}
          </span>
        </div>

        <div className="bg-black/30 rounded-md grid grid-cols-2 divide-x divide-border">
          <div className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Investiu</div>
            <div className="font-bold">{brl(investido)}</div>
          </div>
          <div className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Recebeu</div>
            <div className="font-bold">{status === "pendente" ? "aguardando" : brl(retorno)}</div>
          </div>
        </div>

        {status !== "pendente" && (
          <div className={`text-center font-bold ${lucro >= 0 ? "text-win" : "text-loss"}`}>
            {lucro >= 0 ? "Lucro " : "Perda "}{brl(lucro)}
          </div>
        )}

        <div className="space-y-2">
          <Stepper label="Apostou" value={investido} onChange={(v) => onUpdate({ investido: v })} />
          {status === "ganhou" && (
            <Stepper label="Recebeu" value={retorno} onChange={(v) => onUpdate({ retorno: v })} />
          )}
        </div>
      </div>

      <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
        <button onClick={onDelete} className="py-3 text-sm text-loss hover:bg-loss/10 flex items-center justify-center gap-1">
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <button onClick={onEdit} className="py-3 text-sm hover:bg-accent flex items-center justify-center gap-1">
          <Pencil className="w-4 h-4" /> Editar
        </button>
        {status === "pendente" ? (
          <button onClick={onConcluir} className="py-3 text-sm text-win hover:bg-win/10 flex items-center justify-center gap-1">
            <Check className="w-4 h-4" /> Concluir
          </button>
        ) : (
          <div className="py-3 text-sm text-muted-foreground text-center">—</div>
        )}
      </div>
    </div>
  );
}
