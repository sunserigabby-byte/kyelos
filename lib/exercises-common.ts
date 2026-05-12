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
