import { brl } from "@/lib/format";

export function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const set = (delta: number) => onChange(Math.max(0, +(value + delta).toFixed(2)));
  const btn = "px-2 py-1 rounded text-xs font-bold";
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-1 mt-1 bg-secondary/50 p-2 rounded-md">
        <button type="button" onClick={() => set(-20)} className={`${btn} bg-loss/20 text-loss`}>−20</button>
        <button type="button" onClick={() => set(-10)} className={`${btn} bg-loss/20 text-loss`}>−10</button>
        <button type="button" onClick={() => set(-5)} className={`${btn} bg-loss/20 text-loss`}>−5</button>
        <div className="flex-1 text-center font-bold text-lg">{brl(value)}</div>
        <button type="button" onClick={() => set(5)} className={`${btn} bg-win/20 text-win`}>+5</button>
        <button type="button" onClick={() => set(10)} className={`${btn} bg-win/20 text-win`}>+10</button>
        <button type="button" onClick={() => set(20)} className={`${btn} bg-win/20 text-win`}>+20</button>
      </div>
    </div>
  );
}
