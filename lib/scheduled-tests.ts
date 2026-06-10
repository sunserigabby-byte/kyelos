import { supabase } from "@/lib/supabase";
import { todayLocalISO } from "@/lib/local-date";

export type TestType = "body_comp" | "vertical" | "cmj" | "strength_pr" | "photo";

export type ScheduledTest = {
  id: string;
  user_id: string;
  phase_id: string;
  scheduled_date: string;
  test_type: TestType;
  test_label: string;
  target_value: string | null;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
};

export async function getTestsForRange(opts: {
  userId: string;
  startISO: string;
  endISO: string;
}): Promise<ScheduledTest[]> {
  const { data } = await supabase
    .from("scheduled_tests")
    .select("*")
    .eq("user_id", opts.userId)
    .gte("scheduled_date", opts.startISO)
    .lte("scheduled_date", opts.endISO)
    .order("scheduled_date", { ascending: true });
  return (data as ScheduledTest[]) ?? [];
}

export async function getTodayAndUpcoming(userId: string, days = 7): Promise<ScheduledTest[]> {
  const start = todayLocalISO();
  const end = addDaysISO(start, days);
  return getTestsForRange({ userId, startISO: start, endISO: end });
}

export async function getTodaysTests(userId: string): Promise<ScheduledTest[]> {
  const iso = todayLocalISO();
  return getTestsForRange({ userId, startISO: iso, endISO: iso });
}

export async function markTestCompleted(id: string, completed: boolean): Promise<void> {
  await supabase
    .from("scheduled_tests")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id);
}

export async function rescheduleTest(id: string, newDateISO: string): Promise<void> {
  await supabase
    .from("scheduled_tests")
    .update({ scheduled_date: newDateISO })
    .eq("id", id);
}

export async function getTestsForPhase(userId: string, phaseCode: string): Promise<ScheduledTest[]> {
  const { data } = await supabase
    .from("scheduled_tests")
    .select("*")
    .eq("user_id", userId)
    .eq("phase_id", phaseCode)
    .order("scheduled_date", { ascending: true });
  return (data as ScheduledTest[]) ?? [];
}

// ===== Phase milestones =====
export type PhaseMilestone = {
  id: string;
  phase_id: string;
  metric: string;
  target_value: number | null;
  target_unit: string | null;
  notes: string | null;
};

export async function getMilestonesForPhase(phaseCode: string): Promise<PhaseMilestone[]> {
  const { data } = await supabase
    .from("phase_milestones")
    .select("*")
    .eq("phase_id", phaseCode)
    .order("metric", { ascending: true });
  return (data as PhaseMilestone[]) ?? [];
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
