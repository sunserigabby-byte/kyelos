import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";

export type PhaseType = "cut" | "vacation" | "bulk" | string;

export type Phase = {
  id: string;
  person: Person;
  name: string;
  phase_type: PhaseType;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  is_active: boolean;
  focus_label?: string | null;
  purpose_text?: string | null;
};

export async function getActivePhase(person: Person): Promise<Phase | null> {
  const { data } = await supabase
    .from("phases")
    .select("*")
    .eq("person", person)
    .eq("is_active", true)
    .maybeSingle();
  return (data as Phase | null) ?? null;
}

export async function getAllPhases(person: Person): Promise<Phase[]> {
  const { data } = await supabase
    .from("phases")
    .select("*")
    .eq("person", person)
    .order("start_date", { ascending: false });
  return (data as Phase[]) ?? [];
}

export async function getPhaseById(id: string): Promise<Phase | null> {
  const { data } = await supabase.from("phases").select("*").eq("id", id).maybeSingle();
  return (data as Phase | null) ?? null;
}

// Sets the target phase active and all others inactive for that person.
export async function setActivePhase(person: Person, phaseId: string): Promise<void> {
  // Deactivate everything else for the person, then activate the target.
  await supabase
    .from("phases")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("person", person)
    .neq("id", phaseId);
  await supabase
    .from("phases")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", phaseId);
}

// Day number 1..N within a phase given today's date.
// Clamped to [1, totalDays]. Returns -1 if today is before the phase starts.
export function getCurrentPhaseDay(phase: Phase, today: Date = new Date()): number {
  const [sy, sm, sd] = phase.start_date.split("-").map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((todayUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;

  const [ey, em, ed] = phase.end_date.split("-").map(Number);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const totalDays = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;

  if (diff < 1) return 1;
  if (diff > totalDays) return totalDays;
  return diff;
}

export function getTotalDays(phase: Phase): number {
  const [sy, sm, sd] = phase.start_date.split("-").map(Number);
  const [ey, em, ed] = phase.end_date.split("-").map(Number);
  return (
    Math.floor(
      (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

// Map a phase day (1-based) back to its calendar date.
export function dateForPhaseDay(phase: Phase, dayNum: number): Date {
  const [sy, sm, sd] = phase.start_date.split("-").map(Number);
  const d = new Date(Date.UTC(sy, sm - 1, sd));
  d.setUTCDate(d.getUTCDate() + (dayNum - 1));
  return d;
}

export function isoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function displayDate(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
