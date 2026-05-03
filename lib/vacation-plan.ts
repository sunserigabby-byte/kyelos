import type { Person } from "@/lib/plan-data";

export type VacationDay = {
  day: number;
  date: string;        // display: "Sunday, May 3"
  isoDate: string;     // 2026-05-03
  vibe: string;        // banner subtitle
  beachWorkout: {
    title: string;
    duration: string;
    intro: string;
    exercises: string[];
    restDayMessage: string;
  };
  suggestions: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
};

// ============================================
// GABBY'S VACATION PLAN
// ============================================

export const gabbyVacation: VacationDay[] = [
  {
    day: 1, date: "Saturday, May 2", isoDate: "2026-05-02",
    vibe: "Travel Day",
    beachWorkout: {
      title: "Travel Day",
      duration: "20 min walk",
      intro: "Just arrived. Get a beach walk in to loosen up.",
      exercises: [
        "20-min beach walk after arrival",
        "No formal exercise today",
      ],
      restDayMessage: "Travel day — a walk is enough.",
    },
    suggestions: {
      breakfast: "Already eaten (travel meal)",
      lunch: "Light — grilled chicken + salad if at hotel",
      dinner: "Welcome dinner — order what you want, hydrate after",
    },
  },
  {
    day: 2, date: "Sunday, May 3", isoDate: "2026-05-03",
    vibe: "Beach Day · Full Body",
    beachWorkout: {
      title: "Full Body Circuit",
      duration: "25 min",
      intro: "4 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "15 push-ups (regular or knees)",
        "20 glute bridges",
        "15 reverse lunges per leg",
        "12 towel rows (loop towel around tree/pole, lean back, pull)",
        "30s plank",
        "20 squat-to-stand (squat → stand on toes → reach overhead)",
      ],
      restDayMessage: "Active recovery — beach walk + swim instead.",
    },
    suggestions: {
      breakfast: "3 eggs + ½ cup berries + coffee",
      lunch: "Grilled fish or chicken + side salad + small rice",
      dinner: "Free choice",
    },
  },
  {
    day: 3, date: "Monday, May 4", isoDate: "2026-05-04",
    vibe: "Beach Day · Lower Body",
    beachWorkout: {
      title: "Glutes + Legs",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "20 glute bridges (feet on towel)",
        "15 reverse lunges per leg",
        "12 single-leg glute bridges per side",
        "30s lateral steps (or band walks if available)",
        "20 fire hydrants per side",
        "20 calf raises",
      ],
      restDayMessage: "Active recovery — long walk + swim.",
    },
    suggestions: {
      breakfast: "Greek yogurt + berries + 1 tbsp almond butter",
      lunch: "Grilled chicken bowl with rice + veggies",
      dinner: "Free choice",
    },
  },
  {
    day: 4, date: "Tuesday, May 5", isoDate: "2026-05-05",
    vibe: "Active Recovery",
    beachWorkout: {
      title: "Active Recovery",
      duration: "30 min",
      intro: "No formal workout today. Move, stretch, swim.",
      exercises: [
        "Long beach walk (30+ min)",
        "Couch stretch — 1 min per side",
        "90/90 hip stretches",
        "T-spine rotations",
        "Swimming or floating in ocean counts",
      ],
      restDayMessage: "Today already is a recovery day — enjoy it.",
    },
    suggestions: {
      breakfast: "3 eggs + side of fruit + coffee",
      lunch: "Grilled protein + 2 cups veggies",
      dinner: "Free choice",
    },
  },
  {
    day: 5, date: "Wednesday, May 6", isoDate: "2026-05-06",
    vibe: "Beach Day · Upper Body",
    beachWorkout: {
      title: "Push, Pull, Core",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "15-20 push-ups",
        "12 towel rows (loop around tree/pole)",
        "12 pike push-ups",
        "15 tricep dips on chair/edge",
        "30s plank",
        "15 dead bugs",
      ],
      restDayMessage: "Active recovery — walk + swim.",
    },
    suggestions: {
      breakfast: "3 eggs + ½ cup berries + coffee",
      lunch: "Ceviche or grilled shrimp salad",
      dinner: "Free choice",
    },
  },
  {
    day: 6, date: "Thursday, May 7", isoDate: "2026-05-07",
    vibe: "Beach Day · Lower (Hinge)",
    beachWorkout: {
      title: "Posterior Chain",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "15 single-leg RDLs per side (use water bottle/bag for weight)",
        "20 hip thrusts (shoulders on chair)",
        "12 reverse lunges per leg",
        "15 good mornings (bodyweight or with bag)",
        "30s side plank per side",
        "20 calf raises",
      ],
      restDayMessage: "Active recovery — beach walk.",
    },
    suggestions: {
      breakfast: "Greek yogurt + berries",
      lunch: "Sushi (sashimi-heavy) or grilled fish",
      dinner: "Free choice",
    },
  },
  {
    day: 7, date: "Friday, May 8", isoDate: "2026-05-08",
    vibe: "Beach Day · HIIT",
    beachWorkout: {
      title: "Sand Sprints + Burpees",
      duration: "25 min",
      intro: "5 rounds, 30s on / 30s off, with 60s rest between rounds",
      exercises: [
        "Sand sprints (or fast jogs) — 30s",
        "Burpees — 30s",
        "Squat jumps — 30s",
        "Plank to push-up — 30s",
        "Mountain climbers — 30s",
        "Rest 60s, repeat 5 times total",
      ],
      restDayMessage: "Active recovery — final relaxing day.",
    },
    suggestions: {
      breakfast: "3 eggs + fruit + coffee",
      lunch: "Whatever's around — protein-focused",
      dinner: "Last night — enjoy fully",
    },
  },
  {
    day: 8, date: "Saturday, May 9", isoDate: "2026-05-09",
    vibe: "Travel Day Home",
    beachWorkout: {
      title: "Light Mobility",
      duration: "10 min",
      intro: "Quick stretch and walk before travel.",
      exercises: [
        "Beach walk if time",
        "Couch stretch + 90/90",
        "Shoulder rolls + arm circles",
      ],
      restDayMessage: "Travel day — minimum movement is fine.",
    },
    suggestions: {
      breakfast: "Hotel breakfast — eggs + fruit",
      lunch: "Airport — pick a protein-focused option",
      dinner: "Whatever home looks like",
    },
  },
];

// ============================================
// JON'S VACATION PLAN
// Same workouts as Gabby's but reps scaled up + bigger meal portions
// ============================================

export const jonVacation: VacationDay[] = [
  {
    day: 1, date: "Saturday, May 2", isoDate: "2026-05-02",
    vibe: "Travel Day",
    beachWorkout: {
      title: "Travel Day",
      duration: "20 min walk",
      intro: "Just arrived. Get a beach walk in to loosen up.",
      exercises: [
        "20-min beach walk after arrival",
        "No formal exercise today",
      ],
      restDayMessage: "Travel day — a walk is enough.",
    },
    suggestions: {
      breakfast: "Already eaten (travel meal)",
      lunch: "Light — grilled chicken + bigger salad if at hotel",
      dinner: "Welcome dinner — order what you want, hydrate after",
    },
  },
  {
    day: 2, date: "Sunday, May 3", isoDate: "2026-05-03",
    vibe: "Beach Day · Full Body",
    beachWorkout: {
      title: "Full Body Circuit",
      duration: "25 min",
      intro: "4 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "25-30 push-ups (regular or knees)",
        "25 glute bridges",
        "15 reverse lunges per leg",
        "15 towel rows (loop towel around tree/pole, lean back, pull)",
        "45s plank",
        "20 squat-to-stand (squat → stand on toes → reach overhead)",
      ],
      restDayMessage: "Active recovery — beach walk + swim instead.",
    },
    suggestions: {
      breakfast: "5 eggs + ¾ cup berries + coffee",
      lunch: "Grilled fish or chicken + salad + 1 cup rice",
      dinner: "Free choice",
    },
  },
  {
    day: 3, date: "Monday, May 4", isoDate: "2026-05-04",
    vibe: "Beach Day · Lower Body",
    beachWorkout: {
      title: "Glutes + Legs",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "25 glute bridges (feet on towel)",
        "15 reverse lunges per leg",
        "12 single-leg glute bridges per side",
        "45s lateral steps (or band walks if available)",
        "20 fire hydrants per side",
        "25 calf raises",
      ],
      restDayMessage: "Active recovery — long walk + swim.",
    },
    suggestions: {
      breakfast: "Greek yogurt + berries + 2 tbsp almond butter",
      lunch: "Grilled chicken bowl with extra rice + veggies",
      dinner: "Free choice",
    },
  },
  {
    day: 4, date: "Tuesday, May 5", isoDate: "2026-05-05",
    vibe: "Active Recovery",
    beachWorkout: {
      title: "Active Recovery",
      duration: "30 min",
      intro: "No formal workout today. Move, stretch, swim.",
      exercises: [
        "Long beach walk (30+ min)",
        "Couch stretch — 1 min per side",
        "90/90 hip stretches",
        "T-spine rotations",
        "Swimming or floating in ocean counts",
      ],
      restDayMessage: "Today already is a recovery day — enjoy it.",
    },
    suggestions: {
      breakfast: "5 eggs + side of fruit + coffee",
      lunch: "Grilled protein (extra) + 2 cups veggies",
      dinner: "Free choice",
    },
  },
  {
    day: 5, date: "Wednesday, May 6", isoDate: "2026-05-06",
    vibe: "Beach Day · Upper Body",
    beachWorkout: {
      title: "Push, Pull, Core",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "25-30 push-ups",
        "15 towel rows (loop around tree/pole)",
        "15 pike push-ups",
        "20 tricep dips on chair/edge",
        "45s plank",
        "15 dead bugs",
      ],
      restDayMessage: "Active recovery — walk + swim.",
    },
    suggestions: {
      breakfast: "5 eggs + ¾ cup berries + coffee",
      lunch: "Ceviche or grilled shrimp salad (extra protein)",
      dinner: "Free choice",
    },
  },
  {
    day: 6, date: "Thursday, May 7", isoDate: "2026-05-07",
    vibe: "Beach Day · Lower (Hinge)",
    beachWorkout: {
      title: "Posterior Chain",
      duration: "20 min",
      intro: "3 rounds, minimal rest between exercises, 60s rest between rounds",
      exercises: [
        "15 single-leg RDLs per side (use water bottle/bag for weight)",
        "25 hip thrusts (shoulders on chair)",
        "15 reverse lunges per leg",
        "15 good mornings (bodyweight or with bag)",
        "45s side plank per side",
        "25 calf raises",
      ],
      restDayMessage: "Active recovery — beach walk.",
    },
    suggestions: {
      breakfast: "Greek yogurt + berries (bigger serving)",
      lunch: "Sushi (sashimi-heavy) or grilled fish",
      dinner: "Free choice",
    },
  },
  {
    day: 7, date: "Friday, May 8", isoDate: "2026-05-08",
    vibe: "Beach Day · HIIT",
    beachWorkout: {
      title: "Sand Sprints + Burpees",
      duration: "30 min",
      intro: "6 rounds, 30s on / 30s off, with 60s rest between rounds",
      exercises: [
        "Sand sprints (or fast jogs) — 30s",
        "Burpees — 30s",
        "Squat jumps — 30s",
        "Plank to push-up — 30s",
        "Mountain climbers — 30s",
        "Rest 60s, repeat 6 times total",
      ],
      restDayMessage: "Active recovery — final relaxing day.",
    },
    suggestions: {
      breakfast: "5 eggs + fruit + coffee",
      lunch: "Whatever's around — protein-focused (bigger portion)",
      dinner: "Last night — enjoy fully",
    },
  },
  {
    day: 8, date: "Saturday, May 9", isoDate: "2026-05-09",
    vibe: "Travel Day Home",
    beachWorkout: {
      title: "Light Mobility",
      duration: "10 min",
      intro: "Quick stretch and walk before travel.",
      exercises: [
        "Beach walk if time",
        "Couch stretch + 90/90",
        "Shoulder rolls + arm circles",
      ],
      restDayMessage: "Travel day — minimum movement is fine.",
    },
    suggestions: {
      breakfast: "Hotel breakfast — eggs + fruit (bigger portion)",
      lunch: "Airport — pick a protein-focused option",
      dinner: "Whatever home looks like",
    },
  },
];

export function getVacationPlan(person: Person): VacationDay[] {
  return person === "gabby" ? gabbyVacation : jonVacation;
}

// Targets for the daily targets card
export type VacationTargets = {
  proteinG: number;
  waterOz: number;       // base; recovery mode adds +20
  steps: number;
};

export function getVacationTargets(
  person: Person,
  recoveryMode: boolean
): VacationTargets {
  const baseWater = person === "gabby" ? 80 : 100;
  return {
    proteinG: person === "gabby" ? 110 : 150,
    waterOz: recoveryMode ? baseWater + 20 : baseWater,
    steps: 12000,
  };
}
