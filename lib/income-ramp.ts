// Side-income ramp from the Financial Recovery plan.
// Per-person monthly target (gross). Taxes are pulled off later
// before contributing to the goal — these are pre-tax targets.
//
// June 2026 (partial, starting 6/3): $800 each
// July 2026: $1,100 each
// August 2026 onward: $2,000 each

import { supabase } from "@/lib/supabase";
import { todayLocalISO, todayLocalYYYYMM, monthLongLabel, monthLabel } from "@/lib/local-date";

export type Person = "gabby" | "jon";

export type IncomeEntry = {
  id: string;
  person: Person;
  date: string;
  amount: number;
  source: string | null;
  note: string | null;
  created_at: string;
};

// Per-person target for a given YYYY-MM month. Open-ended on the high end —
// Aug 2026 onward stays at $2,000 until manually changed.
export function targetForMonth(yyyyMm: string): number {
  if (yyyyMm <= "2026-06") return 800;
  if (yyyyMm === "2026-07") return 1100;
  return 2000;
}

// Aggressive but realistic tax reserve. Side income has no withholding.
// Scale roughly with monthly target (~20% at full ramp).
export function taxReserveFor(targetAmount: number): number {
  return Math.round(targetAmount * 0.2);
}

// Sum a person's income for a given month (YYYY-MM).
export async function getMonthlyTotal(person: Person, yyyyMm: string): Promise<number> {
  const start = `${yyyyMm}-01`;
  const end   = nextMonthFirst(yyyyMm);
  const { data } = await supabase
    .from("income_entries")
    .select("amount")
    .eq("person", person)
    .gte("date", start)
    .lt("date", end);
  return ((data as { amount: number }[] | null) ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );
}

export async function listMonthEntries(person: Person, yyyyMm: string): Promise<IncomeEntry[]> {
  const start = `${yyyyMm}-01`;
  const end   = nextMonthFirst(yyyyMm);
  const { data } = await supabase
    .from("income_entries")
    .select("*")
    .eq("person", person)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as IncomeEntry[]) ?? [];
}

export async function addIncomeEntry(opts: {
  person: Person;
  amount: number;
  date?: string;
  source?: string;
  note?: string;
}): Promise<boolean> {
  const { error } = await supabase.from("income_entries").insert({
    person: opts.person,
    amount: opts.amount,
    date: opts.date ?? todayLocalISO(),
    source: opts.source ?? null,
    note: opts.note ?? null,
  });
  return !error;
}

export async function deleteIncomeEntry(id: string): Promise<void> {
  await supabase.from("income_entries").delete().eq("id", id);
}

function nextMonthFirst(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}

// Look one month ahead — useful for "next month: $1,100 each" hint.
export function nextMonthInfo(yyyyMm: string): { yyyyMm: string; target: number; label: string } {
  const next = nextMonthFirst(yyyyMm).slice(0, 7);
  return { yyyyMm: next, target: targetForMonth(next), label: monthLongLabel(next) };
}

export function currentMonthInfo(now: string = todayLocalYYYYMM()): {
  yyyyMm: string;
  target: number;
  label: string;
  shortLabel: string;
} {
  return {
    yyyyMm: now,
    target: targetForMonth(now),
    label: monthLongLabel(now),
    shortLabel: monthLabel(now),
  };
}
