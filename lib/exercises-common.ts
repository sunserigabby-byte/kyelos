import type { Exercise } from "./training-types";

export const swingPrep: Exercise[] = [
  {
    name: "Banded External Rotation",
    exerciseType: "swing_prep",
    description: "2 × 15/side, light band",
    sets: [
      { setNumber: 1, setType: "warmup", targetReps: 15, targetIntensity: "Light" },
      { setNumber: 2, setType: "warmup", targetReps: 15, targetIntensity: "Light" },
    ],
    trackingMode: "bodyweight",
    volleyballNote:
      "Wakes up rotator cuff. Skipping this is the #1 cause of lifter shoulder injury for volleyball players.",
  },
  {
    name: "Y-T-W Raises",
    exerciseType: "swing_prep",
    description: "2 rounds of 8 in each position (Y, T, W)",
    sets: [
      { setNumber: 1, setType: "warmup", targetReps: "8+8+8", targetIntensity: "BW or 2.5lb plates" },
      { setNumber: 2, setType: "warmup", targetReps: "8+8+8", targetIntensity: "BW or 2.5lb plates" },
    ],
    trackingMode: "bodyweight",
    volleyballNote:
      "Activates lower traps and rhomboids — the muscles that keep your shoulder healthy during repeated swings.",
  },
  {
    name: "Banded Scapular Pull-aparts",
    exerciseType: "swing_prep",
    description: "2 × 15, light band",
    sets: [
      { setNumber: 1, setType: "warmup", targetReps: 15, targetIntensity: "Light band" },
      { setNumber: 2, setType: "warmup", targetReps: 15, targetIntensity: "Light band" },
    ],
    trackingMode: "bodyweight",
  },
];

export const tantrumFull: Exercise[] = [
  {
    name: "T Position Tantrum",
    exerciseType: "tantrum",
    description: "3 × 20s per arm, T position",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
      { setNumber: 2, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
      { setNumber: 3, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
    ],
    trackingMode: "time",
    notes:
      "Seated on floor, legs extended. Arm threaded through band anchored at chest height, extended out to side at 90°. Move arm rapidly with max velocity for 20s. Both arms.",
    volleyballNote:
      "Hits rear delts + external rotators — the rapid-stabilization muscles for swing deceleration.",
  },
  {
    name: "Y Position Tantrum",
    exerciseType: "tantrum",
    description: "3 × 20s per arm, Y position",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
      { setNumber: 2, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
      { setNumber: 3, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light-medium band", durationSeconds: 20 },
    ],
    trackingMode: "time",
    notes:
      "Seated. Arm through band, extended overhead at diagonal (forms a Y). Rapidly move arm with max velocity for 20s. Both arms.",
    volleyballNote:
      "Targets lower traps + supraspinatus — overhead stability for spike position.",
  },
  {
    name: "Overhead Tantrum",
    exerciseType: "tantrum",
    description: "2 × 20s per arm, straight overhead",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light band", durationSeconds: 20 },
      { setNumber: 2, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light band", durationSeconds: 20 },
    ],
    trackingMode: "time",
    notes:
      "Seated. Arm through band, straight overhead. Rapidly move arm in small fast circles for 20s.",
    volleyballNote:
      "Full overhead stability under speed. Most spike-position-specific tantrum.",
  },
  {
    name: "Front Tantrum",
    exerciseType: "tantrum",
    description: "2 × 20s per arm, forward at 90°",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light band", durationSeconds: 20 },
      { setNumber: 2, setType: "duration", targetReps: "Max velocity", targetIntensity: "Light band", durationSeconds: 20 },
    ],
    trackingMode: "time",
    notes:
      "Seated. Arm through band, extended forward at 90°. Rapidly move arm with max velocity for 20s.",
    volleyballNote: "Mimics arm position just before swing contact.",
  },
];

// Left-leg STRENGTH (Wednesday — supersetted with heavy pull)
export const leftLegStrength: Exercise[] = [
  {
    name: "Single-Leg Hip Thrust (LEFT)",
    exerciseType: "single_leg",
    description: "4 × 8 @ RPE 9. Left foot on bench, right leg straight up in air.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 8, targetIntensity: "RPE 9" },
      { setNumber: 2, setType: "working", targetReps: 8, targetIntensity: "RPE 9" },
      { setNumber: 3, setType: "working", targetReps: 8, targetIntensity: "RPE 9" },
      { setNumber: 4, setType: "working", targetReps: 8, targetIntensity: "RPE 9" },
    ],
    trackingMode: "weight_reps",
    notes: "Right leg held straight up, no ground contact. Drive through left heel.",
    volleyballNote: "Single-leg glute strength preserves jump power on the working side.",
  },
  {
    name: "Single-Leg Leg Press (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 8 @ RPE 8. Left foot on platform, right foot completely off.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
    notes:
      "Right foot OFF platform entirely. If gym has unilateral leg press, use it. Otherwise, hack squat with one foot.",
  },
  {
    name: "Glute-Bias Step Down (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 8 @ RPE 8. Box step-down with rack support, right toe taps only.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 8, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
    unlocksOnDay: 8,
    notes:
      "12-18\" box. Hand on rack upright for balance only. 3-sec descent — right toe taps floor with ZERO weight transfer. 1-sec pause. Drive up through left heel. Week 2: bodyweight. Week 3: light DB in left hand. Week 4: moderate DB.",
    volleyballNote:
      "Eccentric quad/glute strength on the working side. Mimics landing mechanics without impact.",
  },
  {
    name: "Supported Single-Leg RDL (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 10 @ RPE 8. One hand on rack support for balance.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
    notes:
      "Hold rack with non-working-side hand. DB in working-side hand. Right leg extends behind, foot OFF floor entirely. Hinge with intent.",
  },
];

// Left-leg VOLUME + speed (Friday — supersetted with volume push)
export const leftLegVolume: Exercise[] = [
  {
    name: "Single-Leg Explosive Hip Thrust (LEFT)",
    exerciseType: "single_leg",
    description: "4 × 6 max-intent concentric speed.",
    sets: [
      { setNumber: 1, setType: "power", targetReps: 6, targetIntensity: "Max concentric speed" },
      { setNumber: 2, setType: "power", targetReps: 6, targetIntensity: "Max concentric speed" },
      { setNumber: 3, setType: "power", targetReps: 6, targetIntensity: "Max concentric speed" },
      { setNumber: 4, setType: "power", targetReps: 6, targetIntensity: "Max concentric speed" },
    ],
    trackingMode: "weight_reps",
    notes:
      "Same setup as regular hip thrust. SNAP UP fast, lower controlled. Moderate weight (60-70% of strength hip thrust). Focus on bar speed.",
    volleyballNote:
      "Trains rate of force development without joint impact. Closest legal substitute for jumping during recovery.",
  },
  {
    name: "Supported Single-Leg RDL (LEFT)",
    exerciseType: "single_leg",
    description: "4 × 10 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 4, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
  },
  {
    name: "Seated Single-Leg Curl (LEFT)",
    exerciseType: "single_leg",
    description: "4 × 12 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
      { setNumber: 4, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
    notes: "Right leg rests off pad.",
  },
  {
    name: "Standing Single-Leg Calf Raise (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 15 @ RPE 8. Hold rail, right foot off ground.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
  },
];

// Left-leg FINISHER (Saturday — supersetted with volume pull)
export const leftLegFinisher: Exercise[] = [
  {
    name: "Seated Single-Leg Extension (LEFT)",
    exerciseType: "single_leg",
    description: "4 × 10 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 4, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
  },
  {
    name: "Single-Leg Hip Thrust (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 10 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
  },
  {
    name: "Cable Single-Leg Kickback Explosive (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 10 max-intent concentric.",
    sets: [
      { setNumber: 1, setType: "power", targetReps: 10, targetIntensity: "Max concentric speed" },
      { setNumber: 2, setType: "power", targetReps: 10, targetIntensity: "Max concentric speed" },
      { setNumber: 3, setType: "power", targetReps: 10, targetIntensity: "Max concentric speed" },
    ],
    trackingMode: "weight_reps",
    notes:
      "Standing, hold support for balance. Right foot rests fully on floor (no kickback). Left leg kicks back explosively against cable.",
  },
  {
    name: "Supine Single-Leg Glute Bridge (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 12 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 12, targetIntensity: "RPE 8" },
    ],
    trackingMode: "bodyweight",
  },
  {
    name: "Seated Single-Leg Calf Raise (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 15 @ RPE 8.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
      { setNumber: 2, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
      { setNumber: 3, setType: "working", targetReps: 15, targetIntensity: "RPE 8" },
    ],
    trackingMode: "weight_reps",
  },
];

// Legacy export (kept for back-compat with older plan-data imports)
export const singleLegLeft: Exercise[] = [
  {
    name: "Seated Single-Leg Curl (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 10, left leg only",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
    ],
    trackingMode: "weight_reps",
    optional: true,
    notes:
      "Right leg rests off the pad. Cross-education effect maintains 10-30% of right leg strength through neural pathways.",
  },
  {
    name: "Seated Single-Leg Extension (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 10, left leg only",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "RPE 8", restSeconds: 60 },
    ],
    trackingMode: "weight_reps",
    optional: true,
    notes: "Right leg rests off the machine. Maintains quad neural activation.",
  },
  {
    name: "Supine Single-Leg Glute Bridge (LEFT)",
    exerciseType: "single_leg",
    description: "3 × 12, left foot on floor",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 45 },
      { setNumber: 2, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 45 },
      { setNumber: 3, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 45 },
    ],
    trackingMode: "bodyweight",
    optional: true,
    notes: "Right leg held straight up in air, no ground contact.",
  },
];

export const rightLegRehab: Exercise[] = [
  {
    name: "Quad Sets (RIGHT)",
    exerciseType: "rehab",
    description: "3 × 10, hold 5s each",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: 10, targetIntensity: "Hold 5s", durationSeconds: 50 },
      { setNumber: 2, setType: "duration", targetReps: 10, targetIntensity: "Hold 5s", durationSeconds: 50 },
      { setNumber: 3, setType: "duration", targetReps: 10, targetIntensity: "Hold 5s", durationSeconds: 50 },
    ],
    trackingMode: "time",
    optional: true,
    unlocksOnDay: 8,
    notes:
      "Sit on floor with right leg extended. Push back of knee down into the floor as hard as possible. Hold 5 seconds. Pure isometric, no joint movement.",
  },
  {
    name: "Straight Leg Raise (RIGHT)",
    exerciseType: "rehab",
    description: "3 × 10",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 10, targetIntensity: "Bodyweight", restSeconds: 30 },
      { setNumber: 2, setType: "working", targetReps: 10, targetIntensity: "Bodyweight", restSeconds: 30 },
      { setNumber: 3, setType: "working", targetReps: 10, targetIntensity: "Bodyweight", restSeconds: 30 },
    ],
    trackingMode: "bodyweight",
    optional: true,
    unlocksOnDay: 8,
    notes:
      "Lie on back, right leg straight. Lift entire straight leg to ~12 inches, hold briefly, lower. Knee never bends under load.",
  },
  {
    name: "Glute Squeezes (RIGHT)",
    exerciseType: "rehab",
    description: "3 × 15, hold 3s",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: 15, targetIntensity: "Hold 3s", durationSeconds: 45 },
      { setNumber: 2, setType: "duration", targetReps: 15, targetIntensity: "Hold 3s", durationSeconds: 45 },
      { setNumber: 3, setType: "duration", targetReps: 15, targetIntensity: "Hold 3s", durationSeconds: 45 },
    ],
    trackingMode: "time",
    optional: true,
    unlocksOnDay: 8,
  },
  {
    name: "Heel Slides (RIGHT)",
    exerciseType: "rehab",
    description: "2 × 15, gentle passive ROM",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 15, targetIntensity: "Pain-free ROM", restSeconds: 30 },
      { setNumber: 2, setType: "working", targetReps: 15, targetIntensity: "Pain-free ROM", restSeconds: 30 },
    ],
    trackingMode: "bodyweight",
    optional: true,
    unlocksOnDay: 8,
    notes:
      "Lie on back. Slowly slide right heel toward butt, bending knee passively. Only go as far as comfortable.",
  },
  {
    name: "Ankle Pumps (RIGHT)",
    exerciseType: "rehab",
    description: "2 × 20",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 20, targetIntensity: "Full ROM" },
      { setNumber: 2, setType: "working", targetReps: 20, targetIntensity: "Full ROM" },
    ],
    trackingMode: "bodyweight",
    optional: true,
    unlocksOnDay: 8,
    notes: "Point and flex foot. Promotes circulation, important for healing.",
  },
];

// ============================================
// Daily VMO + Glute Activation Circuit
// Bilateral, low-volume, every morning. ~10-15 min.
// THP covers VMO/glute-med under-load work on lift days — this
// is the daily activation only.
// ============================================
export const dailyKneeGluteActivation: Exercise[] = [
  {
    name: "Quad Sets with VMO Emphasis",
    exerciseType: "activation",
    description: "2 × 10 with 5-second holds. Toes slightly out, squeeze inner quad.",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: 10, targetIntensity: "Hold 5s", durationSeconds: 50 },
      { setNumber: 2, setType: "duration", targetReps: 10, targetIntensity: "Hold 5s", durationSeconds: 50 },
    ],
    trackingMode: "bodyweight",
    notes:
      "Sit with leg extended. Press knee into floor, hold 5 sec. Focus on the inner-knee teardrop muscle (VMO).",
  },
  {
    name: "Banded Clamshells",
    exerciseType: "activation",
    description: "2 × 15/side. Light to moderate band above knees.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 15, targetIntensity: "Light-moderate band" },
      { setNumber: 2, setType: "working", targetReps: 15, targetIntensity: "Light-moderate band" },
    ],
    trackingMode: "bodyweight",
    notes:
      "Side-lying, knees bent 90°, feet together. Open knees against band without rolling hips back.",
  },
  {
    name: "Banded Lateral Steps",
    exerciseType: "activation",
    description: "2 × 12 each direction. Band above knees or around ankles.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 12, targetIntensity: "Band" },
      { setNumber: 2, setType: "working", targetReps: 12, targetIntensity: "Band" },
    ],
    trackingMode: "bodyweight",
    notes:
      "Slight athletic stance, step sideways under band tension. 12 right, then 12 left.",
  },
  {
    name: "Glute Bridge (bilateral)",
    exerciseType: "activation",
    description: "2 × 20 with 2-second hold at top.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 20, targetIntensity: "Bodyweight" },
      { setNumber: 2, setType: "working", targetReps: 20, targetIntensity: "Bodyweight" },
    ],
    trackingMode: "bodyweight",
    notes: "Squeeze glutes hard at top — DON'T hyperextend lower back.",
  },
  {
    name: "Wall Sit with Ball Squeeze",
    exerciseType: "activation",
    description: "1 × 45 seconds with ball/towel between knees.",
    sets: [
      { setNumber: 1, setType: "duration", targetReps: "Hold", targetIntensity: "Squeeze", durationSeconds: 45 },
    ],
    trackingMode: "time",
    notes:
      "Wall sit at 90° knees. Squeeze something between knees the entire time (small ball, rolled towel). Activates VMO + adductors together.",
  },
  {
    name: "Single-Leg Balance Reach",
    exerciseType: "activation",
    description: "2 × 8/leg. Reach forward, sideways, back.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 8, targetIntensity: "Bodyweight" },
      { setNumber: 2, setType: "working", targetReps: 8, targetIntensity: "Bodyweight" },
    ],
    trackingMode: "bodyweight",
    notes:
      "Stand on one leg, reach opposite hand forward / lateral / back. Light squat each rep. Proprioception + glute med stabilization.",
  },
];

// ============================================
// Glute hypertrophy — supplementary hip-hinge work only.
// Used as an optional finisher on Saturday. THP covers full-range
// VMO loading, Bulgarian split squats, cable hip abduction.
// ============================================
export const gluteHypertrophy: Exercise[] = [
  {
    name: "Cable Pull-Through",
    exerciseType: "accessory",
    description: "3 × 12 with cable between legs.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 2, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 60 },
      { setNumber: 3, setType: "working", targetReps: 12, targetIntensity: "RPE 8", restSeconds: 60 },
    ],
    trackingMode: "weight_reps",
    notes:
      "Pure hip hinge. Cable rope attachment between legs, drive hips forward to lock out. Squeeze glutes hard at top.",
  },
  {
    name: "45-Degree Back Extension (Glute Focus)",
    exerciseType: "accessory",
    description: "3 × 15 with rounded upper back and chin tucked.",
    sets: [
      { setNumber: 1, setType: "working", targetReps: 15, targetIntensity: "Bodyweight", restSeconds: 60 },
      { setNumber: 2, setType: "working", targetReps: 15, targetIntensity: "Bodyweight", restSeconds: 60 },
      { setNumber: 3, setType: "working", targetReps: 15, targetIntensity: "Bodyweight", restSeconds: 60 },
    ],
    trackingMode: "weight_reps",
    notes:
      "Forgotten glute hypertrophy exercise. Round upper back slightly, chin tucked, drive through heels and pad. Squeeze glutes — DON'T arch lower back to lift higher.",
  },
];
