"use client";

import Link from "next/link";
import WorkoutGrid from "@/components/WorkoutGrid";

export default function WorkoutsIndexPage() {
  return (
    <div>
      <Link
        href="/fitness"
        className="text-xs text-charcoal/60 hover:text-charcoal mb-2 inline-block"
      >
        ← Fitness
      </Link>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Workout Schedule</h1>
      <p className="text-sm text-gray-500 mb-4">
        All workouts in your current phase. Do them at your own pace — the
        next incomplete one is highlighted. Tap any cell to start.
      </p>
      <WorkoutGrid />
    </div>
  );
}
