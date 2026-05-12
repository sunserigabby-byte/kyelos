"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/training-types";
import WorkoutTracker from "@/components/WorkoutTracker";

type Props = {
  exercises: Exercise[];
  sessionId: string | null;
  dayNum: number;
};

export default function SingleLegSection({ exercises, sessionId, dayNum }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <button onClick={() => setOpen((v) => !v)} className="tappable w-full text-left flex items-center justify-between">
        <div>
          <div className="font-bold text-charcoal text-sm">Single-Leg Maintenance (LEFT) — Optional</div>
          <div className="text-xs text-gray-500">{open ? "Tap to collapse" : "Tap to show exercises"}</div>
        </div>
        <div className="text-charcoal/40 text-xs">{open ? "▲" : "▼"}</div>
      </button>
      {open && (
        <div className="mt-2">
          <div className="bg-sage-pale/40 border-l-4 border-terracotta px-3 py-2 mb-2 text-xs text-charcoal">
            Cross-education effect: training left leg maintains right leg strength via neural pathways.
          </div>
          {exercises.map((ex) => (
            <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={dayNum} />
          ))}
        </div>
      )}
    </div>
  );
}
