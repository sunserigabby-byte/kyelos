// Static 6-phase training plan (Jun 9 → Dec 13, 2026).
// Phase metadata lives here in code; per-person dynamic state
// (active flag, completion, daily logs) lives in the `phases` table
// and is joined via the `code` column.

export type PhaseCode = "phase_a" | "phase_b" | "phase_c" | "phase_d" | "phase_e" | "phase_f";

export type MacroBlock = {
  cal: number;
  p: number;
  f: number;
  c: number;
  dates?: string;
};

export type EndMilestones = {
  weight: number | null;
  bf_pct: number | null;
  muscle: number | null;
  standing_vertical?: number | null;
  approach_vertical?: number | null;
  cmj_cm?: number | null;
  squat_1rm?: number | null;
};

export type TrainingPhase = {
  code: PhaseCode;
  name: string;
  subtitle: string;
  dateRange: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  focusLabel: string;
  purpose: string;
  macros: Record<string, MacroBlock>;
  trainingSplit: string;
  verticalGoal: string;
  endMilestones: EndMilestones;
};

export const phases: Record<PhaseCode, TrainingPhase> = {
  phase_a: {
    code: "phase_a",
    name: "Pottstown Rebuild",
    subtitle: "Restore + Tournament Prep",
    dateRange: "Jun 9 – Jun 28, 2026",
    startDate: "2026-06-09",
    endDate: "2026-06-28",
    focusLabel: "Rebuild",
    purpose:
      "Restore lower-body muscle lost during PRP. Slight deficit, heavy bilateral lifting returns, peak for Pottstown.",
    macros: {
      refeed:     { dates: "Jun 9–15",  cal: 1850, p: 150, f: 60, c: 190 },
      build:      { dates: "Jun 16–22", cal: 2000, p: 150, f: 65, c: 215 },
      sharpen:    { dates: "Jun 23–26", cal: 2050, p: 150, f: 60, c: 230 },
      tournament: { dates: "Jun 27–28", cal: 2300, p: 150, f: 65, c: 275 },
    },
    trainingSplit: "5 lift days + 1 court + 1 rest. Low-amplitude plyo only.",
    verticalGoal: "No max testing. Foundation only. Knee stability first.",
    endMilestones: { weight: 128, bf_pct: 22, muscle: 96, standing_vertical: null, approach_vertical: null },
  },
  phase_b: {
    code: "phase_b",
    name: "Muscle Build A",
    subtitle: "Reclaim Baseline",
    dateRange: "Jun 29 – Jul 26, 2026",
    startDate: "2026-06-29",
    endDate: "2026-07-26",
    focusLabel: "Build",
    purpose:
      "Pure muscle building. Light surplus on training days. Plyo reintegrates. First vertical test mid-phase.",
    macros: {
      lower_body_day: { cal: 2300, p: 155, f: 65, c: 270 },
      upper_body_day: { cal: 2200, p: 155, f: 70, c: 240 },
      rest_day:       { cal: 2000, p: 155, f: 70, c: 195 },
    },
    trainingSplit: "4 lift days + 1 plyo day + 1 court + 1 rest",
    verticalGoal: "Reclaim January baseline: standing 19–20\", approach 24–25\"",
    endMilestones: { weight: 132, bf_pct: 21, muscle: 98, standing_vertical: 20, approach_vertical: 25, cmj_cm: 28 },
  },
  phase_c: {
    code: "phase_c",
    name: "Muscle Build B",
    subtitle: "Strength + Career Best Territory",
    dateRange: "Jul 27 – Aug 23, 2026",
    startDate: "2026-07-27",
    endDate: "2026-08-23",
    focusLabel: "Strength",
    purpose:
      "Push past pre-injury baselines. Depth jumps, approach jumps with full 4-step. Career best vertical territory by end.",
    macros: {
      lower_body_day: { cal: 2300, p: 155, f: 65, c: 270 },
      upper_body_day: { cal: 2200, p: 155, f: 70, c: 240 },
      rest_day:       { cal: 2000, p: 155, f: 70, c: 195 },
    },
    trainingSplit: "4 lift days + 1 plyo day + 1 court + 1 rest",
    verticalGoal: "Return to / surpass career best: approach 26–27\"",
    endMilestones: { weight: 133, bf_pct: 20, muscle: 99, standing_vertical: 22, approach_vertical: 27, cmj_cm: 30, squat_1rm: 165 },
  },
  phase_d: {
    code: "phase_d",
    name: "Power Development",
    subtitle: "Convert Strength to Spring",
    dateRange: "Aug 24 – Sep 20, 2026",
    startDate: "2026-08-24",
    endDate: "2026-09-20",
    focusLabel: "Power",
    purpose:
      "Max strength + reactive plyometrics. Maintenance calories. THE block where vertical PRs happen.",
    macros: {
      all_days: { cal: 2100, p: 155, f: 65, c: 230 },
    },
    trainingSplit: "4 lift days + 1 dedicated jump day + 1 court + 1 rest",
    verticalGoal: "NEW PR: approach 28–30\". This is the breakthrough block.",
    endMilestones: { weight: 133, bf_pct: 19, muscle: 100, standing_vertical: 24, approach_vertical: 29, cmj_cm: 35, squat_1rm: 185 },
  },
  phase_e: {
    code: "phase_e",
    name: "Polish",
    subtitle: "Strength Hold + Mild Cut",
    dateRange: "Sep 21 – Oct 18, 2026",
    startDate: "2026-09-21",
    endDate: "2026-10-18",
    focusLabel: "Hold",
    purpose:
      "Maintain strength and vertical gains. Light deficit to begin dropping body fat.",
    macros: {
      training_day: { cal: 2000, p: 150, f: 60, c: 220 },
      rest_day:     { cal: 1850, p: 150, f: 60, c: 175 },
    },
    trainingSplit: "4 lift days + 1 jump day + court time + rest",
    verticalGoal: "Hold gains. No further PRs targeted this phase.",
    endMilestones: { weight: 131, bf_pct: 19, muscle: 100, standing_vertical: 24, approach_vertical: 29, cmj_cm: 35 },
  },
  phase_f: {
    code: "phase_f",
    name: "Final Cut to 18%",
    subtitle: "Land at Goal Composition",
    dateRange: "Oct 19 – Dec 13, 2026",
    startDate: "2026-10-19",
    endDate: "2026-12-13",
    focusLabel: "Cut",
    purpose:
      "Targeted fat loss to land at 128 / 18% / 99 muscle. Heavy intensity preserved, volume reduced.",
    macros: {
      training_day: { cal: 1850, p: 155, f: 55, c: 190 },
      rest_day:     { cal: 1700, p: 155, f: 55, c: 145 },
    },
    trainingSplit: "4 lift days, intensity heavy / volume moderate, 1 jump day weekly",
    verticalGoal: "Hold approach vertical 28–30\" through deficit.",
    endMilestones: { weight: 128, bf_pct: 18, muscle: 99, standing_vertical: 24, approach_vertical: 29, cmj_cm: 35 },
  },
};

export const PHASE_ORDER: PhaseCode[] = ["phase_a", "phase_b", "phase_c", "phase_d", "phase_e", "phase_f"];

// FINAL GOAL — the target on Dec 13 once Phase F completes.
export const LONG_RANGE_GOAL = {
  weight_lbs: 128,
  body_fat_pct: 18,
  muscle_mass_lbs: 99,
  approach_vertical_inches: 29,
  cmj_cm: 35,
  goal_date: "2026-12-13",
};

// Active phase = the one whose date range contains the local date.
// Falls back to phase_a if today is before the plan; falls back to
// phase_f if today is after.
export function getActiveTrainingPhase(todayISO: string): TrainingPhase {
  if (todayISO < phases.phase_a.startDate) return phases.phase_a;
  for (const code of PHASE_ORDER) {
    const p = phases[code];
    if (todayISO >= p.startDate && todayISO <= p.endDate) return p;
  }
  return phases.phase_f;
}

export function getPhaseByCode(code: string): TrainingPhase | null {
  return (phases as Record<string, TrainingPhase>)[code] ?? null;
}

// Inclusive day number within the active phase (day 1 = startDate).
export function dayNInPhase(phase: TrainingPhase, todayISO: string): number {
  const [py, pm, pd] = phase.startDate.split("-").map(Number);
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const startMs = Date.UTC(py, pm - 1, pd);
  const todayMs = Date.UTC(ty, tm - 1, td);
  return Math.max(1, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
}

export function totalDaysInPhase(phase: TrainingPhase): number {
  const [sy, sm, sd] = phase.startDate.split("-").map(Number);
  const [ey, em, ed] = phase.endDate.split("-").map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
}

// Pick the most relevant macro block for today's date.
// For phases with date-keyed macros (phase_a), match by date range;
// otherwise return the first block as a representative.
export function macroBlockForToday(phase: TrainingPhase, todayISO: string): { key: string; block: MacroBlock } | null {
  const entries = Object.entries(phase.macros);
  if (entries.length === 0) return null;
  // Try date-string matching for phase_a's "Jun 9–15" style.
  if (phase.code === "phase_a") {
    const dt = parseLocal(todayISO);
    for (const [key, block] of entries) {
      if (!block.dates) continue;
      const range = parseRange(block.dates, dt.getFullYear());
      if (range && dt >= range.start && dt <= range.end) return { key, block };
    }
    return { key: entries[0][0], block: entries[0][1] };
  }
  // Default: return the first block (training day is most common).
  return { key: entries[0][0], block: entries[0][1] };
}

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Parses strings like "Jun 9–15" or "Jun 16–22" → { start, end } Dates.
function parseRange(s: string, year: number): { start: Date; end: Date } | null {
  const match = s.match(/^(\w+)\s+(\d+)[–-](\d+)$/);
  if (!match) return null;
  const monthName = match[1];
  const startDay = Number(match[2]);
  const endDay = Number(match[3]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mIdx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase().slice(0, 3));
  if (mIdx < 0) return null;
  return { start: new Date(year, mIdx, startDay), end: new Date(year, mIdx, endDay) };
}
