import { brl } from "@/lib/format";

export function Stepper({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const set = (delta: number) => {
    const next = Math.max(0, +(value + delta).toFixed(2));
    onChange(max === undefined ? next : Math.min(max, next));
  };
  const base =
    "px-2 py-1.5 rounded-md text-xs font-extrabold select-none " +
    "bg-gradient-to-b from-zinc-300 to-zinc-500 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_0_rgba(0,0,0,0.5),0_3px_6px_rgba(0,0,0,0.4)] " +
    "active:translate-y-[1px] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] " +
    "border border-zinc-600";
  const minus = `${base} text-red-600`;
  const plus = `${base} text-blue-700`;
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1 mt-1 bg-secondary/50 p-2 rounded-md">
        <button type="button" onClick={() => set(-10)} className={minus}>
          −10
        </button>
        <button type="button" onClick={() => set(-1)} className={minus}>
          −1
        </button>
        <div className="flex-1 text-center font-bold text-lg">{brl(value)}</div>
        <button type="button" onClick={() => set(1)} className={plus}>
          +1
        </button>
        <button type="button" onClick={() => set(10)} className={plus}>
          +10
        </button>
      </div>
    </div>
  );
}
