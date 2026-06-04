import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/local-date";

export type GoalCategory = "financial" | "nutrition" | "fitness" | "other";
export type GoalOwner = "gabby" | "jon" | "shared";
export type GoalPriority = "high" | "medium" | "low";
export type GoalStatus = "active" | "complete" | "paused";
export type PhaseStatus = "locked" | "active" | "complete";
export type Person = "gabby" | "jon";

export type Goal = {
  id: string;
  title: string;
  category: GoalCategory;
  owner: GoalOwner;
  priority: GoalPriority;
  status: GoalStatus;
  start_date: string;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalPhase = {
  id: string;
  goal_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  status: PhaseStatus;
  is_cashflow: boolean;
  monthly_contribution_target: number | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  phase_id: string;
  sort_order: number;
  label: string;
  checked: boolean;
  created_at: string;
  updated_at: string;
};

export type GoalContribution = {
  id: string;
  phase_id: string;
  date: string;
  amount: number;
  note: string | null;
  created_by: Person;
  created_at: string;
};

export const CATEGORY_META: Record<GoalCategory, { label: string; icon: string; accentClass: string }> = {
  financial: { label: "Financial", icon: "💰", accentClass: "border-l-emerald-500" },
  nutrition: { label: "Nutrition", icon: "🥗", accentClass: "border-l-amber-500" },
  fitness:   { label: "Fitness",   icon: "🏋️", accentClass: "border-l-terracotta" },
  other:     { label: "Other",     icon: "✨", accentClass: "border-l-forest" },
};

export const OWNER_LABEL: Record<GoalOwner, string> = {
  gabby: "Gabby",
  jon: "Jon",
  shared: "Shared",
};

// Goals visible to a given person: their own + shared.
export async function getVisibleGoals(person: Person): Promise<Goal[]> {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .or(`owner.eq.${person},owner.eq.shared`)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as Goal[]) ?? [];
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const { data } = await supabase.from("goals").select("*").eq("id", id).maybeSingle();
  return (data as Goal | null) ?? null;
}

export async function getPhasesForGoal(goalId: string): Promise<GoalPhase[]> {
  const { data } = await supabase
    .from("goal_phases")
    .select("*")
    .eq("goal_id", goalId)
    .order("phase_number", { ascending: true });
  return (data as GoalPhase[]) ?? [];
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const phases = await getPhasesForGoal(goalId);
  if (phases.length === 0) return [];
  const { data } = await supabase
    .from("goal_contributions")
    .select("*")
    .in("phase_id", phases.map((p) => p.id))
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as GoalContribution[]) ?? [];
}

export async function addContribution(opts: {
  phaseId: string;
  amount: number;
  date?: string;
  note?: string;
  createdBy: Person;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const date = opts.date ?? todayLocalISO();
  const { data: inserted, error: insertErr } = await supabase
    .from("goal_contributions")
    .insert({
      phase_id: opts.phaseId,
      amount: opts.amount,
      date,
      note: opts.note ?? null,
      created_by: opts.createdBy,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to log contribution" };
  }

  // Recompute current_value for this phase from the sum of its contributions.
  await recomputePhaseTotal(opts.phaseId);
  return { ok: true };
}

export async function deleteContribution(id: string): Promise<void> {
  const { data: contrib } = await supabase
    .from("goal_contributions")
    .select("phase_id")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("goal_contributions").delete().eq("id", id);
  if (contrib) await recomputePhaseTotal((contrib as { phase_id: string }).phase_id);
}

// Sum every contribution for a phase and write it back to current_value.
// Authoritative single source of truth, immune to drift.
export async function recomputePhaseTotal(phaseId: string): Promise<void> {
  const { data } = await supabase
    .from("goal_contributions")
    .select("amount")
    .eq("phase_id", phaseId);
  const total = ((data as { amount: number }[] | null) ?? []).reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );
  await supabase
    .from("goal_phases")
    .update({ current_value: total, updated_at: new Date().toISOString() })
    .eq("id", phaseId);
}

// Mark a phase complete and unlock the next phase (if any).
export async function completePhase(phase: GoalPhase): Promise<void> {
  await supabase
    .from("goal_phases")
    .update({ status: "complete", updated_at: new Date().toISOString() })
    .eq("id", phase.id);

  const { data: next } = await supabase
    .from("goal_phases")
    .select("*")
    .eq("goal_id", phase.goal_id)
    .eq("phase_number", phase.phase_number + 1)
    .maybeSingle();

  if (next) {
    await supabase
      .from("goal_phases")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", (next as GoalPhase).id);
  } else {
    // No more phases — mark the goal complete.
    await supabase
      .from("goals")
      .update({ status: "complete", updated_at: new Date().toISOString() })
      .eq("id", phase.goal_id);
  }
}

// Re-open a completed phase (and re-lock any later ones).
export async function reopenPhase(phase: GoalPhase): Promise<void> {
  await supabase
    .from("goal_phases")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", phase.id);
  await supabase
    .from("goal_phases")
    .update({ status: "locked", updated_at: new Date().toISOString() })
    .eq("goal_id", phase.goal_id)
    .gt("phase_number", phase.phase_number);
  // Reopen the parent goal in case it was marked complete.
  await supabase
    .from("goals")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", phase.goal_id);
}

// ============================================
// Create / edit
// ============================================

export type DraftPhase = {
  id?: string;
  phase_number: number;
  title: string;
  description?: string;
  target_value: number;
  unit: string;
  is_cashflow: boolean;
  monthly_contribution_target?: number | null;
};

export type DraftGoal = {
  id?: string;
  title: string;
  category: GoalCategory;
  owner: GoalOwner;
  priority: GoalPriority;
  start_date: string;
  target_date?: string | null;
  notes?: string;
  phases: DraftPhase[];
};

export async function createGoalWithPhases(draft: DraftGoal): Promise<string | null> {
  const { data: goalRow, error } = await supabase
    .from("goals")
    .insert({
      title: draft.title,
      category: draft.category,
      owner: draft.owner,
      priority: draft.priority,
      start_date: draft.start_date,
      target_date: draft.target_date ?? null,
      notes: draft.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !goalRow) return null;
  const goalId = (goalRow as { id: string }).id;

  if (draft.phases.length > 0) {
    const rows = draft.phases.map((p, i) => ({
      goal_id: goalId,
      phase_number: p.phase_number,
      title: p.title,
      description: p.description ?? null,
      target_value: p.target_value,
      unit: p.unit,
      is_cashflow: p.is_cashflow,
      monthly_contribution_target: p.monthly_contribution_target ?? null,
      status: i === 0 ? "active" : "locked",
    }));
    await supabase.from("goal_phases").insert(rows);
  }
  return goalId;
}

export async function updateGoalWithPhases(draft: DraftGoal): Promise<boolean> {
  if (!draft.id) return false;
  await supabase
    .from("goals")
    .update({
      title: draft.title,
      category: draft.category,
      owner: draft.owner,
      priority: draft.priority,
      start_date: draft.start_date,
      target_date: draft.target_date ?? null,
      notes: draft.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draft.id);

  // For phases: update existing, insert new, delete missing.
  const existing = await getPhasesForGoal(draft.id);
  const incomingIds = new Set(draft.phases.map((p) => p.id).filter(Boolean) as string[]);
  const toDelete = existing.filter((p) => !incomingIds.has(p.id));
  for (const p of toDelete) {
    await supabase.from("goal_phases").delete().eq("id", p.id);
  }

  for (const p of draft.phases) {
    if (p.id) {
      await supabase
        .from("goal_phases")
        .update({
          phase_number: p.phase_number,
          title: p.title,
          description: p.description ?? null,
          target_value: p.target_value,
          unit: p.unit,
          is_cashflow: p.is_cashflow,
          monthly_contribution_target: p.monthly_contribution_target ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
    } else {
      await supabase.from("goal_phases").insert({
        goal_id: draft.id,
        phase_number: p.phase_number,
        title: p.title,
        description: p.description ?? null,
        target_value: p.target_value,
        unit: p.unit,
        is_cashflow: p.is_cashflow,
        monthly_contribution_target: p.monthly_contribution_target ?? null,
        status: "locked",
      });
    }
  }
  return true;
}

export async function deleteGoal(id: string): Promise<void> {
  await supabase.from("goals").delete().eq("id", id);
}

// ============================================
// Progress + pace
// ============================================

// Overall goal progress = sum of (current/target) across accumulation phases.
// Cashflow phases contribute as fully-complete (1) or not (0).
// Returns 0..1.
export function overallProgress(phases: GoalPhase[]): number {
  if (phases.length === 0) return 0;
  let totalTarget = 0;
  let totalCurrent = 0;
  for (const p of phases) {
    if (p.is_cashflow) {
      totalTarget += 1;
      totalCurrent += p.status === "complete" ? 1 : 0;
    } else if (p.target_value > 0) {
      totalTarget += p.target_value;
      totalCurrent += Math.min(p.current_value, p.target_value);
    }
  }
  if (totalTarget === 0) return 0;
  return Math.max(0, Math.min(1, totalCurrent / totalTarget));
}

export function phaseProgress(phase: GoalPhase): number {
  if (phase.is_cashflow) return phase.status === "complete" ? 1 : 0;
  if (phase.target_value <= 0) return phase.status === "complete" ? 1 : 0;
  return Math.max(0, Math.min(1, phase.current_value / phase.target_value));
}

// Pace vs target_date. Returns a string like "+$420 ahead" / "−$210 behind"
// or null if the goal has no target_date or no measurable progress yet.
export function paceSummary(goal: Goal, phases: GoalPhase[]): {
  status: "ahead" | "behind" | "on_track";
  delta: number;
  unit: string;
  message: string;
} | null {
  if (!goal.target_date) return null;
  const start = Date.parse(goal.start_date + "T00:00:00Z");
  const target = Date.parse(goal.target_date + "T00:00:00Z");
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(target) || target <= start) return null;
  const elapsedFrac = Math.max(0, Math.min(1, (now - start) / (target - start)));

  // Only measure pace across accumulation phases (skip cashflow Phase 1).
  const accumulation = phases.filter((p) => !p.is_cashflow && p.target_value > 0);
  if (accumulation.length === 0) return null;
  const totalTarget = accumulation.reduce((s, p) => s + p.target_value, 0);
  const totalCurrent = accumulation.reduce(
    (s, p) => s + Math.min(p.current_value, p.target_value),
    0
  );
  const expected = totalTarget * elapsedFrac;
  const delta = totalCurrent - expected; // + = ahead, − = behind
  const unit = accumulation[0].unit;
  const tolerance = totalTarget * 0.02; // within 2% = on track

  const status: "ahead" | "behind" | "on_track" =
    delta > tolerance ? "ahead" : delta < -tolerance ? "behind" : "on_track";

  const abs = Math.abs(delta);
  const display = unit === "$" ? `$${Math.round(abs).toLocaleString()}` : `${Math.round(abs)} ${unit}`;
  const message =
    status === "on_track"
      ? "On pace with the target date."
      : status === "ahead"
      ? `${display} ahead of pace.`
      : `${display} behind pace.`;
  return { status, delta, unit, message };
}

// ============================================
// Helpers
// ============================================

export function activePhaseOf(phases: GoalPhase[]): GoalPhase | null {
  return phases.find((p) => p.status === "active") ?? null;
}

export function formatPhaseValue(value: number, unit: string): string {
  if (unit === "$") return `$${Math.round(value).toLocaleString()}`;
  if (unit === "status") return value > 0 ? "Covered" : "Pending";
  return `${value} ${unit}`;
}

// ============================================
// Checklist
// ============================================

export async function getChecklistForPhase(phaseId: string): Promise<ChecklistItem[]> {
  const { data } = await supabase
    .from("goal_phase_checklist_items")
    .select("*")
    .eq("phase_id", phaseId)
    .order("sort_order", { ascending: true });
  return (data as ChecklistItem[]) ?? [];
}

export async function getChecklistForGoal(goalId: string): Promise<ChecklistItem[]> {
  const phases = await getPhasesForGoal(goalId);
  if (phases.length === 0) return [];
  const { data } = await supabase
    .from("goal_phase_checklist_items")
    .select("*")
    .in("phase_id", phases.map((p) => p.id))
    .order("sort_order", { ascending: true });
  return (data as ChecklistItem[]) ?? [];
}

export async function setChecklistItemChecked(id: string, checked: boolean): Promise<void> {
  await supabase
    .from("goal_phase_checklist_items")
    .update({ checked, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function addChecklistItem(phaseId: string, label: string, sortOrder: number): Promise<void> {
  await supabase.from("goal_phase_checklist_items").insert({
    phase_id: phaseId,
    label,
    sort_order: sortOrder,
  });
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await supabase.from("goal_phase_checklist_items").delete().eq("id", id);
}

// ============================================
// Weekly contribution target
// ============================================

const WEEKS_PER_MONTH = 4.345; // average

export function weeklyTargetFromMonthly(monthlyTarget: number | null | undefined): number {
  if (!monthlyTarget || monthlyTarget <= 0) return 0;
  return Math.round(monthlyTarget / WEEKS_PER_MONTH);
}

// Active phase's monthly target, falling back to the first phase with one set.
export function monthlyTargetFromPhases(phases: GoalPhase[]): number {
  const active = phases.find((p) => p.status === "active");
  if (active?.monthly_contribution_target) return Number(active.monthly_contribution_target);
  const fallback = phases.find((p) => p.monthly_contribution_target);
  return fallback ? Number(fallback.monthly_contribution_target) : 0;
}

// Returns YYYY-MM-DD strings for Monday and Sunday of the local week
// containing `now`. ISO weeks (Mon-Sun).
export function weekRange(now: Date = new Date()): { start: string; end: string } {
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = local.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  const start = new Date(local);
  start.setDate(local.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

// Sum contributions across all of a goal's phases for the current week.
export async function getWeeklyContributionsForGoal(goalId: string): Promise<number> {
  const phases = await getPhasesForGoal(goalId);
  if (phases.length === 0) return 0;
  const { start, end } = weekRange();
  const { data } = await supabase
    .from("goal_contributions")
    .select("amount")
    .in("phase_id", phases.map((p) => p.id))
    .gte("date", start)
    .lte("date", end);
  return ((data as { amount: number }[] | null) ?? []).reduce(
    (s, r) => s + Number(r.amount),
    0
  );
}
