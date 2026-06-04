import { supabase } from "@/lib/supabase";
import { gabbyPRP } from "@/lib/prp-plan";
import type { Person } from "@/lib/plan-data";

export type WorkoutItem = {
  dayNum: number;
  weekNum: number;
  workoutName: string;
  focus: string;
  exercises: number;
  kind: "training" | "rest" | "light"; // light = mobility/walk day
};

const REST_NAMES = new Set([
  "Injection Day Rest",
  "Bonus Rest Day",
  "Post-Injection Rest",
]);

function classify(workoutName: string): "training" | "rest" | "light" {
  if (REST_NAMES.has(workoutName)) return "rest";
  const n = workoutName.toLowerCase();
  if (n.includes("mobility") || n.includes("walk")) return "light";
  return "training";
}

export function getPRPWorkoutItems(): WorkoutItem[] {
  return gabbyPRP.map((d) => ({
    dayNum: d.day,
    weekNum: d.weekNum,
    workoutName: d.workoutName,
    focus: d.focus,
    exercises: d.exercises.length,
    kind: classify(d.workoutName),
  }));
}

export function getWorkoutItem(dayNum: number): WorkoutItem | null {
  const items = getPRPWorkoutItems();
  return items.find((i) => i.dayNum === dayNum) ?? null;
}

export async function getCompletedDayNums(person: Person, phaseId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from("workout_sessions")
    .select("day_num, completed")
    .eq("person", person)
    .eq("phase_id", phaseId)
    .eq("completed", true);
  const rows = (data as { day_num: number }[] | null) ?? [];
  return new Set(rows.map((r) => r.day_num));
}

// Lowest training-kind day_num that hasn't been completed.
export function getNextWorkoutDay(items: WorkoutItem[], completed: Set<number>): number | null {
  for (const item of items) {
    if (item.kind === "rest") continue;
    if (!completed.has(item.dayNum)) return item.dayNum;
  }
  return null;
}

export type WorkoutCellState = "done" | "next" | "pending" | "rest" | "light";

export function cellStateFor(item: WorkoutItem, completed: Set<number>, nextDayNum: number | null): WorkoutCellState {
  if (item.kind === "rest") return "rest";
  if (completed.has(item.dayNum)) return "done";
  if (item.dayNum === nextDayNum) return "next";
  if (item.kind === "light") return "light";
  return "pending";
}

export async function markWorkoutComplete(opts: {
  person: Person;
  phaseId: string;
  dayNum: number;
  workoutName: string;
  workoutDate: string;
  completed: boolean;
}): Promise<void> {
  // Upsert the session — create if it doesn't exist, then update completed.
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("person", opts.person)
    .eq("phase_id", opts.phaseId)
    .eq("day_num", opts.dayNum)
    .maybeSingle();

  if (existing && (existing as { id: string }).id) {
    await supabase
      .from("workout_sessions")
      .update({
        completed: opts.completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("workout_sessions").insert({
      person: opts.person,
      phase_id: opts.phaseId,
      day_num: opts.dayNum,
      workout_name: opts.workoutName,
      workout_date: opts.workoutDate,
      completed: opts.completed,
    });
  }
}
