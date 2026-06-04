"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import TodayBadge from "@/components/TodayBadge";
import IncomeRampCard from "@/components/IncomeRampCard";
import {
  getVisibleGoals,
  getPhasesForGoal,
  overallProgress,
  activePhaseOf,
  formatPhaseValue,
  phaseProgress,
  CATEGORY_META,
  OWNER_LABEL,
  type Goal,
  type GoalPhase,
  type GoalCategory,
} from "@/lib/goals";

type GoalWithPhases = Goal & { phases: GoalPhase[] };

const CATEGORY_ORDER: GoalCategory[] = ["financial", "fitness", "nutrition", "other"];

export default function GoalsPage() {
  const { person } = useProfile();
  const [goals, setGoals] = useState<GoalWithPhases[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const gs = await getVisibleGoals(person);
    const withPhases: GoalWithPhases[] = await Promise.all(
      gs.map(async (g) => ({ ...g, phases: await getPhasesForGoal(g.id) }))
    );
    setGoals(withPhases);
    setLoading(false);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime — any change to goals/phases/contributions reloads the page state.
  useEffect(() => {
    const channel = supabase
      .channel(`goals_list_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    goals: goals.filter((g) => g.category === cat),
  })).filter((g) => g.goals.length > 0);

  return (
    <div>
      <TodayBadge />
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl font-bold text-charcoal">Goals</h1>
        <Link
          href="/goals/new"
          className="tappable bg-forest text-terracotta font-semibold py-2 px-3 rounded-md text-xs"
        >
          + New Goal
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Multi-domain goal tracker — financial, fitness, nutrition, and beyond. Shared goals
        show for both of you.
      </p>

      <IncomeRampCard />

      {goals.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">No goals yet.</p>
          <Link
            href="/goals/new"
            className="inline-block tappable bg-forest text-terracotta font-semibold py-2 px-4 rounded-md text-sm"
          >
            Create your first goal
          </Link>
        </div>
      )}

      {grouped.map(({ category, goals: gs }) => (
        <section key={category} className="mb-6">
          <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 flex items-center gap-2">
            <span>{CATEGORY_META[category].icon}</span>
            <span>{CATEGORY_META[category].label}</span>
          </div>
          {gs.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </section>
      ))}
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalWithPhases }) {
  const progress = overallProgress(goal.phases);
  const active = activePhaseOf(goal.phases);
  const meta = CATEGORY_META[goal.category];
  const pct = Math.round(progress * 100);

  return (
    <Link
      href={`/goals/${goal.id}`}
      className={`block bg-white border border-gray-200 border-l-4 ${meta.accentClass} rounded-lg p-4 mb-3 hover:shadow-sm transition`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-charcoal text-base mb-0.5">{goal.title}</div>
          <div className="text-[11px] text-charcoal/60 flex items-center gap-2">
            <span className="uppercase tracking-wider">{OWNER_LABEL[goal.owner]}</span>
            {goal.priority === "high" && (
              <span className="bg-terracotta/15 text-terracotta font-bold px-1.5 py-0.5 rounded">HIGH</span>
            )}
            {goal.status === "complete" && (
              <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">COMPLETE</span>
            )}
            {goal.status === "paused" && (
              <span className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded">PAUSED</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-charcoal leading-tight">{pct}%</div>
          <div className="text-[10px] text-charcoal/50 uppercase tracking-wider">overall</div>
        </div>
      </div>

      <div className="h-2 bg-forest/10 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {active ? (
        <ActivePhaseRow phase={active} />
      ) : goal.status === "complete" ? (
        <div className="text-xs text-emerald-700 italic">All phases complete 🎉</div>
      ) : (
        <div className="text-xs text-charcoal/50 italic">No active phase.</div>
      )}
    </Link>
  );
}

function ActivePhaseRow({ phase }: { phase: GoalPhase }) {
  const pct = Math.round(phaseProgress(phase) * 100);
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <div className="flex items-baseline justify-between text-xs mb-1">
        <span className="text-charcoal/70">
          <span className="font-semibold text-charcoal">Phase {phase.phase_number}:</span>{" "}
          {phase.title}
        </span>
        <span className="text-charcoal/60 font-mono text-[11px]">
          {phase.is_cashflow
            ? formatPhaseValue(phase.current_value, phase.unit)
            : `${formatPhaseValue(phase.current_value, phase.unit)} / ${formatPhaseValue(phase.target_value, phase.unit)}`}
        </span>
      </div>
      {!phase.is_cashflow && (
        <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden">
          <div className="h-full bg-forest" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
