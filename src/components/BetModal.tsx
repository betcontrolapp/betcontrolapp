import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Stepper } from "./Stepper";
import { TeamAutocomplete } from "./TeamAutocomplete";

const SPORTS = ["⚽", "🏀", "🎾", "🥊", "🏎️", "🏆"];

export type BetFormData = {
  id?: string;
  date: string;
  descricao: string;
  esporte: string;
  investido: number;
  retorno: number;
  status: "pendente" | "ganhou" | "perdeu";
  time1: string;
  time2: string;
};

export function BetModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<BetFormData>;
  onSave: (data: BetFormData) => Promise<void>;
}) {
  const [data, setData] = useState<BetFormData>({
    date: new Date().toISOString().slice(0, 10),
    descricao: "",
    esporte: "⚽",
    investido: 50,
    retorno: 0,
    status: "pendente",
    time1: "",
    time2: "",
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const dateObj = new Date(data.date + "T00:00:00");
  const canSave = data.time1.trim().length > 0 && data.time2.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md text-[1.2em] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar Aposta" : "Nova Aposta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Time 1 *</label>
            <TeamAutocomplete
              value={data.time1}
              onChange={(v) => setData({ ...data, time1: v })}
              placeholder="Ex: Flamengo"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Time 2 *</label>
            <TeamAutocomplete
              value={data.time2}
              onChange={(v) => setData({ ...data, time2: v })}
              placeholder="Ex: Vasco"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Esporte</label>
            <div className="flex gap-2 mt-1 flex-wrap">
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
                  className={cn("w-full justify-start text-left font-normal mt-1")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateObj, "PPP", { locale: ptBR })}
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
          <Stepper
            label="Apostou"
            value={data.investido}
            onChange={(v) => setData({ ...data, investido: v })}
          />
          <Button
            className="w-full font-bold"
            disabled={saving || !canSave}
            onClick={async () => {
              setSaving(true);
              await onSave({
                ...data,
                descricao: `${data.time1} × ${data.time2}`,
              });
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
