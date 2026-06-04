"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getWeeklyContributionsForGoal,
  getPhasesForGoal,
  weeklyTargetFromMonthly,
  monthlyTargetFromPhases,
  weekRange,
  type GoalPhase,
} from "@/lib/goals";
import { displayShort } from "@/lib/local-date";

type Props = {
  goalId: string;
  /** Optional title override (defaults to "Weekly Target"). */
  title?: string;
};

export default function WeeklyContributionCard({ goalId, title = "Weekly Target" }: Props) {
  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [ps, total] = await Promise.all([
      getPhasesForGoal(goalId),
      getWeeklyContributionsForGoal(goalId),
    ]);
    setPhases(ps);
    setWeekTotal(total);
    setLoaded(true);
  }, [goalId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`weekly_${goalId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases", filter: `goal_id=eq.${goalId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, load]);

  if (!loaded) return null;

  const monthlyTarget = monthlyTargetFromPhases(phases);
  const weeklyTarget = weeklyTargetFromMonthly(monthlyTarget);
  const range = weekRange();
  const pct = weeklyTarget > 0 ? Math.min(100, Math.round((weekTotal / weeklyTarget) * 100)) : 0;
  const hasTarget = weeklyTarget > 0;

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-forest rounded-lg p-3 mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-bold text-charcoal">📆 {title}</div>
        {hasTarget ? (
          <div className="text-xs font-mono text-charcoal/70">
            ${Math.round(weekTotal).toLocaleString()} / ${weeklyTarget.toLocaleString()} · {pct}%
          </div>
        ) : (
          <div className="text-xs text-charcoal/50 italic">No weekly target set</div>
        )}
      </div>
      {hasTarget && (
        <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="text-[11px] text-charcoal/60 mt-1">
        Week of {displayShort(range.start)} – {displayShort(range.end)}
        {hasTarget && (
          <span className="ml-2">
            (~${monthlyTarget.toLocaleString()}/mo allocation)
          </span>
        )}
      </div>
    </div>
  );
}
