import { supabase } from "@/lib/supabase";
import { getActivePhase } from "@/lib/phases";
import type { Person } from "@/lib/plan-data";

/**
 * Logs a weight reading to daily_logs for the given person + date.
 * Computes day_num from the active phase's start_date.
 * Other daily_logs columns (water, steps, etc.) are preserved.
 */
export async function logWeight(opts: {
  person: Person;
  weight: number;
  date: string; // YYYY-MM-DD (local)
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(opts.weight) || opts.weight <= 0) {
    return { ok: false, error: "Enter a weight greater than 0." };
  }

  const phase = await getActivePhase(opts.person);
  if (!phase) {
    return { ok: false, error: "No active phase — can't anchor a day number." };
  }

  const [py, pm, pd] = phase.start_date.split("-").map(Number);
  const [dy, dm, dd] = opts.date.split("-").map(Number);
  const startMs = Date.UTC(py, pm - 1, pd);
  const dateMs  = Date.UTC(dy, dm - 1, dd);
  const dayNum = Math.floor((dateMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  if (dayNum < 1) {
    return { ok: false, error: "Date is before the active phase started." };
  }

  const { error } = await supabase
    .from("daily_logs")
    .upsert(
      {
        person: opts.person,
        phase_id: phase.id,
        day_num: dayNum,
        date: opts.date,
        weight: opts.weight,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,phase_id" }
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getLatestWeight(person: Person): Promise<{ weight: number; date: string } | null> {
  const { data } = await supabase
    .from("daily_logs")
    .select("weight, date")
    .eq("person", person)
    .not("weight", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as { weight: number | null; date: string };
  if (row.weight == null) return null;
  return { weight: Number(row.weight), date: row.date };
}
