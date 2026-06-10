"use client";

import Link from "next/link";
import { getActiveTrainingPhase } from "@/lib/training-plan";
import { todayLocalISO } from "@/lib/local-date";

// Compact card showing the active phase's training split + vertical goal.
// Replaces the in-app WorkoutGrid for training_plan phases — actual day-by-day
// exercise prescription is managed by THP (external coach), not this app.
export default function TrainingSplitCard() {
  const phase = getActiveTrainingPhase(todayLocalISO());

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
        🏋️ Training Split · {phase.focusLabel}
      </div>
      <p className="text-sm text-charcoal/90 leading-relaxed mb-2">{phase.trainingSplit}</p>
      <div className="bg-cream/40 rounded px-2 py-1.5 text-[11px] text-charcoal/80 mb-2">
        <span className="text-charcoal/60 italic">Vertical goal: </span>
        {phase.verticalGoal}
      </div>
      <div className="text-[11px] text-charcoal/60 italic">
        Day-by-day programming managed by THP.{" "}
        <Link href="/plan" className="text-terracotta font-semibold hover:underline">
          See full plan →
        </Link>
      </div>
    </div>
  );
}
