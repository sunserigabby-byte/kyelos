import type { Exercise, ExerciseSet } from "./training-types";

// User-programmed upper body work for off-days when THP runs lower body.
// Built around evidence-based volleyball strength principles:
//   - High pull:push ratio (~2:1) for shoulder health.
//   - Direct mid-trap and lower-trap work (Y/T/W, face pulls, reverse fly).
//   - Rotator cuff health (banded ER, lying ER, Cuban press).
//   - Power transfer (med ball, banded explosive pulldown).
//   - Tantrum-style high-velocity scapular stabilization.
//   - Anti-rotation / anti-extension core.

export type UpperBodyWorkoutKey = "push" | "pull_midtrap" | "swing_power";

export type UpperBodyWorkout = {
  key: UpperBodyWorkoutKey;
  name: string;
  focus: string;
  intro: string;
  exercises: Exercise[];
};

function sets(count: number, reps: number | string, intensity = "RPE 8", rest?: number): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType: "working" as const,
    targetReps: reps,
    targetIntensity: intensity,
    restSeconds: rest,
  }));
}

function powerSets(count: number, reps: number | string, intensity = "Max intent", rest = 60): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType: "power" as const,
    targetReps: reps,
    targetIntensity: intensity,
    restSeconds: rest,
  }));
}

function durationSets(count: number, durationSeconds: number, label = "Hold", rest = 30): ExerciseSet[] {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    setType: "duration" as const,
    targetReps: label,
    targetIntensity: "Hold",
    durationSeconds,
    restSeconds: rest,
  }));
}

const pushWorkout: UpperBodyWorkout = {
  key: "push",
  name: "Upper Push + Stability",
  focus: "Chest / Shoulders / Triceps with mid-trap support",
  intro:
    "Heavy press primary, then high-volume pull + mid-trap as antagonist work. Finish with delts and triceps. 4-5 reps in reserve on main lifts unless noted.",
  exercises: [
    {
      name: "Barbell Bench Press",
      exerciseType: "ramp_top",
      description: "4 × 6-8 @ RPE 8. 2-3 min rest. Pause briefly on chest.",
      sets: sets(4, "6-8", "RPE 8", 150),
      trackingMode: "weight_reps",
      notes:
        "Pinch shoulder blades back and down before unrack. Bar to mid/lower chest. Pause adds top-end carryover.",
      volleyballNote: "Builds horizontal pressing strength — base for the swing finish.",
    },
    {
      name: "Seated Dumbbell Shoulder Press",
      exerciseType: "volume",
      description: "3 × 8-10 @ RPE 8. 90s rest.",
      sets: sets(3, "8-10", "RPE 8", 90),
      trackingMode: "weight_reps",
      notes:
        "Neutral grip (palms facing) is shoulder-friendlier than pronated for overhead athletes.",
    },
    {
      name: "Chest-Supported DB Row",
      exerciseType: "volume",
      description: "4 × 10-12 @ RPE 8. 90s rest. PULL VOLUME — keep heavy.",
      sets: sets(4, "10-12", "RPE 8", 90),
      trackingMode: "weight_reps",
      notes:
        "Incline bench at ~30°. Pull elbows toward hip pockets, squeeze mid-back at top for 1 second.",
      volleyballNote:
        "Volume here matters more than your bench. Keep the 2:1 pull:push ratio.",
    },
    {
      name: "Cable Face Pull (rope)",
      exerciseType: "accessory",
      description: "4 × 15 @ RPE 7-8. 60s rest. Mid-trap + rear delt + external rotation.",
      sets: sets(4, 15, "RPE 7-8", 60),
      trackingMode: "weight_reps",
      notes:
        "Rope at eye height. Pull toward forehead, externally rotate (knuckles up). Squeeze mid-back hard at end-range — don't shrug.",
      volleyballNote:
        "The single most important shoulder-health exercise for spikers. Do religiously.",
    },
    {
      name: "Cable Lateral Raise (single arm)",
      exerciseType: "accessory",
      description: "3 × 12-15/side @ RPE 8. 45s rest.",
      sets: sets(3, "12-15/side", "RPE 8", 45),
      trackingMode: "weight_reps",
      notes:
        "Cable from the low pulley, opposite side. Lead with elbow, stop at shoulder height. Cable keeps tension through the whole ROM.",
    },
    {
      name: "Tricep Rope Pushdown + Dropset",
      exerciseType: "accessory",
      description: "3 × 12 + final-set dropset. 60s rest.",
      sets: sets(3, 12, "RPE 8", 60),
      trackingMode: "weight_reps",
      notes:
        "Last set: drop weight by ~30%, immediately rep to failure.",
    },
    {
      name: "Pallof Press",
      exerciseType: "core",
      description: "3 × 10/side. 45s rest. Anti-rotation core.",
      sets: sets(3, "10/side", "Tension", 45),
      trackingMode: "weight_reps",
      volleyballNote: "Anti-rotation = no power leaks during the swing.",
    },
  ],
};

const pullMidTrapWorkout: UpperBodyWorkout = {
  key: "pull_midtrap",
  name: "Upper Pull + Mid Trap",
  focus: "Back thickness + lats + dedicated mid/lower trap focus",
  intro:
    "Heavy pull primary, then four direct mid-trap exercises. Mid trap is the spike-position stabilizer most volleyball players neglect.",
  exercises: [
    {
      name: "Weighted Pull-up (or Lat Pulldown)",
      exerciseType: "ramp_top",
      description: "4 × 5-8 @ RPE 8. 2-3 min rest. Strength primary.",
      sets: sets(4, "5-8", "RPE 8", 150),
      trackingMode: "weight_reps",
      notes:
        "Initiate from the lats — pull chest to bar, don't bring chin over. If bodyweight isn't a 5-rep max yet, use the assisted machine.",
      volleyballNote:
        "Lats accelerate the arm down through contact. THE swing-strength lift.",
    },
    {
      name: "Barbell Row (Pendlay or Standard)",
      exerciseType: "volume",
      description: "4 × 8 @ RPE 8. 2 min rest.",
      sets: sets(4, 8, "RPE 8", 120),
      trackingMode: "weight_reps",
      notes:
        "Pendlay = bar from floor, dead stop. Standard = bar from knee, no momentum.",
    },
    {
      name: "Single-Arm DB Row",
      exerciseType: "volume",
      description: "3 × 10/side @ RPE 8. 60s rest.",
      sets: sets(3, "10/side", "RPE 8", 60),
      trackingMode: "weight_reps",
      notes:
        "Hand and knee on bench. Row to the hip, pause 1 sec at the top, control the eccentric.",
    },
    {
      name: "Prone Y-Raise (incline bench, light DBs)",
      exerciseType: "accessory",
      description: "3 × 12. 45s rest. MID/LOWER TRAP.",
      sets: sets(3, 12, "Light (2.5-5 lb)", 45),
      trackingMode: "weight_reps",
      notes:
        "Face down on 30° incline bench. Arms in a Y overhead. Lift DBs by squeezing the bottom of the shoulder blades — feel the lower/mid trap fire, not the upper trap.",
      volleyballNote:
        "Lower trap is what keeps the shoulder blade tracking properly under load — the silent shoulder-saver.",
    },
    {
      name: "Prone T-Raise (incline bench, light DBs)",
      exerciseType: "accessory",
      description: "3 × 12. 45s rest. MID TRAP DIRECT.",
      sets: sets(3, 12, "Light (3-8 lb)", 45),
      trackingMode: "weight_reps",
      notes:
        "Same setup. Arms straight out to the sides (T). Squeeze the mid-back to lift the DBs. Pause 1 sec at the top.",
      volleyballNote: "Direct mid-trap isolation — this is what you specifically asked for.",
    },
    {
      name: "Prone W-Raise (incline bench)",
      exerciseType: "accessory",
      description: "3 × 10. 45s rest. MID TRAP + EXTERNAL ROTATION.",
      sets: sets(3, 10, "Light (2.5-5 lb)", 45),
      trackingMode: "weight_reps",
      notes:
        "Same setup. Elbows bent at 90°, upper arms perpendicular to torso. Squeeze the shoulder blades together — small ROM, big squeeze. Mid trap + posterior cuff.",
    },
    {
      name: "Cable Reverse Fly",
      exerciseType: "accessory",
      description: "3 × 15 @ RPE 8. 45s rest. Rear delt + mid trap.",
      sets: sets(3, 15, "RPE 8", 45),
      trackingMode: "weight_reps",
      notes:
        "Cables crossed in front, pull apart in a wide arc. Hold the contraction for 1 second.",
    },
    {
      name: "Hammer Curl",
      exerciseType: "accessory",
      description: "3 × 10-12 @ RPE 8. 60s rest.",
      sets: sets(3, "10-12", "RPE 8", 60),
      trackingMode: "weight_reps",
    },
    {
      name: "Dead Bug",
      exerciseType: "core",
      description: "3 × 10/side, slow tempo.",
      sets: sets(3, "10/side", "Slow", 30),
      trackingMode: "bodyweight",
      notes: "Lower back stays glued to the floor. Slow exhale on the descent.",
    },
  ],
};

const swingPowerWorkout: UpperBodyWorkout = {
  key: "swing_power",
  name: "Swing Power + Cuff",
  focus: "Velocity-based upper power + rotator cuff health",
  intro:
    "Low load, MAX intent. Power output is the goal — full recovery between sets. Finish with rotator cuff and scapular stability work to protect the shoulder under high-velocity load.",
  exercises: [
    {
      name: "Standing Medicine Ball Overhead Slam",
      exerciseType: "power_throw",
      description: "4 × 8, MAX intent. 60s rest.",
      sets: powerSets(4, 8, "Max velocity", 60),
      trackingMode: "power",
      notes:
        "8-12 lb ball overhead, slam down with max force. Catch on bounce. Drive through the lats — this IS the swing-down pattern.",
    },
    {
      name: "Standing Med Ball Rotational Throw",
      exerciseType: "power_throw",
      description: "4 × 6/side, MAX intent against wall. 60s rest.",
      sets: powerSets(4, "6/side", "Max velocity", 60),
      trackingMode: "power",
      notes:
        "Stand sideways to wall. Throw 6-10 lb ball with rotation from the hips. Catch and reset between reps.",
      volleyballNote: "This IS your swing pattern transferred to the wall.",
    },
    {
      name: "Banded Explosive Pulldown",
      exerciseType: "power_throw",
      description: "3 × 8 max acceleration. 60s rest.",
      sets: powerSets(3, 8, "Max acceleration", 60),
      trackingMode: "weight_reps",
      notes:
        "Heavy band anchored overhead, kneel or stand. Pull DOWN as fast as possible, control return. Velocity > load.",
      volleyballNote: "Trains the lats to accelerate — rate of force development for the swing.",
    },
    {
      name: "Plyo Push-Up (or pin push-up)",
      exerciseType: "power_plyo",
      description: "3 × 6 max intent. 90s rest.",
      sets: powerSets(3, 6, "Max intent", 90),
      trackingMode: "bodyweight",
      notes:
        "Hands leave the ground at the top of each rep. Elevate on a bench if too hard. Quality > quantity.",
    },
    {
      name: "Lying External Rotation (DB)",
      exerciseType: "accessory",
      description: "3 × 12/side @ light DB. 45s rest. ROTATOR CUFF.",
      sets: sets(3, "12/side", "Light (3-5 lb)", 45),
      trackingMode: "weight_reps",
      notes:
        "Side-lying, elbow tucked at side, forearm across stomach. Rotate DB up to ceiling. Small ROM, slow tempo. THIS is direct infraspinatus.",
    },
    {
      name: "Cuban Press",
      exerciseType: "accessory",
      description: "3 × 8 @ very light DBs. 60s rest. Cuff + scapula integrated.",
      sets: sets(3, 8, "Very light (5 lb)", 60),
      trackingMode: "weight_reps",
      notes:
        "Stand, DBs at waist, elbows out wide. Sequence: 1) high row (elbows up to shoulder height), 2) externally rotate (forearms vertical), 3) press overhead, 4) reverse the whole pattern down. Slow and controlled.",
      volleyballNote:
        "Integrated rotator cuff + scapular stability + overhead control. Pre-hab gold.",
    },
    {
      name: "T-Position Tantrum",
      exerciseType: "tantrum",
      description: "3 × 20s/arm. T position. Light-medium band.",
      sets: durationSets(3, 20, "Max velocity", 30),
      trackingMode: "time",
      notes:
        "Seated on floor, legs extended. Arm threaded through band anchored at chest height, extended out to side at 90°. Move arm RAPIDLY for 20s.",
      volleyballNote:
        "Hits rear delts + external rotators — the rapid-stabilization muscles for swing deceleration.",
    },
    {
      name: "Y-Position Tantrum",
      exerciseType: "tantrum",
      description: "3 × 20s/arm. Y position. Light-medium band.",
      sets: durationSets(3, 20, "Max velocity", 30),
      trackingMode: "time",
      notes:
        "Seated. Arm through band, extended overhead at diagonal (Y). Move RAPIDLY for 20s.",
      volleyballNote:
        "Lower trap + supraspinatus under speed — overhead stability for spike position.",
    },
    {
      name: "Side Plank (anti-lateral flexion)",
      exerciseType: "core",
      description: "3 × 20-30s/side. 30s rest.",
      sets: durationSets(3, 25, "Hold", 30),
      trackingMode: "time",
      notes:
        "Stack feet, drive hips up, hold straight line. Anti-rotation extension.",
    },
  ],
};

export const upperBodyWorkouts: Record<UpperBodyWorkoutKey, UpperBodyWorkout> = {
  push: pushWorkout,
  pull_midtrap: pullMidTrapWorkout,
  swing_power: swingPowerWorkout,
};

// ============================================
// Weekly schedule
// ============================================

export type DayKind =
  | { type: "upper"; workoutKey: UpperBodyWorkoutKey }
  | { type: "thp_lower" }
  | { type: "court" }
  | { type: "rest" };

// 0=Sun .. 6=Sat
export const WEEKLY_SCHEDULE: DayKind[] = [
  { type: "rest" },                                  // Sun
  { type: "upper", workoutKey: "push" },             // Mon
  { type: "thp_lower" },                             // Tue
  { type: "upper", workoutKey: "pull_midtrap" },     // Wed
  { type: "thp_lower" },                             // Thu
  { type: "upper", workoutKey: "swing_power" },      // Fri
  { type: "court" },                                 // Sat
];

export function dayKindForISO(iso: string): DayKind {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return WEEKLY_SCHEDULE[dow];
}

export function workoutForISO(iso: string): UpperBodyWorkout | null {
  const kind = dayKindForISO(iso);
  return kind.type === "upper" ? upperBodyWorkouts[kind.workoutKey] : null;
}

// Render-friendly labels and icons for each day kind.
export function dayKindLabel(kind: DayKind): { short: string; long: string; icon: string } {
  switch (kind.type) {
    case "upper": {
      const w = upperBodyWorkouts[kind.workoutKey];
      return {
        short: w.key === "push" ? "Push" : w.key === "pull_midtrap" ? "Pull" : "Power",
        long: w.name,
        icon: w.key === "swing_power" ? "🚀" : "💪",
      };
    }
    case "thp_lower":
      return { short: "THP", long: "THP Lower Body", icon: "🏋️" };
    case "court":
      return { short: "Court", long: "Court / Practice", icon: "🏐" };
    case "rest":
      return { short: "Rest", long: "Rest", icon: "😴" };
  }
}
