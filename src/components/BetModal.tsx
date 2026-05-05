import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Stepper } from "./Stepper";
import { brl } from "@/lib/format";

const SPORTS = ["⚽", "🏀", "🎾", "🥊", "🏎️", "🏆"];

export type BetFormData = {
  id?: string;
  date: string;
  descricao: string;
  esporte: string;
  investido: number;
  retorno: number;
  status: "pendente" | "ganhou" | "perdeu";
};

export function BetModal({
  open,
  onOpenChange,
  initial,
  defaultName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<BetFormData>;
  defaultName?: string;
  onSave: (data: BetFormData) => Promise<void>;
}) {
  const [data, setData] = useState<BetFormData>({
    date: new Date().toISOString().slice(0, 10),
    descricao: defaultName ?? "1",
    esporte: "⚽",
    investido: 50,
    retorno: 0,
    status: "pendente",
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const lucro = data.status === "ganhou" ? data.retorno - data.investido : data.status === "perdeu" ? -data.investido : 0;
  const dateObj = new Date(data.date + "T00:00:00");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar Aposta" : "Nova Aposta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Evento</label>
            <Input
              value={data.descricao}
              onChange={(e) => setData({ ...data, descricao: e.target.value })}
              placeholder="Ex: 1, 2, 3..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Esporte</label>
            <div className="flex gap-2 mt-1">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setData({ ...data, esporte: s })}
                  className={`text-2xl p-2 rounded-md border ${data.esporte === s ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Data</label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal mt-1", !data.date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.date ? format(dateObj, "PPP", { locale: ptBR }) : "Escolher data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateObj}
                  onSelect={(d) => {
                    if (d) {
                      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      setData({ ...data, date: iso });
                      setCalOpen(false);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Resultado</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(["pendente", "ganhou", "perdeu"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setData({ ...data, status: s, retorno: s === "ganhou" ? data.retorno || data.investido * 2 : 0 })}
                  className={`py-2 rounded-md border text-sm font-semibold ${
                    data.status === s
                      ? s === "pendente" ? "border-pending bg-pending-bg text-pending"
                      : s === "ganhou" ? "border-win bg-win-bg text-win"
                      : "border-loss bg-loss-bg text-loss"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s === "pendente" ? "⏳ Não correu" : s === "ganhou" ? "✅ Ganhou" : "❌ Perdeu"}
                </button>
              ))}
            </div>
          </div>
          <Stepper label="Apostou" value={data.investido} onChange={(v) => setData({ ...data, investido: v })} />
          {data.status === "ganhou" && (
            <Stepper label="Recebeu" value={data.retorno} onChange={(v) => setData({ ...data, retorno: v })} />
          )}
          {data.status !== "pendente" && (
            <div className={`text-center p-3 rounded-md font-bold text-lg ${lucro >= 0 ? "bg-win-bg text-win" : "bg-loss-bg text-loss"}`}>
              {lucro >= 0 ? "Lucro " : "Perda "}{brl(lucro)}
            </div>
          )}
          <Button
            className="w-full font-bold"
            disabled={saving || !data.descricao}
            onClick={async () => {
              setSaving(true);
              await onSave(data);
              setSaving(false);
              onOpenChange(false);
            }}
          >
            {initial?.id ? "SALVAR ALTERAÇÕES" : "SALVAR APOSTA"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
