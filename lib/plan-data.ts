// Cut protocol data for Gabby + Jon
// April 26 - May 2, 2026 (7 days)

export type Person = "gabby" | "jon";

export type WorkoutExercise = {
  name: string;
  prescription: string;
};

export type MealComponent = {
  food: string;          // default food
  serving: string;       // default serving (e.g. "5 oz cooked")
  targetGrams: number;   // macro target this component fulfills
};

export type StructuredMeal = {
  key: string;
  label: string;
  time: string;
  protein?: MealComponent;     // grams = protein
  carb?: MealComponent;         // grams = carbs
  fat?: MealComponent;          // grams = fat
  veggie?: MealComponent;       // grams = N/A (use 0); serving is just description
  note?: string;                // for meals that don't fit the structure (e.g. travel meals)
};

// Per-meal swaps loaded from Supabase
export type MealSwap = {
  protein_food?: string | null;
  protein_serving?: string | null;
  carb_food?: string | null;
  carb_serving?: string | null;
  fat_food?: string | null;
  fat_serving?: string | null;
  veggie_food?: string | null;
  veggie_serving?: string | null;
};

export type DayPlan = {
  day: number;
  date: string;           // display string, e.g. "Sunday, April 26"
  isoDate: string;        // "2026-04-26"
  title: string;
  phase: string;
  focus: string;
  amCardio: string;
  meals: StructuredMeal[];
  supplements: { key: string; time: string; item: string }[];
  peakAdjustments?: string[];
  workout: {
    intro?: string;
    exercises?: WorkoutExercise[];
    circuit?: string[];
    circuitIntro?: string;
  };
};

// Resolve a meal component against any saved swap, returning what to display.
function resolveComponent(
  defaultC: MealComponent | undefined,
  swapFood: string | null | undefined,
  swapServing: string | null | undefined
): { food: string; serving: string; targetGrams: number } | null {
  if (!defaultC) return null;
  if (swapFood && swapServing) {
    return { food: swapFood, serving: swapServing, targetGrams: defaultC.targetGrams };
  }
  return { food: defaultC.food, serving: defaultC.serving, targetGrams: defaultC.targetGrams };
}

// Build a single human-readable string describing this meal, applying any swaps.
// Used for backward-compat display in code paths that haven't moved to MealCard.
export function getMealDisplay(meal: StructuredMeal, swap?: MealSwap | null): string {
  if (meal.note) return meal.note;
  const parts: string[] = [];
  const p = resolveComponent(meal.protein, swap?.protein_food, swap?.protein_serving);
  const c = resolveComponent(meal.carb, swap?.carb_food, swap?.carb_serving);
  const f = resolveComponent(meal.fat, swap?.fat_food, swap?.fat_serving);
  const v = resolveComponent(meal.veggie, swap?.veggie_food, swap?.veggie_serving);
  if (p) parts.push(`${p.serving} ${p.food}`);
  if (c) parts.push(`${c.serving} ${c.food}`);
  if (f) parts.push(`${f.serving} ${f.food}`);
  if (v) parts.push(`${v.serving} ${v.food}`);
  return parts.join(" + ");
}

// ============================================
// GABBY'S MEAL FACTORIES
// ============================================

const gabbyMeal1: StructuredMeal = {
  key: "meal_1", label: "Meal 1", time: "7:00 AM",
  protein: { food: "Whole eggs + egg whites", serving: "3 + 3", targetGrams: 30 },
  carb: { food: "Berries", serving: "½ cup", targetGrams: 8 },
};

const gabbyMeal2: StructuredMeal = {
  key: "meal_2", label: "Meal 2", time: "11:00 AM",
  protein: { food: "Chicken breast", serving: "5 oz cooked", targetGrams: 40 },
  carb: { food: "Jasmine rice", serving: "¾ cup", targetGrams: 35 },
  fat: { food: "Olive oil", serving: "1 tbsp", targetGrams: 8 },
  veggie: { food: "Greens", serving: "2 cups", targetGrams: 0 },
};

const gabbyMeal3: StructuredMeal = {
  key: "meal_3", label: "Meal 3", time: "3:00 PM",
  protein: { food: "Whey isolate", serving: "1 scoop", targetGrams: 25 },
  carb: { food: "Banana", serving: "1 small", targetGrams: 27 },
};

type Meal4Spec = {
  protein: MealComponent;
  carb?: MealComponent;
  veggie?: MealComponent;
  fat?: MealComponent;
  note?: string;
};

function gabbyMeal4(spec: Meal4Spec): StructuredMeal {
  return {
    key: "meal_4", label: "Meal 4", time: "7:00 PM",
    protein: spec.protein,
    carb: spec.carb,
    fat: spec.fat,
    veggie: spec.veggie,
    note: spec.note,
  };
}

const gabbyStandardSupps = [
  { key: "supp_am", time: "5:30 AM", item: "Coffee + electrolytes (¼ tsp Lite Salt + 200mg Mg)" },
  { key: "supp_tea1", time: "2:00 PM", item: "Dandelion tea (cup 1)" },
  { key: "supp_creatine", time: "3:00 PM", item: "Creatine 5g" },
  { key: "supp_fishoil", time: "7:00 PM", item: "Fish oil 2–3g" },
  { key: "supp_mag", time: "9:30 PM", item: "Magnesium glycinate + dandelion tea (cup 2)" },
];

// ============================================
// GABBY'S PLAN
// ============================================

export const gabbyPlan: DayPlan[] = [
  {
    day: 1, date: "Sunday, April 26", isoDate: "2026-04-26",
    title: "Tournament Day",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Tournament play replaces training today. Stay hydrated, eat normally, save legs and arms for the rest of the week.",
    amCardio: "Optional today — tournament is the priority. If you do cardio, keep it light (20 min easy walk).",
    meals: [
      gabbyMeal1,
      gabbyMeal2,
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "Chicken or white fish", serving: "5 oz cooked", targetGrams: 40 },
        carb: { food: "Sweet potato", serving: "½ medium", targetGrams: 20 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: gabbyStandardSupps,
    workout: {
      circuitIntro: "Tournament play today replaces training. Skip the PM session.",
    },
  },
  {
    day: 2, date: "Monday, April 27", isoDate: "2026-04-27",
    title: "Glute Focus + Arm Pump",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Glute-dominant lower + super-set arm pump for aesthetics. Different from Day 1 — hip thrust anchors instead of RDL. Arms in super-sets to maximize pump in minimum time.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      gabbyMeal1,
      gabbyMeal2,
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "93/7 ground turkey", serving: "5 oz cooked", targetGrams: 40 },
        carb: { food: "Sweet potato", serving: "½ medium", targetGrams: 20 },
        veggie: { food: "Roasted zucchini & asparagus", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: gabbyStandardSupps,
    workout: {
      exercises: [
        { name: "A. Barbell hip thrust — top set + back-offs", prescription: "Top: 1×6 @ RPE 9 | Back-offs: 3×10 @ 75%" },
        { name: "B. Tempo goblet box squat (3s eccentric)", prescription: "3 × 10 @ RPE 8" },
        { name: "C1. Cable kickback (single leg)", prescription: "3 × 12/leg @ RPE 8" },
        { name: "C2. Standing cable hip abduction", prescription: "3 × 15/side @ RPE 8" },
        { name: "D. Frog pump or banded glute bridge burnout", prescription: "2 × 30 reps" },
        { name: "E1. Cable curl", prescription: "4 × 12 @ RPE 8" },
        { name: "E2. Rope pushdown", prescription: "4 × 12 @ RPE 8" },
        { name: "F1. Hammer curl", prescription: "3 × 12 @ RPE 8–9" },
        { name: "F2. Overhead tricep extension (rope)", prescription: "3 × 12 @ RPE 8–9" },
        { name: "G. Myo-rep lateral raise", prescription: "1×12 + 4 mini-sets of 4 reps, 15s rest" },
      ],
    },
  },
  {
    day: 3, date: "Tuesday, April 28", isoDate: "2026-04-28",
    title: "Upper Body Strength + HIIT",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy press + heavy pull. Full knee rest. Myo-reps on delts and face pulls.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      gabbyMeal1,
      gabbyMeal2,
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "Chicken or white fish", serving: "5 oz cooked", targetGrams: 40 },
        carb: { food: "Sweet potato", serving: "½ medium", targetGrams: 20 },
        veggie: { food: "Roasted broccoli & bell peppers", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: gabbyStandardSupps,
    workout: {
      exercises: [
        { name: "A. Weighted pull-up (or lat pulldown)", prescription: "Top: 1×5 @ RPE 8–9 | Back-offs: 3×6 @ 80%" },
        { name: "B. Incline DB press", prescription: "4 × 6 @ RPE 8" },
        { name: "C1. T-bar or landmine row", prescription: "4 × 8 @ RPE 8" },
        { name: "C2. Seated DB OHP", prescription: "4 × 8 @ RPE 8" },
        { name: "D1. Myo-rep lateral raise", prescription: "1×12 + 4 mini-sets of 4, 15s rest" },
        { name: "D2. Myo-rep face pull", prescription: "1×15 + 3 mini-sets of 5, 15s rest" },
        { name: "E. Bike intervals", prescription: "10 × 30s hard / 60s easy" },
      ],
    },
  },
  {
    day: 4, date: "Wednesday, April 29", isoDate: "2026-04-29",
    title: "Lower Strength — The Big Day",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Anchor session of the week. Heavy hip thrust + heavy RDL. Target 185+ lb hip thrust top set.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      gabbyMeal1,
      gabbyMeal2,
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "Chicken or bison", serving: "5 oz cooked", targetGrams: 40 },
        carb: { food: "Sweet potato", serving: "½ medium", targetGrams: 20 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: gabbyStandardSupps,
    workout: {
      exercises: [
        { name: "A. Barbell hip thrust — top + back-offs", prescription: "Top: 1×5 @ RPE 9 | Back-offs: 3×8 @ 80%" },
        { name: "B. Barbell or DB RDL", prescription: "4 × 6 @ RPE 8" },
        { name: "C. Tempo goblet box squat (3-1-X)", prescription: "3 × 8 @ RPE 8" },
        { name: "D1. Reverse lunge", prescription: "3 × 8/leg @ RPE 8" },
        { name: "D2. Standing hip abduction", prescription: "3 × 15/side" },
        { name: "E. Hamstring curl", prescription: "3 × 12, last set to failure" },
      ],
    },
  },
  {
    day: 5, date: "Thursday, April 30", isoDate: "2026-04-30",
    title: "Upper Strength (Peak Week Begins)",
    phase: "Phase 2: Peak Week",
    focus: "Last truly hard session. Water manipulation begins. Sauna if possible.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      gabbyMeal1,
      gabbyMeal2,
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "Chicken or white fish", serving: "5 oz cooked", targetGrams: 40 },
        carb: { food: "Sweet potato", serving: "½ medium", targetGrams: 20 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: gabbyStandardSupps,
    peakAdjustments: [
      "Normal sodium (salt your own food lightly)",
      "Water stays at 1 gallon",
      "Bump dandelion tea to 3 cups today",
      "Sauna 20 min post-workout if available",
    ],
    workout: {
      exercises: [
        { name: "A. Weighted dip or DB bench — top + back-offs", prescription: "Top: 1×5 @ RPE 9 | Back-offs: 3×6 @ 80%" },
        { name: "B. Chest-supported or Pendlay row", prescription: "4 × 6 @ RPE 8–9" },
        { name: "C1. Seated DB press", prescription: "3 × 8 @ RPE 8" },
        { name: "C2. Weighted pull-up or lat pulldown", prescription: "3 × 8 @ RPE 8" },
        { name: "D. Cluster lateral raise", prescription: "15 → 15s → 10 → 15s → 10" },
        { name: "E. Bike sprints", prescription: "8 × 30s hard / 90s easy" },
      ],
    },
  },
  {
    day: 6, date: "Friday, May 1", isoDate: "2026-05-01",
    title: "Lower Volume / Glycogen Deplete",
    phase: "Phase 2: Peak Week",
    focus: "Higher reps, moderate load. Depletion — not strength. Sodium drops hard.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      { ...gabbyMeal1, note: "No added salt today" },
      { ...gabbyMeal2, note: "No added salt today" },
      gabbyMeal3,
      gabbyMeal4({
        protein: { food: "White fish", serving: "5 oz cooked", targetGrams: 40 },
        veggie: { food: "Roasted zucchini/asparagus", serving: "2 cups", targetGrams: 0 },
        note: "NO STARCH tonight — drop the carb component",
      }),
    ],
    supplements: gabbyStandardSupps,
    peakAdjustments: [
      "Cut sodium to near zero — no added salt, no sauces",
      "Water stays at 1 gallon",
      "Carbs ~80g — drop the sweet potato from dinner",
      "3 cups dandelion tea today",
    ],
    workout: {
      circuitIntro: "Circuit x 4 rounds, 60s rest between rounds (moderate load — depletion, not strength):",
      circuit: [
        "Hip thrust: 15 reps @ RPE 7",
        "Goblet box squat: 15 reps",
        "Reverse lunge: 12/leg",
        "DB RDL: 15 reps",
        "Banded hip abduction: 20/side",
      ],
    },
  },
  {
    day: 7, date: "Saturday, May 2", isoDate: "2026-05-02",
    title: "Travel Day — Puerto Rico! 🌴",
    phase: "Phase 3: Travel Day",
    focus: "Dry out, pump up, go. Single AM workout before the airport.",
    amCardio: "No incline walk — AM pump circuit replaces it",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "After pump", note: "3 egg whites + 1 whole egg + ¼ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "Before flight", note: "4 oz chicken + 2 rice cakes + small handful greens (no salt, no oil)" },
      { key: "meal_3", label: "Snack", time: "Flight", note: "Whey + small banana if hungry" },
      { key: "meal_4", label: "Dinner", time: "PR!", note: "Enjoy yourself — you made it 🌴" },
    ],
    supplements: [
      { key: "supp_am", time: "Morning", item: "Coffee + small electrolytes (half-dose for driest look)" },
      { key: "supp_tea1", time: "Midday", item: "Dandelion tea 2–3 cups before flight" },
      { key: "supp_creatine", time: "With food", item: "Creatine 5g — KEEP taking it" },
    ],
    peakAdjustments: [
      "Water drops to 40 oz, sipped slowly",
      "Carbs drop to ~50g",
      "ZERO sodium — no added salt anywhere",
      "Avoid high-water-content veggies in the morning",
      "Keep creatine — muscle fullness wins",
    ],
    workout: {
      circuitIntro: "AM Pump Circuit — 3 rounds, minimal rest (15–20 min total):",
      circuit: [
        "Bodyweight squats to chair (parallel): 20 reps",
        "Push-ups: 15 reps",
        "Band rows or bag rows: 20 reps",
        "Reverse lunges: 10/leg",
        "Glute bridges: 25 (squeeze hard at top)",
        "Plank: 45s",
      ],
    },
  },
];

// ============================================
// JON'S MEAL FACTORIES
// ============================================

const jonMeal1: StructuredMeal = {
  key: "meal_1", label: "Meal 1", time: "7:00 AM",
  protein: { food: "Whole eggs + egg whites", serving: "4 + 4", targetGrams: 35 },
  carb: { food: "Oats + berries", serving: "1 cup oats + ¾ cup berries", targetGrams: 54 },
};

const jonMeal2: StructuredMeal = {
  key: "meal_2", label: "Meal 2", time: "12:00 PM",
  protein: { food: "Chicken breast", serving: "7 oz cooked", targetGrams: 56 },
  carb: { food: "Jasmine rice", serving: "1 cup", targetGrams: 45 },
  fat: { food: "Olive oil", serving: "1 tbsp", targetGrams: 14 },
  veggie: { food: "Greens", serving: "2 cups", targetGrams: 0 },
};

const jonMeal3: StructuredMeal = {
  key: "meal_3", label: "Meal 3", time: "3:30 PM",
  protein: { food: "Whey isolate", serving: "1.5 scoops", targetGrams: 37 },
  carb: { food: "Banana", serving: "1 medium", targetGrams: 27 },
  fat: { food: "Almond butter", serving: "1 tbsp", targetGrams: 9 },
};

function jonMeal4(spec: Meal4Spec): StructuredMeal {
  return {
    key: "meal_4", label: "Meal 4", time: "7:30 PM",
    protein: spec.protein,
    carb: spec.carb,
    fat: spec.fat,
    veggie: spec.veggie,
    note: spec.note,
  };
}

const jonStandardSupps = [
  { key: "supp_am", time: "5:30 AM", item: "Coffee + electrolytes (¼ tsp Lite Salt + 300mg Mg)" },
  { key: "supp_tea1", time: "2:00 PM", item: "Dandelion tea (cup 1)" },
  { key: "supp_creatine", time: "3:30 PM", item: "Creatine 5g" },
  { key: "supp_fishoil", time: "7:30 PM", item: "Fish oil 2–3g" },
  { key: "supp_mag", time: "9:30 PM", item: "Magnesium glycinate 400mg + dandelion tea (cup 2)" },
];

// ============================================
// JON'S PLAN
// ============================================

export const jonPlan: DayPlan[] = [
  {
    day: 1, date: "Sunday, April 26", isoDate: "2026-04-26",
    title: "Tournament Day",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Tournament play replaces training today. Stay hydrated, eat normally, save your push for tomorrow.",
    amCardio: "Optional today — tournament is the priority. If you do cardio, keep it light (20 min easy walk).",
    meals: [
      jonMeal1,
      jonMeal2,
      jonMeal3,
      jonMeal4({
        protein: { food: "Chicken or white fish", serving: "7 oz cooked", targetGrams: 50 },
        carb: { food: "Sweet potato", serving: "1 medium", targetGrams: 40 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: jonStandardSupps,
    workout: {
      circuitIntro: "Tournament play today replaces training. Skip the PM session.",
    },
  },
  {
    day: 2, date: "Monday, April 27", isoDate: "2026-04-27",
    title: "PUSH — Chest, Shoulders, Tri's",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy barbell bench. Top set of 5 @ RPE 8–9, followed by volume on chest and shoulders.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      jonMeal1,
      jonMeal2,
      jonMeal3,
      jonMeal4({
        protein: { food: "White fish", serving: "7 oz cooked", targetGrams: 50 },
        carb: { food: "Sweet potato", serving: "1 medium", targetGrams: 40 },
        veggie: { food: "Roasted zucchini & asparagus", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: jonStandardSupps,
    workout: {
      exercises: [
        { name: "A. Barbell bench press — top + back-offs", prescription: "Top: 1×5 @ RPE 8–9 | Back-offs: 3×6 @ 82%" },
        { name: "B. Seated DB OHP", prescription: "4 × 8 @ RPE 8" },
        { name: "C1. Incline DB press", prescription: "3 × 10 @ RPE 8" },
        { name: "C2. Cable crossover or pec deck", prescription: "3 × 12 @ RPE 8" },
        { name: "D. Myo-rep lateral raise", prescription: "1×12 + 4 mini-sets of 4, 15s rest" },
        { name: "E1. Overhead tricep ext (rope)", prescription: "3 × 12 @ RPE 8" },
        { name: "E2. Rope pushdown", prescription: "3 × 12 @ RPE 8" },
      ],
    },
  },
  {
    day: 3, date: "Tuesday, April 28", isoDate: "2026-04-28",
    title: "PULL — Back, Rear Delts, Bi's",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Weighted pull-ups lead. Heavy rowing volume — thickness + width.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      jonMeal1,
      jonMeal2,
      jonMeal3,
      jonMeal4({
        protein: { food: "93/7 ground beef", serving: "7 oz cooked", targetGrams: 50 },
        carb: { food: "Sweet potato", serving: "1 medium", targetGrams: 40 },
        veggie: { food: "Roasted broccoli & bell peppers", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: jonStandardSupps,
    workout: {
      exercises: [
        { name: "A. Weighted pull-up — top + back-offs", prescription: "Top: 1×5 @ RPE 9 | Back-offs: 3×6 @ 80%" },
        { name: "B. Barbell row (Pendlay or bent)", prescription: "4 × 6 @ RPE 8" },
        { name: "C. Chest-supported T-bar row", prescription: "3 × 10 @ RPE 8" },
        { name: "D. Single-arm DB row", prescription: "3 × 10/side @ RPE 8" },
        { name: "E. Rope face pull", prescription: "4 × 15 @ RPE 8" },
        { name: "F1. Barbell curl", prescription: "3 × 10 @ RPE 8" },
        { name: "F2. Hammer curl", prescription: "3 × 12 @ RPE 8" },
      ],
    },
  },
  {
    day: 4, date: "Wednesday, April 29", isoDate: "2026-04-29",
    title: "LEGS — Squat Focus",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy back squat anchors. Top set of 5 @ RPE 9. Quad and hamstring accessories after.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      jonMeal1,
      jonMeal2,
      jonMeal3,
      jonMeal4({
        protein: { food: "Chicken or lean sirloin", serving: "7 oz cooked", targetGrams: 50 },
        carb: { food: "Sweet potato", serving: "1 medium", targetGrams: 40 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: jonStandardSupps,
    workout: {
      exercises: [
        { name: "A. Back squat — top + back-offs", prescription: "Top: 1×5 @ RPE 9 | Back-offs: 3×6 @ 80%" },
        { name: "B. Bulgarian split squat", prescription: "3 × 8/leg @ RPE 8" },
        { name: "C. Leg press", prescription: "3 × 12 @ RPE 8 (full range)" },
        { name: "D. Romanian deadlift", prescription: "4 × 8 @ RPE 8" },
        { name: "E. Hamstring curl", prescription: "3 × 12, last set to failure" },
        { name: "F. Standing calf raise", prescription: "4 × 12 @ RPE 9" },
      ],
    },
  },
  {
    day: 5, date: "Thursday, April 30", isoDate: "2026-04-30",
    title: "Upper Strength — Peak Week Begins",
    phase: "Phase 2: Peak Week",
    focus: "Last hard upper session. Push/Pull combined. Water manipulation begins.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      jonMeal1,
      jonMeal2,
      jonMeal3,
      jonMeal4({
        protein: { food: "Chicken or white fish", serving: "7 oz cooked", targetGrams: 50 },
        carb: { food: "Sweet potato", serving: "1 medium", targetGrams: 40 },
        veggie: { food: "Roasted veggies", serving: "1 cup", targetGrams: 0 },
      }),
    ],
    supplements: jonStandardSupps,
    peakAdjustments: [
      "Normal sodium (salt your own food lightly)",
      "Water stays at 1.25 gallons",
      "Bump dandelion tea to 3 cups today",
      "Sauna 20 min post-workout if available",
    ],
    workout: {
      exercises: [
        { name: "A. Weighted dip — top + back-offs", prescription: "Top: 1×5 @ RPE 9 | Back-offs: 3×6 @ 80%" },
        { name: "B. Weighted pull-up", prescription: "4 × 5 @ RPE 8–9" },
        { name: "C1. Incline DB press", prescription: "3 × 8 @ RPE 8" },
        { name: "C2. Chest-supported row", prescription: "3 × 8 @ RPE 8" },
        { name: "D. Cluster lateral raise", prescription: "15 → 15s → 10 → 15s → 10" },
        { name: "E1. Cable curl", prescription: "3 × 12 @ RPE 8" },
        { name: "E2. Cable pushdown", prescription: "3 × 12 @ RPE 8" },
        { name: "F. Bike sprints", prescription: "8 × 30s hard / 90s easy" },
      ],
    },
  },
  {
    day: 6, date: "Friday, May 1", isoDate: "2026-05-01",
    title: "Lower Volume / Glycogen Deplete",
    phase: "Phase 2: Peak Week",
    focus: "Higher reps, moderate load. Depletion — not strength. Sodium drops hard.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      { ...jonMeal1, note: "No added salt today" },
      { ...jonMeal2, note: "No added salt today" },
      jonMeal3,
      jonMeal4({
        protein: { food: "White fish", serving: "7 oz cooked", targetGrams: 50 },
        veggie: { food: "Roasted zucchini/asparagus", serving: "2 cups", targetGrams: 0 },
        note: "NO STARCH tonight — drop the carb component",
      }),
    ],
    supplements: jonStandardSupps,
    peakAdjustments: [
      "Cut sodium to near zero — no added salt, no sauces",
      "Water stays at 1.25 gallons",
      "Carbs ~130g — drop the sweet potato from dinner",
      "3 cups dandelion tea today",
    ],
    workout: {
      circuitIntro: "Full-body depletion circuit — 4 rounds, 90s rest (moderate load):",
      circuit: [
        "Goblet squat: 15 reps",
        "DB bench press: 15 reps",
        "DB row: 15 reps",
        "Walking lunge: 10/leg",
        "DB curl + OHP combo: 12 reps",
        "Plank: 45s",
      ],
    },
  },
  {
    day: 7, date: "Saturday, May 2", isoDate: "2026-05-02",
    title: "Travel Day — Puerto Rico! 🌴",
    phase: "Phase 3: Travel Day",
    focus: "Dry out, pump up, go. Single AM pump before the airport.",
    amCardio: "No incline walk — AM pump circuit replaces it",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "After pump", note: "4 egg whites + 2 whole eggs + ½ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "Before flight", note: "5 oz chicken + 3 rice cakes + small handful greens (no salt, no oil)" },
      { key: "meal_3", label: "Snack", time: "Flight", note: "Whey + medium banana if hungry" },
      { key: "meal_4", label: "Dinner", time: "PR!", note: "Enjoy yourself — you made it 🌴" },
    ],
    supplements: [
      { key: "supp_am", time: "Morning", item: "Coffee + small electrolytes (half-dose for driest look)" },
      { key: "supp_tea1", time: "Midday", item: "Dandelion tea 2–3 cups before flight" },
      { key: "supp_creatine", time: "With food", item: "Creatine 5g — KEEP taking it" },
    ],
    peakAdjustments: [
      "Water drops to ~50 oz, sipped slowly",
      "Carbs drop to ~80g",
      "ZERO sodium — anywhere",
      "Avoid high-water-content veggies in the morning",
      "Keep creatine — muscle fullness wins",
    ],
    workout: {
      circuitIntro: "AM Pump Circuit — 3 rounds, minimal rest (20 min total):",
      circuit: [
        "Push-ups: 20 reps",
        "Bodyweight or band rows: 20 reps",
        "Bodyweight squats: 25 reps",
        "DB or band curl: 15 reps",
        "DB or band lateral raise: 15 reps",
        "Plank: 60s",
      ],
    },
  },
];

// ============================================
// HELPERS
// ============================================

export function getPlan(person: Person): DayPlan[] {
  return person === "gabby" ? gabbyPlan : jonPlan;
}

export function getCurrentDay(): number {
  // Day 1 = April 26, 2026
  const start = new Date("2026-04-26T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) return 1;
  if (diffDays > 7) return 7;
  return diffDays;
}
