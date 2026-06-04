"use client";

import Link from "next/link";
import { useProfile } from "@/components/ProfileContext";
import { useCycleSettings } from "@/components/useCycleSettings";
import {
  PHASE_LABEL,
  PHASE_GUIDANCE,
  getCycleDay,
  getCyclePhase,
  daysUntilPeriod,
} from "@/lib/cycle";

// Promoted from the existing inline badge. Gabby only.
export default function CycleTodayCard() {
  const { person } = useProfile();
  const { settings } = useCycleSettings(person);
  if (person !== "gabby" || !settings) return null;

  const today = new Date();
  const day = getCycleDay(settings.last_period_start, today);
  const phase = getCyclePhase(day, settings.cycle_length);
  const dpu = daysUntilPeriod(settings.last_period_start, settings.cycle_length, today);

  return (
    <Link
      href="/cycle"
      className="block bg-white border border-gray-200 border-l-4 border-l-rose-400 rounded-lg p-3 mb-3 hover:shadow-sm transition"
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-bold text-charcoal">🌙 Cycle Day {day}</div>
        <div className="text-[11px] text-charcoal/60 font-mono">
          {dpu > 0 ? `${dpu} days to period` : dpu === 0 ? "Period today" : `Day ${day} (post-period)`}
        </div>
      </div>
      <div className="text-xs text-charcoal/70 italic">{PHASE_LABEL[phase]}</div>
      <p className="text-[11px] text-charcoal/60 mt-1 leading-snug line-clamp-2">
        {PHASE_GUIDANCE[phase]}
      </p>
    </Link>
  );
}
