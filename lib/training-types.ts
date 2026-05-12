export type ExerciseType =
  | "ramp_top"
  | "volume"
  | "accessory"
  | "power_throw"
  | "power_plyo"
  | "tantrum"
  | "core"
  | "conditioning"
  | "mobility"
  | "swing_prep"
  | "single_leg"
  | "rehab";

export type SetType =
  | "warmup"
  | "ramp"
  | "top"
  | "backoff"
  | "working"
  | "power"
  | "duration";

export type TrackingMode = "weight_reps" | "power" | "time" | "bodyweight";

export type ExerciseSet = {
  setNumber: number;
  setType: SetType;
  targetReps: number | string;
  targetIntensity: string;
  restSeconds?: number;
  durationSeconds?: number;
};

export type Exercise = {
  name: string;
  exerciseType: ExerciseType;
  description: string;
  sets: ExerciseSet[];
  notes?: string;
  volleyballNote?: string;
  trackingMode: TrackingMode;
  optional?: boolean;
  unlocksOnDay?: number;
};

export type WorkoutDay = {
  day: number;
  weekNum: number;
  dayOfWeek: string;
  date: string;        // display, e.g. "Tuesday, May 12"
  isoDate: string;
  focus: string;
  workoutName: string;
  intro: string;
  swingPrep?: Exercise[];
  exercises: Exercise[];
  singleLegLeft?: Exercise[];
  rightLegRehab?: Exercise[];
  progressionNote: string;
};

export type FoodOption = {
  id: string;
  name: string;
  serving: string;
  macros: { protein?: number; carbs?: number; fat?: number };
  fatHeavy?: boolean;
};

export type MealSlot = {
  key: "meal_1" | "meal_2" | "meal_3" | "meal_4";
  label: string;
  time: string;
  targetMacros: { protein: number; carbs: number; fat: number };
  showVeggies: boolean;
  options: {
    proteins: FoodOption[];
    carbs: FoodOption[];
    fats: FoodOption[];
    veggies?: FoodOption[];
  };
};
