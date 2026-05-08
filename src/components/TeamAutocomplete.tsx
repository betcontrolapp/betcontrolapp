import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export function TeamAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [teams, setTeams] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("teams")
      .select("name")
      .order("name")
      .then(({ data }) => setTeams((data ?? []).map((t: any) => t.name)));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const v = value.toLowerCase();
  const matches = v
    ? teams.filter((t) => t.toLowerCase().includes(v) && t.toLowerCase() !== v).slice(0, 6)
    : [];

  return (
    <div ref={ref} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-md max-h-48 overflow-auto shadow-lg">
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-accent"
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export async function ensureTeam(name: string, userId: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.from("teams").insert({ name: trimmed, user_id: userId }).select();
}
