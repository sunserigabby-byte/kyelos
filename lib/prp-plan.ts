import type { Exercise, ExerciseSet, WorkoutDay } from "./training-types";
import {
  leftLegFinisher,
  leftLegStrength,
  leftLegVolume,
  rightLegRehab,
  swingPrep,
  tantrumFull,
} from "./exercises-common";

// ============================================
// Date math: Day 1 = Tuesday May 12, 2026 (injection-day REST).
// Day 2 (Wed May 13) is a bonus rest day — see buildDay2().
// Day 15 (Tue May 26) is the second PRP injection — restricted to
// upper body + left leg through Day 18 (Fri May 29). Normal from Day 19.
// Phase 3 runs 39 days through Friday June 19.
// ============================================

const START_ISO = "2026-05-12";
const TOTAL_DAYS = 39;

const SECOND_INJECTION_DAY = 15; // Tue May 26
const POST_INJECTION_2_RESTRICTED = new Set([15, 16, 17, 18]); // No right-leg work, no cardio through Fri May 29

const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function calendarDayOfWeek(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
}

function displayDate(iso: string): string {
  const calIdx = calendarDayOfWeek(iso);
  const [, m, d] = iso.split("-").map(Number);
  return `${FULL_DAY_NAMES[calIdx]}, ${MONTHS[m - 1]} ${d}`;
}

function setsList(
  count: number,
  reps: number | string,
  intensity: string,
  rest?: number,
  setType: "working" | "warmup" | "top" | "backoff" | "ramp" | "power" | "duration" = "working"
): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType,
    targetReps: reps,
    targetIntensity: intensity,
    restSeconds: rest,
  }));
}

function durationSets(count: number, durationSeconds: number, label: string, rest?: number): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType: "duration",
    targetReps: label,
    targetIntensity: "Hold",
    durationSeconds,
    restSeconds: rest,
  }));
}

// Tag a list of exercises as a superset group with shared rest values.
function asSuperset(
  group: string,
  restBetweenExercises: number,
  restBetweenRounds: number,
  exs: Exercise[]
): Exercise[] {
  return exs.map((ex, i) => ({
    ...ex,
    supersetGroup: group,
    restBetweenExercises: i === 0 ? restBetweenExercises : ex.restBetweenExercises,
    restBetweenRounds: i === 0 ? restBetweenRounds : ex.restBetweenRounds,
  }));
}

// ============================================
// TUESDAY (Days 8, 15, 22, 29, 36): Cycling + Anti-Rotation Core
// Day 1 (May 12) is REST — handled as a special case in the build loop.
// ============================================
function tuesdayExercises(): Exercise[] {
  return [
    {
      name: "Stationary Cycling",
      exerciseType: "conditioning",
      description: "30 min Zone 2, HR 130-140",
      sets: durationSets(1, 1800, "30 min"),
      trackingMode: "time",
      notes: "Conversational pace. Protects knee while building aerobic base.",
    },
    ...asSuperset("A", 30, 60, [
      {
        name: "Pallof Press",
        exerciseType: "core",
        description: "3 × 12/side @ RPE 8",
        sets: setsList(3, "12/side", "RPE 8"),
        trackingMode: "weight_reps",
        volleyballNote: "Anti-rotation = power transfer without leaks.",
      },
      {
        name: "Hollow Body Hold",
        exerciseType: "core",
        description: "3 × 30-45s",
        sets: durationSets(3, 45, "30-45s"),
        trackingMode: "time",
      },
    ]),
    ...asSuperset("B", 30, 60, [
      {
        name: "Dead Bug",
        exerciseType: "core",
        description: "3 × 12/side, slow tempo",
        sets: setsList(3, "12/side", "Slow tempo"),
        trackingMode: "bodyweight",
      },
      {
        name: "Side Plank with Reach-Through",
        exerciseType: "core",
        description: "3 × 10/side",
        sets: setsList(3, "10/side", "Bodyweight"),
        trackingMode: "bodyweight",
      },
    ]),
    {
      name: "Cable Woodchop (high-to-low)",
      exerciseType: "core",
      description: "3 × 12/side",
      sets: setsList(3, "12/side", "RPE 7-8", 60),
      trackingMode: "weight_reps",
      volleyballNote: "Diagonal force chain — same pattern as a spike.",
    },
  ];
}

// ============================================
// WEDNESDAY: Heavy Pull + Left Leg STRENGTH (supersetted)
// ============================================
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
      volleyballNote:
        "Lats accelerate your arm down through contact. THE swing-strength lift.",
    },
    ...asSuperset("A", 45, 120, [
      { name: "Barbell Row", exerciseType: "volume", description: "4 × 8 @ RPE 8", sets: setsList(4, 8, "RPE 8"), trackingMode: "weight_reps" },
      leftLegStrength[0], // Single-Leg Hip Thrust LEFT
    ]),
    ...asSuperset("B", 45, 90, [
      { name: "Single-Arm DB Row", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: setsList(3, "10/side", "RPE 8"), trackingMode: "weight_reps" },
      leftLegStrength[1], // Single-Leg Leg Press LEFT
    ]),
    ...asSuperset("C", 45, 90, [
      leftLegStrength[2], // Glute-Bias Step Down LEFT (unlocks Day 8)
      {
        name: "Cable Rotational Pull (high-to-low)",
        exerciseType: "power_throw",
        description: "4 × 8/side, max acceleration",
        sets: setsList(4, "8/side", "Max acceleration", 60, "power"),
        trackingMode: "power",
        volleyballNote: "Mimics the downward pull of a spike.",
      },
    ]),
    ...asSuperset("D", 30, 75, [
      leftLegStrength[3], // Supported Single-Leg RDL LEFT
      { name: "Face Pull", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: setsList(4, 15, "RPE 8"), trackingMode: "weight_reps" },
    ]),
    { name: "Hammer Curl", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: setsList(3, 12, "RPE 8", 60), trackingMode: "weight_reps" },
  ];
}

// ============================================
// THURSDAY: Swing Power + Cardio
// ============================================
function thursdayExercises(): Exercise[] {
  return [
    {
      name: "Kneeling Tennis Ball Throw",
      exerciseType: "power_throw",
      description: "4 × 10/side, max intent",
      sets: setsList(4, "10/side", "Max intent", 60, "power"),
      trackingMode: "power",
      notes:
        "Drop to one knee. Hold tennis ball. Mimic full arm swing into wall, max effort. Rotate from torso.",
      volleyballNote: "Isolates the swing pattern without full-body kinetic chain.",
    },
    ...asSuperset("A", 30, 60, [
      {
        name: "Standing Medicine Ball Overhead Slam",
        exerciseType: "power_throw",
        description: "4 × 10, max intent",
        sets: setsList(4, 10, "Max intent", 0, "power"),
        trackingMode: "power",
        notes: "8-12 lb ball overhead, slam down with max force, catch on bounce.",
      },
      {
        name: "Standing Medicine Ball Rotational Throw",
        exerciseType: "power_throw",
        description: "4 × 8/side, max intent",
        sets: setsList(4, "8/side", "Max intent", 0, "power"),
        trackingMode: "power",
      },
    ]),
    ...asSuperset("B", 30, 75, [
      {
        name: "Banded Rotational Throw",
        exerciseType: "power_throw",
        description: "3 × 10/side, max intent",
        sets: setsList(3, "10/side", "Max intent", 0, "power"),
        trackingMode: "power",
      },
      {
        name: "Plyo Push-Up",
        exerciseType: "power_plyo",
        description: "3 × 6, max intent",
        sets: setsList(3, 6, "Max intent", 0, "power"),
        trackingMode: "bodyweight",
        notes: "Hands leave ground each rep. Elevate on bench if too hard.",
      },
    ]),
    ...tantrumFull,
  ];
}

// ============================================
// FRIDAY: Volume Push + Left Leg VOLUME (supersetted)
// ============================================
function fridayExercises(): Exercise[] {
  return [
    ...asSuperset("A", 60, 120, [
      { name: "Incline DB Bench Press", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: setsList(4, 10, "RPE 8"), trackingMode: "weight_reps" },
      leftLegVolume[0], // Single-Leg Explosive Hip Thrust LEFT
    ]),
    ...asSuperset("B", 45, 90, [
      { name: "Seated DB Shoulder Press", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: setsList(4, 10, "RPE 8"), trackingMode: "weight_reps" },
      leftLegVolume[2], // Seated Single-Leg Curl LEFT
    ]),
    ...asSuperset("C", 45, 90, [
      { name: "Landmine Press", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: setsList(3, "10/side", "RPE 8"), trackingMode: "weight_reps" },
      leftLegVolume[1], // Supported Single-Leg RDL LEFT
    ]),
    ...asSuperset("D", 30, 60, [
      {
        name: "Push-Up to T",
        exerciseType: "accessory",
        description: "3 × 8/side",
        sets: setsList(3, "8/side", "Bodyweight"),
        trackingMode: "bodyweight",
        notes:
          "Push-up, rotate to one side reaching arm to ceiling, return, push-up, other side.",
      },
      leftLegVolume[3], // Standing Single-Leg Calf Raise LEFT
    ]),
    ...asSuperset("E", 30, 60, [
      { name: "Cable Lateral Raise", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: setsList(4, 15, "RPE 8"), trackingMode: "weight_reps" },
      { name: "Overhead Tricep Extension", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: setsList(3, 12, "RPE 8"), trackingMode: "weight_reps" },
    ]),
  ];
}

// ============================================
// SATURDAY: Volume Pull + Shoulder Durability + Left Leg FINISHER
// ============================================
function saturdayExercises(): Exercise[] {
  return [
    ...asSuperset("A", 45, 90, [
      {
        name: "Straight-Arm Lat Pulldown",
        exerciseType: "volume",
        description: "4 × 12 @ RPE 8",
        sets: setsList(4, 12, "RPE 8"),
        trackingMode: "weight_reps",
        volleyballNote: "Pure lat work. THE swing-down muscle in isolation.",
      },
      leftLegFinisher[0], // Seated Single-Leg Extension LEFT
    ]),
    ...asSuperset("B", 45, 90, [
      { name: "Chest-Supported Row", exerciseType: "volume", description: "4 × 10 @ RPE 8", sets: setsList(4, 10, "RPE 8"), trackingMode: "weight_reps" },
      leftLegFinisher[1], // Single-Leg Hip Thrust LEFT
    ]),
    ...asSuperset("C", 30, 75, [
      {
        name: "Cable Face Pull w/ External Rotation",
        exerciseType: "accessory",
        description: "4 × 15 @ RPE 8",
        sets: setsList(4, 15, "RPE 8"),
        trackingMode: "weight_reps",
        volleyballNote: "Most important shoulder health exercise. Do religiously.",
      },
      leftLegFinisher[2], // Cable Single-Leg Kickback Explosive LEFT
    ]),
    ...asSuperset("D", 30, 60, [
      {
        name: "Prone Y-Raise (incline bench)",
        exerciseType: "accessory",
        description: "3 × 12 light weight",
        sets: setsList(3, 12, "Light"),
        trackingMode: "weight_reps",
        volleyballNote: "Lower trap activation — critical for overhead athletes.",
      },
      leftLegFinisher[3], // Supine Single-Leg Glute Bridge LEFT
    ]),
    ...asSuperset("E", 30, 60, [
      { name: "Rear Delt Fly", exerciseType: "accessory", description: "4 × 15 @ RPE 8", sets: setsList(4, 15, "RPE 8"), trackingMode: "weight_reps" },
      leftLegFinisher[4], // Seated Single-Leg Calf Raise LEFT
    ]),
    ...tantrumFull,
    { name: "Barbell Curl", exerciseType: "accessory", description: "3 × 10 @ RPE 8", sets: setsList(3, 10, "RPE 8", 60), trackingMode: "weight_reps" },
  ];
}

// ============================================
// SUNDAY: Mobility + Walk + Check-In (unchanged)
// ============================================
function sundayExercises(): Exercise[] {
  return [
    {
      name: "Outdoor Walk",
      exerciseType: "conditioning",
      description: "45-60 min brisk pace",
      sets: durationSets(1, 2700, "45-60 min"),
      trackingMode: "time",
    },
    {
      name: "Mobility Flow",
      exerciseType: "mobility",
      description: "20 min flow",
      sets: durationSets(1, 1200, "20 min"),
      trackingMode: "time",
      notes:
        "Couch stretch 1 min/side, 90/90 hip rotations 8/side, T-spine open books 8/side, banded shoulder dislocates 15, child's pose 1 min.",
    },
  ];
}

// ============================================
// MONDAY: Heavy Push
// ============================================
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
    ...asSuperset("A", 45, 90, [
      { name: "Seated DB Shoulder Press", exerciseType: "volume", description: "4 × 8 @ RPE 8", sets: setsList(4, 8, "RPE 8"), trackingMode: "weight_reps" },
      { name: "Pallof Press", exerciseType: "core", description: "3 × 12/side @ RPE 8", sets: setsList(3, "12/side", "RPE 8"), trackingMode: "weight_reps" },
    ]),
    ...asSuperset("B", 60, 90, [
      { name: "Landmine Press", exerciseType: "volume", description: "3 × 10/side @ RPE 8", sets: setsList(3, "10/side", "RPE 8"), trackingMode: "weight_reps" },
      {
        name: "Medicine Ball Rotational Throw",
        exerciseType: "power_throw",
        description: "4 × 8/side, max intent",
        sets: setsList(4, "8/side", "Max intent", 0, "power"),
        trackingMode: "power",
        notes: "6-10 lb ball, throw at wall as hard as possible. Rotate from hips up.",
        volleyballNote: "This IS your swing pattern.",
      },
    ]),
    { name: "Tricep Rope Pushdown", exerciseType: "accessory", description: "3 × 12 @ RPE 8", sets: setsList(3, 12, "RPE 8", 60), trackingMode: "weight_reps" },
  ];
}

// ============================================
// Day metadata + builder
// ============================================

type DayMeta = {
  focus: string;
  workoutName: string;
  intro: string;
  exercises: () => Exercise[];
  hasSwingPrep: boolean;
  hasRightLegRehab: boolean;
};

const META_BY_CAL_DOW: Record<number, DayMeta> = {
  0: {
    focus: "Recovery + Reflection",
    workoutName: "Mobility + Walk + Check-In",
    intro:
      "Long walk, mobility flow, weekly check-in. Photo day on Days 1, 8, 15, 22, 29, 36.",
    exercises: sundayExercises,
    hasSwingPrep: false,
    hasRightLegRehab: true,
  },
  1: {
    focus: "Strength Foundation",
    workoutName: "Heavy Push",
    intro:
      "Heavy bench, Thibaudeau ramping. Push every rep with intent. Finish with rotational med ball.",
    exercises: mondayExercises,
    hasSwingPrep: true,
    hasRightLegRehab: true,
  },
  2: {
    focus: "Conditioning + Anti-Rotation Core",
    workoutName: "Cycling + Core",
    intro:
      "Zone 2 cycle + anti-rotation core. Anti-rotation core = no power leaks during the swing.",
    exercises: tuesdayExercises,
    hasSwingPrep: false,
    hasRightLegRehab: true,
  },
  3: {
    focus: "Lat Strength + Left Leg Build",
    workoutName: "Heavy Pull + Left Leg",
    intro:
      "Weighted pull-ups ramped to top set. Left leg trains strength alongside. Supersetted to save time.",
    exercises: wednesdayExercises,
    hasSwingPrep: true,
    hasRightLegRehab: true,
  },
  4: {
    focus: "Pure Sport Transfer",
    workoutName: "Swing Power Day",
    intro:
      "Low load, max velocity. Throws, slams, tantrums. Where strength becomes swing speed. Cardio after.",
    exercises: thursdayExercises,
    hasSwingPrep: true,
    hasRightLegRehab: false,
  },
  5: {
    focus: "Hypertrophy Push + Speed",
    workoutName: "Volume Push + Left Leg Volume",
    intro:
      "Higher rep volume push paired with left leg volume and speed work.",
    exercises: fridayExercises,
    hasSwingPrep: true,
    hasRightLegRehab: true,
  },
  6: {
    focus: "Shoulder Health + Pull Volume + Left Leg Finish",
    workoutName: "Volume Pull + Shoulders + Left Leg",
    intro:
      "Highest-volume day. Pulls, shoulder health, left leg lighter work, tantrums.",
    exercises: saturdayExercises,
    hasSwingPrep: true,
    hasRightLegRehab: true,
  },
};

const PROGRESSION_BY_WEEK: Record<number, string> = {
  1: "Find your baseline. Top sets: weight you can do 5 clean reps with 1 left in tank. Tantrums: form before speed. Cardio activates Thursday Day 3.",
  2: "Add 2.5-5 lbs to top sets where last week felt under RPE 9. Right-leg rehab UNLOCKS today. Glute-bias step-downs UNLOCK today. Calf raise moves to Saturday.",
  3: "Continue adding load OR add 1 rep to top sets. Single-leg leg press should feel meaningfully stronger.",
  4: "Heaviest top sets of the cycle. Final hard week before tournament prep. Photo Day 28.",
  5: "Last full intensity week. Lock in PRs you can repeat in tournament prep.",
  6: "Deload + sharpening. Lighter top sets, technique focus. Tournament taper begins in Phase 4.",
};

const DAY_1_PROGRESSION_NOTE = "Week 1 starts after the rest window. Today is recovery only.";
const DAY_2_PROGRESSION_NOTE = "Bonus rest day. Workouts start tomorrow (Thu May 14).";

function gentleMobilityExercise(): Exercise {
  return {
    name: "Optional Gentle Mobility",
    exerciseType: "mobility",
    description:
      "Upper body only — shoulder dislocates, T-spine rotations, neck rolls. 10 min max.",
    sets: [
      {
        setNumber: 1,
        setType: "duration",
        targetReps: "Gentle",
        targetIntensity: "No strain",
        durationSeconds: 600,
      },
    ],
    trackingMode: "time",
    optional: true,
    notes:
      "Skip entirely if knee is throbbing. Sleep is more important than mobility tonight.",
  };
}

// Day 1 (May 12): injection-day rest.
function buildDay1(): WorkoutDay {
  return {
    day: 1,
    weekNum: 1,
    dayOfWeek: "Tue",
    date: "Tuesday, May 12",
    isoDate: "2026-05-12",
    focus: "Rest + Settling",
    workoutName: "Injection Day Rest",
    intro:
      "You just got the PRP injection today. Stay off your feet, hydrate, and let the joint settle. No structured workout. Light mobility only if you feel like moving.",
    swingPrep: undefined,
    exercises: [gentleMobilityExercise()],
    rightLegRehab: rightLegRehab, // still locked (unlocksOnDay 8), but shown locked
    progressionNote: DAY_1_PROGRESSION_NOTE,
  };
}

// Day 2 (May 13): bonus rest day — extra day to let the joint settle.
function buildDay2(): WorkoutDay {
  return {
    day: 2,
    weekNum: 1,
    dayOfWeek: "Wed",
    date: "Wednesday, May 13",
    isoDate: "2026-05-13",
    focus: "Extra Rest",
    workoutName: "Bonus Rest Day",
    intro:
      "Another rest day to let the joint settle. No structured workout. Light mobility only if you feel like moving. Workouts begin Thursday.",
    swingPrep: undefined,
    exercises: [gentleMobilityExercise()],
    rightLegRehab: rightLegRehab, // still locked
    progressionNote: DAY_2_PROGRESSION_NOTE,
  };
}

// ============================================
// Build the 39-day plan
// ============================================

// Strip cardio (conditioning) exercises from a workout — used during the
// 3-day window after the second PRP injection.
function stripCardio(exercises: Exercise[]): Exercise[] {
  return exercises.filter((ex) => ex.exerciseType !== "conditioning");
}

export const gabbyPRP: WorkoutDay[] = Array.from({ length: TOTAL_DAYS }, (_, i): WorkoutDay => {
  if (i === 0) return buildDay1();
  if (i === 1) return buildDay2();

  const dayNum = i + 1;
  const iso = addDays(START_ISO, i);
  const calIdx = calendarDayOfWeek(iso);
  const meta = META_BY_CAL_DOW[calIdx];
  const weekNum = Math.floor(i / 7) + 1;

  const isPostInjection2 = POST_INJECTION_2_RESTRICTED.has(dayNum);
  const isInjectionDay2 = dayNum === SECOND_INJECTION_DAY;

  const rawExercises = meta.exercises();
  const exercises = isPostInjection2 ? stripCardio(rawExercises) : rawExercises;

  let workoutName = meta.workoutName;
  let intro = meta.intro;
  let focus = meta.focus;

  if (isInjectionDay2) {
    workoutName = "Injection Day 2 — Upper Body Only";
    focus = "Second PRP injection";
    intro =
      "Second PRP injection today. No cycling, no right-leg work. Anti-rotation core only — keeps the system engaged without loading the knee.";
  } else if (isPostInjection2) {
    const daysAfter = dayNum - SECOND_INJECTION_DAY;
    workoutName = `${meta.workoutName} (Post-Injection)`;
    focus = `Day ${daysAfter} after injection 2 — restricted`;
    intro = `${meta.intro} Post-injection: no cardio and no right-leg rehab today. Right-leg work resumes Day 19 (Sat May 30).`;
  }

  return {
    day: dayNum,
    weekNum,
    dayOfWeek: SHORT_DAY_NAMES[calIdx],
    date: displayDate(iso),
    isoDate: iso,
    focus,
    workoutName,
    intro,
    swingPrep: meta.hasSwingPrep ? swingPrep : undefined,
    exercises,
    rightLegRehab: meta.hasRightLegRehab && !isPostInjection2 ? rightLegRehab : undefined,
    progressionNote: PROGRESSION_BY_WEEK[weekNum] ?? PROGRESSION_BY_WEEK[6],
  };
});

// Photo days for Phase 3: Days 1, 8, 15, 22, 29, 36
export const PRP_PHOTO_DAYS = new Set([1, 8, 15, 22, 29, 36]);

// PRP injection days within Phase 3 — surfaces a banner in the UI.
export const PRP_INJECTION_DAYS = new Set([1, 15]);
