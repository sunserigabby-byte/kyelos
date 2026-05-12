import type { Exercise, WorkoutDay } from "./training-types";
import { rightLegRehab, singleLegLeft, swingPrep, tantrumFull } from "./exercises-common";

// ============================================
// Date math: Day 1 = Tuesday May 12, 2026
// Weekly cycle: Tue/Wed/Thu/Fri/Sat/Sun/Mon
// Phase 3 runs 39 days through Friday June 19
// ============================================

const START_ISO = "2026-05-12";
const TOTAL_DAYS = 39;

const DAY_NAMES = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const FULL_DAY_NAMES = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function displayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${FULL_DAY_NAMES[((y && m && d) ? new Date(Date.UTC(y, m - 1, d)).getUTCDay() : 0)]}, ${MONTHS[m - 1]} ${d}`;
}

// Map calendar weekday (0=Sun, 1=Mon, ..., 6=Sat) to our cycle index (0=Tue, ..., 6=Mon)
function cycleIndexFor(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const calendarDow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  // 0=Sun -> 5, 1=Mon -> 6, 2=Tue -> 0, 3=Wed -> 1, ...
  return (calendarDow + 5) % 7;
}

function displayWithCustomDay(iso: string): string {
  const idx = cycleIndexFor(iso);
  const [_, m, d] = iso.split("-").map(Number);
  return `${FULL_DAY_NAMES[idx]}, ${MONTHS[m - 1]} ${d}`;
}

// ============================================
// Weekly day-pattern factories — return exercises array.
// Each day-of-week (Tue..Mon) has the same structure across all weeks;
// progressionNote varies by week.
// ============================================

// Helper to build a set list
function sets(count: number, reps: number | string, intensity: string, rest?: number, setType: "working" | "warmup" | "top" | "backoff" | "ramp" | "power" | "duration" = "working"): import("./training-types").ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType,
    targetReps: reps,
    targetIntensity: intensity,
    restSeconds: rest,
  }));
}

// ---------- Tuesday: Cycling + Anti-Rotation Core ----------
function tuesdayExercises(): Exercise[] {
  return [
    {
      name: "Stationary Cycling",
      exerciseType: "conditioning",
      description: "30 min Zone 2, HR 130-140",
      sets: [
        { setNumber: 1, setType: "duration", targetReps: "30 min", targetIntensity: "Zone 2 conversational", durationSeconds: 1800 },
      ],
      trackingMode: "time",
      notes: "Conversational pace. Protects knee while building aerobic base.",
    },
    {
      name: "Pallof Press",
      exerciseType: "core",
      description: "3 × 12/side @ RPE 8",
      sets: sets(3, "12/side", "RPE 8", 45),
      trackingMode: "weight_reps",
      volleyballNote: "Anti-rotation = power transfer without leaks.",
    },
    {
      name: "Hollow Body Hold",
      exerciseType: "core",
      description: "3 × 30-45s",
      sets: [
        { setNumber: 1, setType: "duration", targetReps: "30-45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
        { setNumber: 2, setType: "duration", targetReps: "30-45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
        { setNumber: 3, setType: "duration", targetReps: "30-45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      ],
      trackingMode: "time",
    },
    {
      name: "Dead Bug",
      exerciseType: "core",
      description: "3 × 12/side, slow tempo",
      sets: sets(3, "12/side", "Slow tempo", 45),
      trackingMode: "bodyweight",
    },
    {
      name: "Side Plank with Reach-Through",
      exerciseType: "core",
      description: "3 × 10/side",
      sets: sets(3, "10/side", "Bodyweight", 45),
      trackingMode: "bodyweight",
    },
    {
      name: "Cable Woodchop (high-to-low)",
      exerciseType: "core",
      description: "3 × 12/side",
      sets: sets(3, "12/side", "RPE 7-8", 60),
      trackingMode: "weight_reps",
      volleyballNote: "Diagonal force chain — same pattern as a spike.",
    },
  ];
}

// ---------- Wednesday: Heavy Pull ----------
function wednesdayExercises(): Exercise[] {
  return [
    {
      name: "Weighted Pull-up (or Lat Pulldown)",
      exerciseType: "ramp_top",
      description: "Ramp to top set of 5, then 3 back-offs of 6",
      sets: [
        { setNumber: 1, setType: "ramp", targetReps: 5, targetIntensity: "BW", restSeconds: 120 },
        { setNumber: 2, setType: "ramp", targetReps: 5, targetIntensity: "+10 lb", restSeconds: 120 },
        { setNumber: 3, setType: "ramp", targetReps: 5, targetIntensity: "+20 lb", restSeconds: 120 },
        { setNumber: 4, setType: "ramp", targetReps: 5, targetIntensity: "+25 lb", restSeconds: 180 },
        { setNumber: 5, setType: "top", targetReps: 5, targetIntensity: "Top set @ RPE 9", restSeconds: 180 },
        { setNumber: 6, setType: "backoff", targetReps: 6, targetIntensity: "80% of top", restSeconds: 120 },
        { setNumber: 7, setType: "backoff", targetReps: 6, targetIntensity: "80% of top", restSeconds: 120 },
        { setNumber: 8, setType: "backoff", targetReps: 6, targetIntensity: "80% of top", restSeconds: 120 },
      ],
      trackingMode: "weight_reps",
      volleyballNote: "Lats accelerate your arm down through contact. This is THE swing-strength lift.",
    },
    { name: "Barbell Row", exerciseType: "volume", description: "4 × 8 @ RPE 8", sets: sets(4, 8, "RPE 8", 90), trackingMode: "weight_reps" },
    { name: "Single-Arm DB Row", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: sets(3, "10/side", "RPE 8", 60), trackingMode: "weight_reps" },
    {
      name: "Cable Rotational Pull (high-to-low)",
      exerciseType: "power_throw",
      description: "4 × 8/side, max acceleration",
      sets: sets(4, "8/side", "Max acceleration", 60, "power"),
      trackingMode: "power",
      volleyballNote: "Mimics the downward pull of a spike.",
    },
    { name: "Face Pull", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: sets(4, 15, "RPE 8", 45), trackingMode: "weight_reps" },
    { name: "Hammer Curl", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: sets(3, 12, "RPE 8", 45), trackingMode: "weight_reps" },
  ];
}

// ---------- Thursday: Swing Power ----------
function thursdayExercises(): Exercise[] {
  return [
    {
      name: "Kneeling Tennis Ball Throw",
      exerciseType: "power_throw",
      description: "4 × 10/side, max intent",
      sets: sets(4, "10/side", "Max intent", 60, "power"),
      trackingMode: "power",
      notes: "Drop to one knee. Hold tennis ball. Mimic full arm swing into wall, max effort. Rotate from torso.",
    },
    {
      name: "Standing Medicine Ball Overhead Slam",
      exerciseType: "power_throw",
      description: "4 × 10, max intent",
      sets: sets(4, 10, "Max intent", 60, "power"),
      trackingMode: "power",
      notes: "8-12 lb ball overhead, slam down with max force, catch on bounce.",
    },
    {
      name: "Standing Medicine Ball Rotational Throw",
      exerciseType: "power_throw",
      description: "4 × 8/side, max intent",
      sets: sets(4, "8/side", "Max intent", 60, "power"),
      trackingMode: "power",
    },
    {
      name: "Banded Rotational Throw",
      exerciseType: "power_throw",
      description: "3 × 10/side, max intent",
      sets: sets(3, "10/side", "Max intent", 45, "power"),
      trackingMode: "power",
    },
    {
      name: "Plyo Push-Up",
      exerciseType: "power_plyo",
      description: "3 × 6, max intent",
      sets: sets(3, 6, "Max intent", 90, "power"),
      trackingMode: "power",
      notes: "Hands leave ground each rep. Elevate on bench if too hard.",
    },
    ...tantrumFull,
  ];
}

// ---------- Friday: Volume Push ----------
function fridayExercises(): Exercise[] {
  return [
    { name: "Incline DB Bench Press", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: sets(4, 10, "RPE 8", 90), trackingMode: "weight_reps" },
    { name: "Seated DB Shoulder Press", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: sets(4, 10, "RPE 8", 90), trackingMode: "weight_reps" },
    { name: "Landmine Press", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: sets(3, "10/side", "RPE 8", 60), trackingMode: "weight_reps" },
    {
      name: "Push-Up to T",
      exerciseType: "accessory",
      description: "3 × 8/side",
      sets: sets(3, "8/side", "Bodyweight", 45),
      trackingMode: "bodyweight",
      notes: "Push-up, rotate to one side reaching arm to ceiling, return, push-up, other side.",
    },
    { name: "Cable Lateral Raise", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: sets(4, 15, "RPE 8", 45), trackingMode: "weight_reps" },
    { name: "Overhead Tricep Extension", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: sets(3, 12, "RPE 8", 45), trackingMode: "weight_reps" },
  ];
}

// ---------- Saturday: Volume Pull + Shoulder Durability ----------
function saturdayExercises(): Exercise[] {
  return [
    {
      name: "Straight-Arm Lat Pulldown",
      exerciseType: "volume",
      description: "4 × 12 @ RPE 8",
      sets: sets(4, 12, "RPE 8", 60),
      trackingMode: "weight_reps",
      volleyballNote: "Pure lat work, no biceps. THE swing-down muscle in isolation.",
    },
    { name: "Chest-Supported Row", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: sets(4, 10, "RPE 8", 90), trackingMode: "weight_reps" },
    {
      name: "Cable Face Pull with External Rotation",
      exerciseType: "accessory",
      description: "4 × 15 @ RPE 8",
      sets: sets(4, 15, "RPE 8", 45),
      trackingMode: "weight_reps",
      volleyballNote: "Most important shoulder health exercise. Do this religiously.",
    },
    {
      name: "Prone Y-Raise (incline bench)",
      exerciseType: "accessory",
      description: "3 × 12 light weight",
      sets: sets(3, 12, "Light", 45),
      trackingMode: "weight_reps",
      volleyballNote: "Lower trap — the muscle most lifters underuse and overhead athletes need most.",
    },
    { name: "Rear Delt Fly", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: sets(4, 15, "RPE 8", 45), trackingMode: "weight_reps" },
    ...tantrumFull,
    { name: "Barbell Curl", exerciseType: "accessory", description: "3 × 10 @ RPE 8", sets: sets(3, 10, "RPE 8", 60), trackingMode: "weight_reps" },
  ];
}

// ---------- Sunday: Mobility + Walk + Check-In ----------
function sundayExercises(): Exercise[] {
  return [
    {
      name: "Outdoor Walk",
      exerciseType: "conditioning",
      description: "45-60 min brisk pace",
      sets: [
        { setNumber: 1, setType: "duration", targetReps: "45-60 min", targetIntensity: "Brisk", durationSeconds: 2700 },
      ],
      trackingMode: "time",
    },
    {
      name: "Mobility Flow",
      exerciseType: "mobility",
      description: "20 min flow",
      sets: [
        { setNumber: 1, setType: "duration", targetReps: "20 min", targetIntensity: "Easy", durationSeconds: 1200 },
      ],
      trackingMode: "time",
      notes:
        "Couch stretch 1 min/side, 90/90 hip rotations 8/side, T-spine open books 8/side, banded shoulder dislocates 15, child's pose 1 min.",
    },
  ];
}

// ---------- Monday: Heavy Push ----------
function mondayExercises(): Exercise[] {
  return [
    {
      name: "Barbell Bench Press",
      exerciseType: "ramp_top",
      description: "Ramp to top set of 5, then 3 back-offs of 8",
      sets: [
        { setNumber: 1, setType: "ramp", targetReps: 5, targetIntensity: "50%", restSeconds: 90 },
        { setNumber: 2, setType: "ramp", targetReps: 5, targetIntensity: "60%", restSeconds: 120 },
        { setNumber: 3, setType: "ramp", targetReps: 5, targetIntensity: "70%", restSeconds: 120 },
        { setNumber: 4, setType: "ramp", targetReps: 5, targetIntensity: "80%", restSeconds: 180 },
        { setNumber: 5, setType: "ramp", targetReps: 5, targetIntensity: "85%", restSeconds: 180 },
        { setNumber: 6, setType: "top", targetReps: 5, targetIntensity: "Top set @ RPE 9", restSeconds: 180 },
        { setNumber: 7, setType: "backoff", targetReps: 8, targetIntensity: "80% of top", restSeconds: 120 },
        { setNumber: 8, setType: "backoff", targetReps: 8, targetIntensity: "80% of top", restSeconds: 120 },
        { setNumber: 9, setType: "backoff", targetReps: 8, targetIntensity: "80% of top", restSeconds: 120 },
      ],
      trackingMode: "weight_reps",
    },
    { name: "Seated DB Shoulder Press", exerciseType: "volume", description: "4 × 8 @ RPE 8", sets: sets(4, 8, "RPE 8", 90), trackingMode: "weight_reps" },
    { name: "Landmine Press", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: sets(3, "10/side", "RPE 8", 60), trackingMode: "weight_reps" },
    {
      name: "Medicine Ball Rotational Throw",
      exerciseType: "power_throw",
      description: "4 × 8/side, max intent",
      sets: sets(4, "8/side", "Max intent", 60, "power"),
      trackingMode: "power",
      notes: "6-10 lb ball, throw at wall as hard as possible. Rotate from hips up.",
      volleyballNote: "This IS your swing pattern. The closest non-volleyball exercise to actual swing transfer.",
    },
    { name: "Tricep Rope Pushdown", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: sets(3, 12, "RPE 8", 60), trackingMode: "weight_reps" },
  ];
}

// ============================================
// Day metadata
// ============================================

type DayMeta = {
  focus: string;
  workoutName: string;
  intro: string;
  exercises: () => Exercise[];
  swingPrep: boolean;
  hasSingleLegLeft: boolean;
  hasRightLegRehab: boolean;
};

const DAY_META: DayMeta[] = [
  // Tue
  {
    focus: "Conditioning + Anti-Rotation Core",
    workoutName: "Cycling + Anti-Rotation Core",
    intro: "Knee-friendly cardio plus deep anti-rotation core. No swing prep today — no upper body lifting.",
    exercises: tuesdayExercises,
    swingPrep: false,
    hasSingleLegLeft: true,
    hasRightLegRehab: true,
  },
  // Wed
  {
    focus: "Lat Strength = Swing Power",
    workoutName: "Heavy Pull",
    intro:
      "Weighted pull-ups ramped to top set of 5. Your lats accelerate your arm down through contact — this is THE swing-strength day.",
    exercises: wednesdayExercises,
    swingPrep: true,
    hasSingleLegLeft: true,
    hasRightLegRehab: true,
  },
  // Thu
  {
    focus: "Pure Sport Transfer",
    workoutName: "Swing Power Day",
    intro:
      "Low load, max velocity. All upper body. Throws, slams, tantrums. This is where strength becomes swing speed.",
    exercises: thursdayExercises,
    swingPrep: true,
    hasSingleLegLeft: false,
    hasRightLegRehab: false,
  },
  // Fri
  {
    focus: "Hypertrophy + Sport Transfer",
    workoutName: "Volume Push (Hybrid)",
    intro: "Higher rep volume with volleyball-relevant exercise selection.",
    exercises: fridayExercises,
    swingPrep: true,
    hasSingleLegLeft: true,
    hasRightLegRehab: true,
  },
  // Sat
  {
    focus: "Shoulder Health + Pulling Volume",
    workoutName: "Volume Pull + Shoulder Durability",
    intro:
      "This is the day that keeps you healthy. Heavy on rotator cuff, lower trap, and lats. Volleyball is hard on shoulders — this is your insurance.",
    exercises: saturdayExercises,
    swingPrep: true,
    hasSingleLegLeft: false,
    hasRightLegRehab: true,
  },
  // Sun
  {
    focus: "Recovery + Reflection",
    workoutName: "Mobility + Walk + Check-In",
    intro:
      "Long walk, mobility flow, weekly check-in. Photo day on Days 1, 8, 15, 22, 29, 36.",
    exercises: sundayExercises,
    swingPrep: false,
    hasSingleLegLeft: false,
    hasRightLegRehab: true,
  },
  // Mon
  {
    focus: "Strength Foundation",
    workoutName: "Heavy Push",
    intro:
      "Heavy bench with Thibaudeau ramping. Every ramp set is practice for the top — push with intent. Finish with rotational med ball.",
    exercises: mondayExercises,
    swingPrep: true,
    hasSingleLegLeft: true,
    hasRightLegRehab: true,
  },
];

const PROGRESSION_BY_WEEK: Record<number, string> = {
  1: "Find your baseline. Top sets: weight you can do 5 clean reps with 1 left in tank. Tantrums: focus on form before speed.",
  2: "Add 2.5-5 lbs to top sets where last week felt under RPE 9. Right-leg rehab unlocks today — start the daily routine.",
  3: "Continue adding load OR add 1 rep to top sets. Knee should feel progressively better.",
  4: "Push the heaviest top sets of the cycle. This is your strongest week of pure work.",
  5: "Last full intensity week. Lock in PRs you can repeat in tournament prep.",
  6: "Deload + sharpening. Lighter top sets, technique focus. Tournament taper begins in Phase 4.",
};

// ============================================
// Build the 39-day plan
// ============================================

export const gabbyPRP: WorkoutDay[] = Array.from({ length: TOTAL_DAYS }, (_, i): WorkoutDay => {
  const dayNum = i + 1;
  const iso = addDays(START_ISO, i);
  const cycleIdx = cycleIndexFor(iso);
  const meta = DAY_META[cycleIdx];
  const weekNum = Math.floor(i / 7) + 1;
  const rehab = meta.hasRightLegRehab ? rightLegRehab : undefined;
  const sLeg = meta.hasSingleLegLeft ? singleLegLeft : undefined;

  return {
    day: dayNum,
    weekNum,
    dayOfWeek: DAY_NAMES[cycleIdx],
    date: displayWithCustomDay(iso),
    isoDate: iso,
    focus: meta.focus,
    workoutName: meta.workoutName,
    intro: meta.intro,
    swingPrep: meta.swingPrep ? swingPrep : undefined,
    exercises: meta.exercises(),
    singleLegLeft: sLeg,
    rightLegRehab: rehab,
    progressionNote: PROGRESSION_BY_WEEK[weekNum] ?? PROGRESSION_BY_WEEK[6],
  };
});

// Photo days for Phase 3: Days 1, 8, 15, 22, 29, 36
export const PRP_PHOTO_DAYS = new Set([1, 8, 15, 22, 29, 36]);
