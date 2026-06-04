"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import {
  getVisibleGoals,
  getPhasesForGoal,
  overallProgress,
  activePhaseOf,
  phaseProgress,
  formatPhaseValue,
  CATEGORY_META,
  type Goal,
  type GoalPhase,
} from "@/lib/goals";

type GoalWithPhases = Goal & { phases: GoalPhase[] };

export default function GoalsDashboardWidget() {
  const { person } = useProfile();
  const [goals, setGoals] = useState<GoalWithPhases[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const gs = await getVisibleGoals(person);
    const active = gs.filter((g) => g.status === "active");
    const withPhases: GoalWithPhases[] = await Promise.all(
      active.map(async (g) => ({ ...g, phases: await getPhasesForGoal(g.id) }))
    );
    // Priority weight: high > medium > low.
    const rank = (p: string) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
    withPhases.sort((a, b) => rank(a.priority) - rank(b.priority));
    setGoals(withPhases.slice(0, 3));
    setLoaded(true);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`goals_widget_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (!loaded || goals.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">Active Goals</div>
        <Link href="/goals" className="text-[11px] text-charcoal/60 hover:text-charcoal">
          View all →
        </Link>
      </div>
      {goals.map((g) => (
        <WidgetRow key={g.id} goal={g} />
      ))}
    </div>
  );
}

function WidgetRow({ goal }: { goal: GoalWithPhases }) {
  const overall = overallProgress(goal.phases);
  const pct = Math.round(overall * 100);
  const active = activePhaseOf(goal.phases);
  const meta = CATEGORY_META[goal.category];

  return (
    <Link
      href={`/goals/${goal.id}`}
      className={`block bg-white border border-gray-200 border-l-4 ${meta.accentClass} rounded-lg p-3 mb-2 hover:shadow-sm transition`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="font-bold text-charcoal text-sm truncate flex items-center gap-1.5">
          <span className="text-base">{meta.icon}</span>
          <span className="truncate">{goal.title}</span>
        </div>
        <div className="text-sm font-bold text-charcoal flex-shrink-0">{pct}%</div>
      </div>
      <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
      </div>
      {active && (
        <div className="text-[11px] text-charcoal/60 truncate">
          Phase {active.phase_number}: {active.title}
          {!active.is_cashflow && (
            <>
              {" "}·{" "}
              <span className="font-mono">
                {formatPhaseValue(active.current_value, active.unit)} / {formatPhaseValue(active.target_value, active.unit)}
              </span>
              {" "}
              ({Math.round(phaseProgress(active) * 100)}%)
            </>
          )}
        </div>
      )}
    </Link>
  );
}
