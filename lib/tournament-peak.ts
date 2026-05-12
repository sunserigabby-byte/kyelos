import type { Exercise, WorkoutDay } from "./training-types";
import { swingPrep, tantrumFull } from "./exercises-common";

// 7-day taper ending Friday June 26 (tournament day).
// Day 1: Sat Jun 20  -  Day 7: Fri Jun 26 (Tournament)

function sets(count: number, reps: number | string, intensity: string, rest?: number, setType: "working" | "warmup" | "top" | "backoff" | "ramp" | "power" | "duration" = "working"): import("./training-types").ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType,
    targetReps: reps,
    targetIntensity: intensity,
    restSeconds: rest,
  }));
}

const day1Exercises: Exercise[] = [
  {
    name: "Barbell Bench Press",
    exerciseType: "ramp_top",
    description: "Top set 5 @ RPE 8, back-offs 3 × 8 @ 75%",
    sets: [
      { setNumber: 1, setType: "ramp", targetReps: 5, targetIntensity: "60%", restSeconds: 120 },
      { setNumber: 2, setType: "ramp", targetReps: 5, targetIntensity: "70%", restSeconds: 120 },
      { setNumber: 3, setType: "ramp", targetReps: 5, targetIntensity: "80%", restSeconds: 180 },
      { setNumber: 4, setType: "top", targetReps: 5, targetIntensity: "Top set @ RPE 8", restSeconds: 180 },
      { setNumber: 5, setType: "backoff", targetReps: 8, targetIntensity: "75% of top", restSeconds: 120 },
      { setNumber: 6, setType: "backoff", targetReps: 8, targetIntensity: "75% of top", restSeconds: 120 },
      { setNumber: 7, setType: "backoff", targetReps: 8, targetIntensity: "75% of top", restSeconds: 120 },
    ],
    trackingMode: "weight_reps",
    notes: "Slightly conservative — last hard upper before taper.",
  },
  {
    name: "Bodyweight Squat",
    exerciseType: "volume",
    description: "3 × 10 slow tempo",
    sets: sets(3, 10, "Slow tempo", 60),
    trackingMode: "bodyweight",
    notes: "First loaded lower body. Test the knee. Stop if pain >3/10.",
  },
  {
    name: "Leg Press (light)",
    exerciseType: "volume",
    description: "3 × 12 @ RPE 6 (~50% pre-injection weight)",
    sets: sets(3, 12, "RPE 6", 90),
    trackingMode: "weight_reps",
  },
  {
    name: "Barbell Hip Thrust",
    exerciseType: "volume",
    description: "3 × 10 @ RPE 7",
    sets: sets(3, 10, "RPE 7", 90),
    trackingMode: "weight_reps",
  },
  {
    name: "Medicine Ball Rotational Throw",
    exerciseType: "power_throw",
    description: "4 × 8/side max intent",
    sets: sets(4, "8/side", "Max intent", 60, "power"),
    trackingMode: "power",
    volleyballNote: "Lower body returns gently today. Don't try to set PRs — you're easing back in.",
  },
];

const day2Exercises: Exercise[] = [
  {
    name: "Light Box Jumps (8-12\" box)",
    exerciseType: "power_plyo",
    description: "5 × 5 reps",
    sets: sets(5, 5, "Soft landings", 90, "power"),
    trackingMode: "power",
    notes: "Start LOW. Land soft. Step down, don't jump down.",
  },
  {
    name: "Bounds (forward)",
    exerciseType: "power_plyo",
    description: "3 × 6 bounds",
    sets: sets(3, 6, "Controlled", 90, "power"),
    trackingMode: "power",
  },
  {
    name: "Jump Squat (light, half-depth)",
    exerciseType: "power_plyo",
    description: "3 × 8",
    sets: sets(3, 8, "Half depth, soft", 90, "power"),
    trackingMode: "power",
  },
  ...tantrumFull,
  { name: "Pallof Press", exerciseType: "core", description: "3 × 12/side", sets: sets(3, "12/side", "RPE 7", 45), trackingMode: "weight_reps" },
  {
    name: "Hollow Hold",
    exerciseType: "core",
    description: "3 × 45s",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      { setNumber: 2, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      { setNumber: 3, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
    ],
    trackingMode: "time",
  },
];

const day3Exercises: Exercise[] = [
  {
    name: "Weighted Pull-up",
    exerciseType: "ramp_top",
    description: "Top set 5 @ RPE 8",
    sets: [
      { setNumber: 1, setType: "ramp", targetReps: 5, targetIntensity: "BW", restSeconds: 120 },
      { setNumber: 2, setType: "ramp", targetReps: 5, targetIntensity: "+10 lb", restSeconds: 120 },
      { setNumber: 3, setType: "ramp", targetReps: 5, targetIntensity: "+20 lb", restSeconds: 180 },
      { setNumber: 4, setType: "top", targetReps: 5, targetIntensity: "Top set @ RPE 8", restSeconds: 180 },
    ],
    trackingMode: "weight_reps",
  },
  { name: "Barbell Row", exerciseType: "volume", description: "4 × 8 @ RPE 8", sets: sets(4, 8, "RPE 8", 90), trackingMode: "weight_reps" },
  {
    name: "Cable Rotational Pull",
    exerciseType: "power_throw",
    description: "4 × 8/side, max acceleration",
    sets: sets(4, "8/side", "Max acceleration", 60, "power"),
    trackingMode: "power",
  },
  { name: "Face Pull", exerciseType: "accessory", description: "4 × 15", sets: sets(4, 15, "RPE 8", 45), trackingMode: "weight_reps" },
  {
    name: "Court Work (optional)",
    exerciseType: "conditioning",
    description: "30-45 min volleyball court",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "30-45 min", targetIntensity: "Light hitting", durationSeconds: 1800 },
    ],
    trackingMode: "time",
    optional: true,
    notes: "If court available: light hitting, controlled approaches, no diving. Tune the swing pattern.",
  },
];

const day4Exercises: Exercise[] = [
  {
    name: "Easy Bike or Walk",
    exerciseType: "conditioning",
    description: "30 min",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "30 min", targetIntensity: "Easy", durationSeconds: 1800 },
    ],
    trackingMode: "time",
  },
  {
    name: "Mobility Flow",
    exerciseType: "mobility",
    description: "20 min",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "20 min", targetIntensity: "Easy", durationSeconds: 1200 },
    ],
    trackingMode: "time",
  },
  {
    name: "Sauna (optional)",
    exerciseType: "conditioning",
    description: "20 min",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "20 min", targetIntensity: "Heat", durationSeconds: 1200 },
    ],
    trackingMode: "time",
    optional: true,
    notes: "Dandelion tea bumps to 3 cups today. Normal sodium last day. Hydrate aggressively.",
  },
];

const day5Exercises: Exercise[] = [
  { name: "Goblet Squat (depletion circuit)", exerciseType: "conditioning", description: "4 rounds × 15", sets: sets(4, 15, "Moderate", 60), trackingMode: "weight_reps" },
  { name: "DB Bench Press (depletion)", exerciseType: "conditioning", description: "4 rounds × 15", sets: sets(4, 15, "Moderate", 60), trackingMode: "weight_reps" },
  { name: "DB Row (depletion)", exerciseType: "conditioning", description: "4 rounds × 15", sets: sets(4, 15, "Moderate", 60), trackingMode: "weight_reps" },
  { name: "Walking Lunge (depletion)", exerciseType: "conditioning", description: "4 rounds × 10/leg", sets: sets(4, "10/leg", "Bodyweight", 60), trackingMode: "bodyweight" },
  { name: "DB Curl + OHP Combo (depletion)", exerciseType: "conditioning", description: "4 rounds × 12", sets: sets(4, 12, "Moderate", 60), trackingMode: "weight_reps" },
  {
    name: "Plank (depletion)",
    exerciseType: "conditioning",
    description: "4 rounds × 45s",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      { setNumber: 2, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      { setNumber: 3, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
      { setNumber: 4, setType: "duration", targetReps: "45s", targetIntensity: "Hold", durationSeconds: 45, restSeconds: 60 },
    ],
    trackingMode: "time",
    notes:
      "Cut sodium to near zero. No starch at dinner. Water stays at 1 gallon. 3 cups dandelion tea.",
  },
];

const day6Exercises: Exercise[] = [
  {
    name: "Pre-Tournament Pump Circuit",
    exerciseType: "power_plyo",
    description: "15 min light: push-ups 15, band rows 20, BW squats 20 (test knee), glute bridges 25, plank 45s",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "15 min", targetIntensity: "Light pump", durationSeconds: 900 },
    ],
    trackingMode: "time",
    notes:
      "Water drops to 50 oz, sipped. Zero sodium. Carbs ~80g. Creatine: KEEP TAKING IT. Early bed.",
  },
];

const day7Exercises: Exercise[] = [
  {
    name: "Morning Activation",
    exerciseType: "mobility",
    description: "10 min light",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "10 min", targetIntensity: "Light", durationSeconds: 600 },
    ],
    trackingMode: "time",
    notes:
      "Light arm circles, banded scap pull-aparts, 10 push-ups, 10 air squats, swing prep mini-series. Eat simple clean food. Hydrate steadily, don't chug. Creatine in morning coffee. Go compete. 🏐",
  },
];

export const gabbyTournament: WorkoutDay[] = [
  {
    day: 1, weekNum: 1, dayOfWeek: "Sat", date: "Saturday, Jun 20", isoDate: "2026-06-20",
    focus: "Reintegration",
    workoutName: "Heavy Upper + Lower Reintegration",
    intro: "First loaded lower body since PRP. Keep upper conservative — this is the last hard upper before taper.",
    swingPrep,
    exercises: day1Exercises,
    progressionNote: "Knee re-enters loaded work. Listen to it.",
  },
  {
    day: 2, weekNum: 1, dayOfWeek: "Sun", date: "Sunday, Jun 21", isoDate: "2026-06-21",
    focus: "Plyo Reintegration + Core",
    workoutName: "Plyometric Reintegration + Core",
    intro: "Low-box jumps, bounds, tantrums. Soft landings. Step down, don't jump down.",
    swingPrep,
    exercises: day2Exercises,
    progressionNote: "Reintroducing plyometrics gently.",
  },
  {
    day: 3, weekNum: 1, dayOfWeek: "Mon", date: "Monday, Jun 22", isoDate: "2026-06-22",
    focus: "Heavy Pull + Court Work",
    workoutName: "Heavy Pull + Court Work",
    intro: "Last hard pull. Add optional court work for swing pattern timing.",
    swingPrep,
    exercises: day3Exercises,
    progressionNote: "Last hard pull. Drop volume after this.",
  },
  {
    day: 4, weekNum: 1, dayOfWeek: "Tue", date: "Tuesday, Jun 23", isoDate: "2026-06-23",
    focus: "Peak Week Begins",
    workoutName: "Active Recovery + Sauna",
    intro: "Easy movement only. Peak week protocol begins. Dandelion tea x3 today.",
    exercises: day4Exercises,
    progressionNote: "Water manipulation begins.",
  },
  {
    day: 5, weekNum: 1, dayOfWeek: "Wed", date: "Wednesday, Jun 24", isoDate: "2026-06-24",
    focus: "Sodium Cut + Glycogen Drop",
    workoutName: "Depletion Circuit",
    intro: "Full-body circuit, 4 rounds, 60s rest between rounds. Moderate load — depletion, not strength.",
    exercises: day5Exercises,
    progressionNote: "Strip sodium. Drop starch tonight.",
  },
  {
    day: 6, weekNum: 1, dayOfWeek: "Thu", date: "Thursday, Jun 25", isoDate: "2026-06-25",
    focus: "Final Prep",
    workoutName: "Pre-Tournament Pump",
    intro: "15-min light pump. Test knee on bodyweight squats. Water drops, sodium zero, early bed.",
    exercises: day6Exercises,
    progressionNote: "Pump up, dry out, sleep.",
  },
  {
    day: 7, weekNum: 1, dayOfWeek: "Fri", date: "Friday, Jun 26", isoDate: "2026-06-26",
    focus: "Compete",
    workoutName: "🏐 TOURNAMENT DAY",
    intro: "Activation only. Eat simple. Hydrate steady. Go compete.",
    exercises: day7Exercises,
    progressionNote: "Today is the day. Trust the work.",
  },
];

// Photo days for Phase 4: Days 1, 3, 5, 7 (every 2 days)
export const TOURNAMENT_PHOTO_DAYS = new Set([1, 3, 5, 7]);
