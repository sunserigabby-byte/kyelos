export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "late_luteal";

export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: "Menstrual Phase",
  follicular: "Follicular Phase",
  ovulatory: "Ovulatory Phase",
  luteal: "Luteal Phase",
  late_luteal: "Late Luteal Phase",
};

export const PHASE_GUIDANCE: Record<CyclePhase, string> = {
  menstrual:
    "Energy may be lower the first 2 days. Lean into recovery, prioritize sleep. Iron-rich foods help. Strength returns by day 3-4.",
  follicular:
    "Best phase for hard training and strength PRs. Estrogen rising = better recovery, better mood, lower water retention. Make the most of it.",
  ovulatory:
    "Peak strength window. Slight dip in metabolism but explosive performance. Stay hydrated.",
  luteal:
    "Higher core body temp, slightly higher metabolism. Cravings starting to increase. Stick rigidly to the plan — small slips compound here.",
  late_luteal:
    "Water retention peaks (2-5 lbs of luteal water is normal). Scale unreliable — trust the mirror. Cravings high, energy may dip. Bump magnesium to 500mg, add B6 50mg, sauna 2-3x this week. The peak week protocol works WITH this phase to strip water dramatically.",
};

export function getCycleDay(lastPeriodStart: string, today: Date): number {
  const [y, m, d] = lastPeriodStart.split("-").map(Number);
  const startUtc = Date.UTC(y, m - 1, d);
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const diffDays = Math.round((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function getCyclePhase(
  cycleDay: number,
  cycleLength: number
): CyclePhase {
  if (cycleDay <= 5) return "menstrual";
  const folEnd = Math.floor(cycleLength / 2) - 2;
  if (cycleDay <= folEnd) return "follicular";
  const ovEnd = folEnd + 4;
  if (cycleDay <= ovEnd) return "ovulatory";
  if (cycleDay <= cycleLength - 5) return "luteal";
  return "late_luteal";
}

export function daysUntilPeriod(
  lastPeriodStart: string,
  cycleLength: number,
  today: Date
): number {
  const cycleDay = getCycleDay(lastPeriodStart, today);
  return cycleLength + 1 - cycleDay;
}

// Compute cycle day for a future or past calendar date string ("YYYY-MM-DD").
export function getCycleDayForDate(
  lastPeriodStart: string,
  isoDate: string
): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return getCycleDay(lastPeriodStart, new Date(y, m - 1, d));
}
