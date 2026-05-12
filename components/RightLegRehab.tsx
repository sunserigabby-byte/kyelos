"use client";

import { useState } from "react";
import type { Exercise } from "@/lib/training-types";
import WorkoutTracker from "@/components/WorkoutTracker";

type Props = {
  exercises: Exercise[];
  sessionId: string | null;
  currentDay: number;
  unlockDay?: number;
};

export default function RightLegRehab({ exercises, sessionId, currentDay, unlockDay = 8 }: Props) {
  const [open, setOpen] = useState(false);
  const locked = currentDay < unlockDay;
  const daysUntilUnlock = unlockDay - currentDay;

  if (locked) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-bold text-navy text-sm">Right-Leg Rehab — Daily</div>
          <span className="text-[10px] font-bold tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            🔒 LOCKED
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Right-leg rehab unlocks May 19 (Week 2). Until then, full rest for the injected knee. {daysUntilUnlock > 0 ? `(${daysUntilUnlock} days to go)` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <button onClick={() => setOpen((v) => !v)} className="tappable w-full text-left flex items-center justify-between">
        <div>
          <div className="font-bold text-navy text-sm">Right-Leg Rehab — Daily</div>
          <div className="text-xs text-gray-500">{open ? "Tap to collapse" : "Tap to show exercises"}</div>
        </div>
        <div className="text-navy/40 text-xs">{open ? "▲" : "▼"}</div>
      </button>
      {open && (
        <div className="mt-2">
          <div className="bg-green-50 border-l-4 border-green-600 px-3 py-2 mb-2 text-xs text-green-900">
            Pure isometric / non-loading work. Doctor-approved. Can be done any day, even rest days.
          </div>
          {exercises.map((ex) => (
            <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={currentDay} />
          ))}
        </div>
      )}
    </div>
  );
}
