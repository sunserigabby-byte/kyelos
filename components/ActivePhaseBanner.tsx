"use client";

import Link from "next/link";
import {
  getActiveTrainingPhase,
  dayNInPhase,
  totalDaysInPhase,
  macroBlockForToday,
} from "@/lib/training-plan";
import { todayLocalISO } from "@/lib/local-date";

// Compact hero showing the current training phase + today's macro block.
// Lives at the top of the new TrainingPlanToday.
export default function ActivePhaseBanner() {
  const iso = todayLocalISO();
  const phase = getActiveTrainingPhase(iso);
  const dayN = dayNInPhase(phase, iso);
  const total = totalDaysInPhase(phase);
  const pct = Math.round((dayN / total) * 100);
  const macro = macroBlockForToday(phase, iso);

  return (
    <Link
      href="/plan"
      className="block rounded-xl p-4 mb-3 text-cream bg-gradient-to-br from-forest to-forest-dark shadow-md hover:shadow-lg transition"
    >
      <div className="text-[10px] tracking-widest font-bold text-cream/70 mb-1">
        CURRENT PHASE · {phase.focusLabel.toUpperCase()}
      </div>
      <div className="text-lg font-bold mb-0.5">{phase.name}</div>
      <div className="text-xs text-cream/80 italic mb-2">{phase.subtitle}</div>

      <div className="text-xs text-cream/90 mb-2">
        Day <span className="font-bold">{dayN}</span> of {total}{" "}
        <span className="text-cream/60">· {pct}%</span>
      </div>
      <div className="h-1.5 bg-cream/20 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
      </div>

      {macro && (
        <div className="bg-cream/10 rounded-md p-2 text-xs">
          <div className="text-[10px] uppercase tracking-wider text-cream/60 mb-0.5">
            Today's macros · {prettyKey(macro.key)}
            {macro.block.dates ? ` (${macro.block.dates})` : ""}
          </div>
          <div className="font-mono font-bold text-sm">
            {macro.block.cal} cal
            <span className="text-cream/70 font-normal">
              {" · "}P {macro.block.p}
              {" · "}F {macro.block.f}
              {" · "}C {macro.block.c}
            </span>
          </div>
        </div>
      )}

      <div className="mt-2 text-[11px] text-terracotta font-semibold">
        Open roadmap →
      </div>
    </Link>
  );
}

function prettyKey(k: string): string {
  return k.replace(/_/g, " ");
}
