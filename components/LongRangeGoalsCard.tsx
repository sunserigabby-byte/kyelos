"use client";

import { useState } from "react";
import { LONG_RANGE_GOAL } from "@/lib/training-plan";
import { displayWithYear } from "@/lib/local-date";

export default function LongRangeGoalsCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tappable w-full text-left flex items-center justify-between"
      >
        <div>
          <div className="text-sm font-bold text-charcoal">🎯 Long-range goal</div>
          <div className="text-[11px] text-charcoal/60">
            By {displayWithYear(LONG_RANGE_GOAL.goal_date)}
          </div>
        </div>
        <div className="text-charcoal/40 text-xs">{open ? "▲" : "▼"}</div>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Weight" value={`${LONG_RANGE_GOAL.weight_lbs} lb`} />
          <Stat label="Body fat" value={`${LONG_RANGE_GOAL.body_fat_pct}%`} />
          <Stat label="Muscle mass" value={`${LONG_RANGE_GOAL.muscle_mass_lbs} lb`} />
          <Stat label="Approach vertical" value={`${LONG_RANGE_GOAL.approach_vertical_inches}"`} />
          <Stat label="CMJ" value={`${LONG_RANGE_GOAL.cmj_cm} cm`} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream/40 rounded px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-charcoal/60">{label}</div>
      <div className="font-mono font-bold text-charcoal">{value}</div>
    </div>
  );
}
