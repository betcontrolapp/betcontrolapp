export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatBilhete = (b: string | null | undefined) => {
  if (!b) return "";
  const mLegacy = /^(\d{2})\/(\d{3})$/.exec(b);
  if (mLegacy) return `${mLegacy[2]}/${mLegacy[1]}`;
  return b;
};

export const monthKey = (date: string) => {
  const d = new Date(date + "T00:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();
};
