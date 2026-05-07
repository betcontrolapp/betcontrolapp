import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper } from "./Stepper";
import { brl } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export function ConcluirModal({
  bet,
  onOpenChange,
  onConfirm,
}: {
  bet: Tables<"bets"> | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (status: "ganhou" | "perdeu", retorno: number) => Promise<void>;
}) {
  const [status, setStatus] = useState<"ganhou" | "perdeu">("ganhou");
  const [retorno, setRetorno] = useState(0);
  const [perda, setPerda] = useState(0);

  useEffect(() => {
    if (!bet) return;
    setStatus("ganhou");
    const investido = Number(bet.investido);
    setRetorno(investido * 2);
    setPerda(investido);
  }, [bet]);

  if (!bet) return null;
  const investido = Number(bet.investido);
  const lucro = status === "ganhou" ? retorno - investido : -perda;

  return (
    <Dialog open={!!bet} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md text-[1.2em]">
        <DialogHeader>
          <DialogTitle>Concluir aposta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-secondary/50 p-3 rounded-md">
            <div className="font-semibold">
              {bet.esporte} {bet.descricao}
            </div>
            <div className="text-sm text-muted-foreground">
              Apostado: {brl(Number(bet.investido))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setStatus("ganhou");
                setRetorno(investido * 2);
              }}
              className={`py-4 rounded-md border-2 font-bold ${status === "ganhou" ? "border-win bg-win-bg text-win" : "border-border"}`}
            >
              ✅ Ganhou
            </button>
            <button
              onClick={() => {
                setStatus("perdeu");
                setPerda(investido);
              }}
              className={`py-4 rounded-md border-2 font-bold ${status === "perdeu" ? "border-loss bg-loss-bg text-loss" : "border-border"}`}
            >
              ❌ Perdeu
            </button>
          </div>
          {status === "ganhou" ? (
            <Stepper label="Recebeu" value={retorno} onChange={setRetorno} />
          ) : (
            <Stepper label="Perdeu" value={perda} onChange={setPerda} />
          )}
          <div
            className={`text-center p-3 rounded-md font-bold text-lg ${lucro >= 0 ? "bg-win-bg text-win" : "bg-loss-bg text-loss"}`}
          >
            {lucro >= 0 ? "Lucro " : "Perda "}
            {brl(lucro)}
          </div>
          <Button
            className="w-full font-bold"
            onClick={() => onConfirm(status, status === "ganhou" ? retorno : Math.max(0, investido - perda))}
          >
            CONFIRMAR RESULTADO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
