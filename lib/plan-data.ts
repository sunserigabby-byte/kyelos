// Cut protocol data for Gabby + Jon
// April 23 - May 2, 2026

export type Person = "gabby" | "jon";

export type WorkoutExercise = {
  name: string;
  prescription: string;
};

export type DayPlan = {
  day: number;
  date: string;           // display string, e.g. "Thursday, April 23"
  isoDate: string;        // "2026-04-23"
  title: string;
  phase: string;
  focus: string;
  amCardio: string;
  meals: { key: string; label: string; time: string; food: string }[];
  supplements: { key: string; time: string; item: string }[];
  peakAdjustments?: string[];
  workout: {
    intro?: string;
    exercises?: WorkoutExercise[];
    circuit?: string[];    // for circuit-format days
    circuitIntro?: string;
  };
};

// ============================================
// GABBY'S PLAN
// ============================================

const gabbyStandardMeals = (dinner: string) => [
  { key: "meal_1", label: "Meal 1", time: "7:00 AM", food: "3 whole eggs + 3 egg whites + ½ cup berries + coffee" },
  { key: "meal_2", label: "Meal 2", time: "11:00 AM", food: "5 oz chicken + ¾ cup jasmine rice + 2 cups greens + 1 tbsp olive oil + lemon" },
  { key: "meal_3", label: "Meal 3", time: "3:00 PM", food: "1 scoop whey + small banana OR 2 rice cakes + 1 tbsp almond butter" },
  { key: "meal_4", label: "Meal 4", time: "7:00 PM", food: dinner },
];

const gabbyStandardSupps = [
  { key: "supp_am", time: "5:30 AM", item: "Coffee + electrolytes (¼ tsp Lite Salt + 200mg Mg)" },
  { key: "supp_tea1", time: "2:00 PM", item: "Dandelion tea (cup 1)" },
  { key: "supp_creatine", time: "3:00 PM", item: "Creatine 5g" },
  { key: "supp_fishoil", time: "7:00 PM", item: "Fish oil 2–3g" },
  { key: "supp_mag", time: "9:30 PM", item: "Magnesium glycinate + dandelion tea (cup 2)" },
];

export const gabbyPlan: DayPlan[] = [
  {
    day: 1, date: "Thursday, April 23", isoDate: "2026-04-23",
    title: "Full Body Strength",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Posterior chain emphasis. RDL is the heaviest lift — ramp to top set of 5 @ RPE 8–9.",
    amCardio: "30 min incline walk | 3.5 mph, 10% grade | HR 120–135 | Fasted",
    meals: gabbyStandardMeals("5 oz white fish + 1 cup roasted zucchini & asparagus + ½ sweet potato"),
    supplements: gabbyStandardSupps,
    workout: {
      exercises: [
        { name: "A. RDL — top set + back-offs", prescription: "Top: 1×5 @ RPE 8–9 | Back-offs: 2×8 @ 75%" },
        { name: "B. Goblet box squat (parallel)", prescription: "4 × 8 @ RPE 8" },
        { name: "C1. Chest-supported DB row", prescription: "4 × 8 @ RPE 8" },
        { name: "C2. DB bench press", prescription: "4 × 8 @ RPE 8" },
        { name: "D. DB Pendlay row", prescription: "3 × 10 @ RPE 8" },
        { name: "E. Finisher: Assault bike", prescription: "10 min, 15 cal on / 45s off" },
      ],
    },
  },
  {
    day: 2, date: "Friday, April 24", isoDate: "2026-04-24",
    title: "Advanced Conditioning + Core",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Hard metabolic work. Zero jumping. Descending ladder + heavy core.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz 93/7 ground turkey + 1 cup roasted zucchini & asparagus + ½ sweet potato"),
    supplements: gabbyStandardSupps,
    workout: {
      circuitIntro: "Descending ladder — 21-15-9-6 reps for time (target sub-15 min):",
      circuit: [
        "Calorie row",
        "DB thrusters (20–25 lb per hand)",
        "Reverse lunges (per leg)",
        "— THEN CORE x 3 rounds —",
        "Ab wheel rollouts: 10 reps",
        "Pallof press: 12/side @ heavy tension",
        "Weighted plank: 45s",
      ],
    },
  },
  {
    day: 3, date: "Saturday, April 25", isoDate: "2026-04-25",
    title: "Upper Body Strength + HIIT",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy press + heavy pull. Full knee rest. Myo-reps on delts and face pulls.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz chicken or white fish + 1 cup roasted broccoli & bell peppers + ½ sweet potato"),
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
    day: 4, date: "Sunday, April 26", isoDate: "2026-04-26",
    title: "Lower Strength — The Big Day",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Anchor session of the week. Heavy hip thrust + heavy RDL. Target 185+ lb hip thrust top set.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz chicken or bison + 1 cup roasted veggies + ½ sweet potato"),
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
    day: 5, date: "Monday, April 27", isoDate: "2026-04-27",
    title: "Conditioning + Heavy Carries",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Full-body intensity without joint stress. KB swings, push press, carries.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz shrimp or white fish + 1 cup roasted zucchini & asparagus + ½ sweet potato"),
    supplements: gabbyStandardSupps,
    workout: {
      circuitIntro: "EMOM 24 — cycle through 6 times:",
      circuit: [
        "Min 1: 15 heavy KB swings (35 lb+, eye level)",
        "Min 2: 12 DB push press",
        "Min 3: 15 cal Assault bike or row",
        "Min 4: 40-yard farmer's carry (40–50 lb each hand)",
        "— FINISHER x 3 rounds —",
        "Hollow body hold: 30s",
        "Side plank: 30s/side",
        "Dead bugs: 10 slow",
      ],
    },
  },
  {
    day: 6, date: "Tuesday, April 28", isoDate: "2026-04-28",
    title: "Upper Hypertrophy (Pump Day)",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Higher volume, moderate load, rest-pause on isolations. CNS break before Day 8.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz chicken or white fish + 1 cup roasted veggies + ½ sweet potato"),
    supplements: gabbyStandardSupps,
    workout: {
      exercises: [
        { name: "A1. Cable chest press or flat DB press", prescription: "4 × 10 @ RPE 8" },
        { name: "A2. Seated cable row or DB row", prescription: "4 × 10 @ RPE 8" },
        { name: "B1. Rest-pause DB curl", prescription: "Failure @ 10RM → 15s → failure → 15s → failure" },
        { name: "B2. Rest-pause tricep pushdown", prescription: "Same protocol" },
        { name: "C. Super-set lateral + rear delt fly", prescription: "4 × 12 each" },
        { name: "D. Core circuit x 3", prescription: "Cable crunch 15, leg raise 10, Pallof 12/side" },
      ],
    },
  },
  {
    day: 7, date: "Wednesday, April 29", isoDate: "2026-04-29",
    title: "Active Recovery",
    phase: "Phase 1: Last day of deficit",
    focus: "Full rest. CNS and knee both need it. Sleep 8+ hours — Day 8 is heavy.",
    amCardio: "60-min outdoor walk (replaces treadmill)",
    meals: gabbyStandardMeals("5 oz chicken or white fish + 1 cup roasted veggies + ½ sweet potato"),
    supplements: gabbyStandardSupps,
    workout: {
      circuitIntro: "No hard training today. Do mobility + walk:",
      circuit: [
        "60-min outdoor walk",
        "20–30 min mobility (couch stretch, 90/90, T-spine)",
        "Sauna 20 min if available",
        "Restock groceries",
      ],
    },
  },
  {
    day: 8, date: "Thursday, April 30", isoDate: "2026-04-30",
    title: "Upper Strength (Peak Week Begins)",
    phase: "Phase 2: Peak Week",
    focus: "Last truly hard session. Water manipulation begins. Sauna if possible.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: gabbyStandardMeals("5 oz chicken or white fish + 1 cup roasted veggies + ½ sweet potato"),
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
    day: 9, date: "Friday, May 1", isoDate: "2026-05-01",
    title: "Lower Volume / Glycogen Deplete",
    phase: "Phase 2: Peak Week",
    focus: "Higher reps, moderate load. Depletion — not strength. Sodium drops hard.",
    amCardio: "30 min incline walk | Zone 2 | HR 120–135",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "7:00 AM", food: "3 whole eggs + 3 egg whites + ½ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "11:00 AM", food: "5 oz chicken + ¾ cup jasmine rice + 2 cups greens + olive oil + lemon (no salt)" },
      { key: "meal_3", label: "Meal 3", time: "3:00 PM", food: "Whey + small banana" },
      { key: "meal_4", label: "Meal 4", time: "7:00 PM", food: "5 oz white fish + 2 cups roasted zucchini/asparagus — NO STARCH tonight" },
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
    day: 10, date: "Saturday, May 2", isoDate: "2026-05-02",
    title: "Travel Day — Puerto Rico! 🌴",
    phase: "Phase 3: Travel Day",
    focus: "Dry out, pump up, go. Single AM workout before the airport.",
    amCardio: "No incline walk — AM pump circuit replaces it",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "After pump", food: "3 egg whites + 1 whole egg + ¼ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "Before flight", food: "4 oz chicken + 2 rice cakes + small handful greens (no salt, no oil)" },
      { key: "meal_3", label: "Snack", time: "Flight", food: "Whey + small banana if hungry" },
      { key: "meal_4", label: "Dinner", time: "PR!", food: "Enjoy yourself — you made it 🌴" },
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
// JON'S PLAN
// ============================================

const jonStandardMeals = (dinner: string) => [
  { key: "meal_1", label: "Meal 1", time: "7:00 AM", food: "4 whole eggs + 4 egg whites + 1 cup oats + ¾ cup berries + coffee" },
  { key: "meal_2", label: "Meal 2", time: "12:00 PM", food: "7 oz chicken + 1 cup jasmine rice + 2 cups greens + 1 tbsp olive oil + lemon" },
  { key: "meal_3", label: "Meal 3", time: "3:30 PM", food: "1.5 scoops whey + medium banana + 1 tbsp almond butter" },
  { key: "meal_4", label: "Meal 4", time: "7:30 PM", food: dinner },
];

const jonStandardSupps = [
  { key: "supp_am", time: "5:30 AM", item: "Coffee + electrolytes (¼ tsp Lite Salt + 300mg Mg)" },
  { key: "supp_tea1", time: "2:00 PM", item: "Dandelion tea (cup 1)" },
  { key: "supp_creatine", time: "3:30 PM", item: "Creatine 5g" },
  { key: "supp_fishoil", time: "7:30 PM", item: "Fish oil 2–3g" },
  { key: "supp_mag", time: "9:30 PM", item: "Magnesium glycinate 400mg + dandelion tea (cup 2)" },
];

export const jonPlan: DayPlan[] = [
  {
    day: 1, date: "Thursday, April 23", isoDate: "2026-04-23",
    title: "PUSH — Chest, Shoulders, Tri's",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy barbell bench. Top set of 5 @ RPE 8–9, followed by volume on chest and shoulders.",
    amCardio: "40 min incline walk | 3.5 mph, 10% grade | HR 125–145 | Fasted",
    meals: jonStandardMeals("7 oz white fish + 1 cup roasted zucchini & asparagus + 1 medium sweet potato"),
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
    day: 2, date: "Friday, April 24", isoDate: "2026-04-24",
    title: "PULL — Back, Rear Delts, Bi's",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Weighted pull-ups lead. Heavy rowing volume — thickness + width.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz 93/7 ground beef + 1 cup roasted broccoli & bell peppers + 1 medium sweet potato"),
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
    day: 3, date: "Saturday, April 25", isoDate: "2026-04-25",
    title: "LEGS — Squat Focus",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Heavy back squat anchors. Top set of 5 @ RPE 9. Quad and hamstring accessories after.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz chicken or lean sirloin + 1 cup roasted veggies + 1 medium sweet potato"),
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
    day: 4, date: "Sunday, April 26", isoDate: "2026-04-26",
    title: "Upper Hypertrophy (Pump Day)",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Higher volume, moderate load, intensity techniques. Super-sets + rest-pause.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz salmon or white fish + 1 cup roasted veggies + 1 medium sweet potato"),
    supplements: jonStandardSupps,
    workout: {
      exercises: [
        { name: "A1. Incline DB press", prescription: "4 × 10 @ RPE 8" },
        { name: "A2. Chest-supported row", prescription: "4 × 10 @ RPE 8" },
        { name: "B1. Cable chest fly (high to low)", prescription: "3 × 12 @ RPE 8" },
        { name: "B2. Wide-grip lat pulldown", prescription: "3 × 12 @ RPE 8" },
        { name: "C1. Super-set lateral raise", prescription: "4 × 15 @ RPE 9" },
        { name: "C2. Super-set rear delt fly", prescription: "4 × 15 @ RPE 9" },
        { name: "D1. Rest-pause hammer curl", prescription: "Failure @ 12RM → 15s → failure → 15s → failure" },
        { name: "D2. Rest-pause pushdown", prescription: "Same protocol" },
      ],
    },
  },
  {
    day: 5, date: "Monday, April 27", isoDate: "2026-04-27",
    title: "Conditioning + Heavy Carries",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Full-body metabolic work. Heavy carries, swings, optional sled push.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz shrimp or chicken + 1 cup roasted zucchini & asparagus + 1 medium sweet potato"),
    supplements: jonStandardSupps,
    workout: {
      circuitIntro: "EMOM 28 — cycle through 7 times:",
      circuit: [
        "Min 1: 20 heavy KB swings (53–70 lb, eye level)",
        "Min 2: 15 DB push press",
        "Min 3: 15 cal Assault bike or row",
        "Min 4: 50-yard farmer's carry (70+ lb each hand)",
        "— FINISHER x 3 rounds —",
        "Hollow body hold: 45s",
        "Side plank: 45s/side",
        "Weighted dead bugs: 10 slow",
      ],
    },
  },
  {
    day: 6, date: "Tuesday, April 28", isoDate: "2026-04-28",
    title: "LEGS — Deadlift Focus",
    phase: "Phase 1: Aggressive Deficit",
    focus: "Conventional or trap bar deadlift. Top set of 3 @ RPE 9. Posterior chain emphasis.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz lean sirloin or chicken + 1 cup roasted veggies + 1 medium sweet potato"),
    supplements: jonStandardSupps,
    workout: {
      exercises: [
        { name: "A. Deadlift — top + back-offs", prescription: "Top: 1×3 @ RPE 9 | Back-offs: 3×5 @ 80%" },
        { name: "B. Barbell hip thrust", prescription: "4 × 8 @ RPE 8" },
        { name: "C. Front squat or hack squat", prescription: "3 × 10 @ RPE 8" },
        { name: "D. Reverse lunge", prescription: "3 × 10/leg @ RPE 8" },
        { name: "E. Glute-ham raise or Nordic curl", prescription: "3 × 8 @ RPE 8–9" },
        { name: "F. Seated calf raise", prescription: "4 × 15 @ RPE 9" },
      ],
    },
  },
  {
    day: 7, date: "Wednesday, April 29", isoDate: "2026-04-29",
    title: "Active Recovery",
    phase: "Phase 1: Last day of deficit",
    focus: "Full rest. CNS needs it. Sleep 8+ hours — Day 8 is a peak week session.",
    amCardio: "60-min outdoor walk (replaces treadmill)",
    meals: jonStandardMeals("7 oz chicken or white fish + 1 cup roasted veggies + 1 medium sweet potato"),
    supplements: jonStandardSupps,
    workout: {
      circuitIntro: "No hard training today. Movement + restock:",
      circuit: [
        "60-min outdoor walk",
        "20–30 min mobility (couch stretch, 90/90, T-spine)",
        "Sauna 20 min if available",
        "Restock groceries",
      ],
    },
  },
  {
    day: 8, date: "Thursday, April 30", isoDate: "2026-04-30",
    title: "Upper Strength — Peak Week Begins",
    phase: "Phase 2: Peak Week",
    focus: "Last hard upper session. Push/Pull combined. Water manipulation begins.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: jonStandardMeals("7 oz chicken or white fish + 1 cup roasted veggies + 1 medium sweet potato"),
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
    day: 9, date: "Friday, May 1", isoDate: "2026-05-01",
    title: "Lower Volume / Glycogen Deplete",
    phase: "Phase 2: Peak Week",
    focus: "Higher reps, moderate load. Depletion — not strength. Sodium drops hard.",
    amCardio: "40 min incline walk | Zone 2 | HR 125–145",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "7:00 AM", food: "4 whole eggs + 4 egg whites + 1 cup oats + ¾ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "12:00 PM", food: "7 oz chicken + 1 cup jasmine rice + 2 cups greens + olive oil + lemon (no salt)" },
      { key: "meal_3", label: "Meal 3", time: "3:30 PM", food: "1.5 scoops whey + medium banana" },
      { key: "meal_4", label: "Meal 4", time: "7:30 PM", food: "7 oz white fish + 2 cups roasted zucchini/asparagus — NO STARCH tonight" },
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
    day: 10, date: "Saturday, May 2", isoDate: "2026-05-02",
    title: "Travel Day — Puerto Rico! 🌴",
    phase: "Phase 3: Travel Day",
    focus: "Dry out, pump up, go. Single AM pump before the airport.",
    amCardio: "No incline walk — AM pump circuit replaces it",
    meals: [
      { key: "meal_1", label: "Meal 1", time: "After pump", food: "4 egg whites + 2 whole eggs + ½ cup berries + coffee (no salt)" },
      { key: "meal_2", label: "Meal 2", time: "Before flight", food: "5 oz chicken + 3 rice cakes + small handful greens (no salt, no oil)" },
      { key: "meal_3", label: "Snack", time: "Flight", food: "Whey + medium banana if hungry" },
      { key: "meal_4", label: "Dinner", time: "PR!", food: "Enjoy yourself — you made it 🌴" },
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
  // Day 1 = April 23, 2026
  const start = new Date("2026-04-23T00:00:00");
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) return 1;
  if (diffDays > 10) return 10;
  return diffDays;
}
