"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import TodayBadge from "@/components/TodayBadge";
import IncomeRampCard from "@/components/IncomeRampCard";
import WeeklyContributionCard from "@/components/WeeklyContributionCard";
import TogetherThisMonthCard from "@/components/TogetherThisMonthCard";
import PhaseChecklist from "@/components/PhaseChecklist";
import {
  getVisibleGoals,
  getPhasesForGoal,
  getContributionsForGoal,
  getContributionSplitForGoal,
  overallProgress,
  phaseProgress,
  paceSummary,
  formatPhaseValue,
  activePhaseOf,
  CATEGORY_META,
  type Goal,
  type GoalPhase,
  type GoalContribution,
  type ContributionSplit,
} from "@/lib/goals";
import { displayShort } from "@/lib/local-date";

export default function FinancesPage() {
  const { person, isCoupleMode } = useProfile();
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);
  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [contribs, setContribs] = useState<GoalContribution[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [split, setSplit] = useState<ContributionSplit>({ gabby: 0, jon: 0, combined: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const goals = await getVisibleGoals(person);
    // Couple mode → shared goals only. Individual mode → that person's + shared.
    const scoped = isCoupleMode ? goals.filter((g) => g.owner === "shared") : goals;
    const financial = scoped.filter((g) => g.category === "financial");
    setAllGoals(scoped);

    const primary =
      financial.find((g) => g.status === "active") ??
      financial[0] ??
      null;
    setPrimaryGoal(primary);

    if (primary) {
      const [ps, cs, sp] = await Promise.all([
        getPhasesForGoal(primary.id),
        getContributionsForGoal(primary.id),
        getContributionSplitForGoal(primary.id),
      ]);
      setPhases(ps);
      setContribs(cs);
      setSplit(sp);
    } else {
      setPhases([]);
      setContribs([]);
      setSplit({ gabby: 0, jon: 0, combined: 0 });
    }
    setLoading(false);
  }, [person, isCoupleMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`finances_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  return (
    <div>
      <TodayBadge startISO={primaryGoal?.start_date} context={primaryGoal ? "plan" : undefined} />
      <h1 className="text-2xl font-bold text-charcoal mb-1">
        {isCoupleMode ? "Finances Together" : "Finances"}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {isCoupleMode
          ? "Shared goals only. Switch profile to view individual money goals."
          : "Where you are, where you're going, and what to do this week."}
      </p>

      {!primaryGoal ? (
        <EmptyState />
      ) : (
        <>
          <PaceHero goal={primaryGoal} phases={phases} contribs={contribs} split={split} />
          <TogetherThisMonthCard goalId={primaryGoal.id} />
          <WeeklyContributionCard goalId={primaryGoal.id} />
          <IncomeRampCard />
          <ActivePhaseSection phases={phases} contribs={contribs} goalId={primaryGoal.id} />
          <RecentContributions contribs={contribs} phases={phases} goalId={primaryGoal.id} />
          <OtherFinancialGoals
            goals={allGoals.filter((g) => g.category === "financial" && g.id !== primaryGoal.id)}
          />
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/goals/new"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
        >
          + New Goal
        </Link>
        {primaryGoal && (
          <Link
            href={`/goals/${primaryGoal.id}`}
            className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
          >
            Full Goal Detail
          </Link>
        )}
        <Link
          href="/goals"
          className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2 px-3 rounded-md text-xs"
        >
          All Goals
        </Link>
      </div>
    </div>
  );
}

function PaceHero({
  goal,
  phases,
  contribs,
  split,
}: {
  goal: Goal;
  phases: GoalPhase[];
  contribs: GoalContribution[];
  split: ContributionSplit;
}) {
  const overall = overallProgress(phases);
  const pct = Math.round(overall * 100);
  const pace = paceSummary(goal, phases);
  const total = contribs.reduce((s, c) => s + Number(c.amount), 0);

  // Total target across accumulation phases.
  const totalTarget = phases
    .filter((p) => !p.is_cashflow && p.target_value > 0)
    .reduce((s, p) => s + p.target_value, 0);

  const paceColor =
    pace?.status === "ahead"
      ? "from-emerald-600 to-emerald-700"
      : pace?.status === "behind"
      ? "from-amber-600 to-amber-700"
      : "from-forest to-forest-dark";

  const splitTotal = split.combined;
  const gabbyPct = splitTotal > 0 ? Math.round((split.gabby / splitTotal) * 100) : 0;
  const jonPct = splitTotal > 0 ? 100 - gabbyPct : 0;

  return (
    <div className={`rounded-xl p-5 mb-4 text-cream bg-gradient-to-br ${paceColor} shadow-md`}>
      <div className="text-[10px] tracking-widest font-bold text-cream/70 mb-1">
        {goal.title.toUpperCase()} · TOGETHER
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-3xl font-bold font-mono leading-none">
          ${Math.round(total).toLocaleString()}
        </div>
        <div className="text-sm text-cream/80">
          of ${Math.round(totalTarget).toLocaleString()}
        </div>
      </div>
      <div className="text-sm text-cream/90 mb-3">
        <span className="font-bold">{pct}%</span> overall
        {pace && (
          <>
            <span className="mx-2 text-cream/40">·</span>
            <span className="font-semibold">{pace.message}</span>
          </>
        )}
      </div>
      <div className="h-2 bg-cream/20 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
      </div>

      {splitTotal > 0 ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-cream/10 rounded px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-cream/60">Gabby</div>
            <div className="font-mono font-bold">
              ${Math.round(split.gabby).toLocaleString()}{" "}
              <span className="text-cream/60 font-normal">· {gabbyPct}%</span>
            </div>
          </div>
          <div className="bg-cream/10 rounded px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-cream/60">Jon</div>
            <div className="font-mono font-bold">
              ${Math.round(split.jon).toLocaleString()}{" "}
              <span className="text-cream/60 font-normal">· {jonPct}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-cream/70 italic">
          No contributions yet — first one starts the split.
        </div>
      )}
    </div>
  );
}

function ActivePhaseSection({
  phases,
  contribs,
  goalId,
}: {
  phases: GoalPhase[];
  contribs: GoalContribution[];
  goalId: string;
}) {
  const active = activePhaseOf(phases);
  if (!active) return null;

  const pct = Math.round(phaseProgress(active) * 100);
  const phaseContribs = contribs.filter((c) => c.phase_id === active.id);

  return (
    <div className="mb-4">
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
        Active Phase
      </div>
      <div className="bg-white border-2 border-terracotta rounded-lg p-4">
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-charcoal/60">
              PHASE {active.phase_number}
            </div>
            <div className="font-bold text-charcoal">{active.title}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-charcoal/70">
              {active.is_cashflow
                ? formatPhaseValue(active.current_value, active.unit)
                : `${formatPhaseValue(active.current_value, active.unit)} / ${formatPhaseValue(active.target_value, active.unit)}`}
            </div>
            {!active.is_cashflow && <div className="text-[10px] text-charcoal/50">{pct}%</div>}
          </div>
        </div>
        {!active.is_cashflow && (
          <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-forest" style={{ width: `${pct}%` }} />
          </div>
        )}
        {active.description && (
          <p className="text-xs text-charcoal/70 leading-relaxed mb-2 whitespace-pre-wrap">
            {active.description}
          </p>
        )}
        <div className="text-[11px] text-charcoal/50 mb-1">
          {phaseContribs.length} contribution{phaseContribs.length === 1 ? "" : "s"} logged
        </div>
        <PhaseChecklist phaseId={active.id} />
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/goals/${goalId}`}
            className="text-xs text-terracotta font-semibold hover:underline"
          >
            View all phases →
          </Link>
        </div>
      </div>
    </div>
  );
}

function RecentContributions({
  contribs,
  phases,
  goalId,
}: {
  contribs: GoalContribution[];
  phases: GoalPhase[];
  goalId: string;
}) {
  if (contribs.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
          Recent Contributions
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs text-charcoal/60 italic">
          No contributions yet. Use the + button (bottom right) to log one.
        </div>
      </div>
    );
  }
  const recent = contribs.slice(0, 6);
  const phaseOf = (id: string) => phases.find((p) => p.id === id);
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between border-b-2 border-terracotta/60 pb-1 mb-3">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider">
          Recent Contributions
        </div>
        <Link
          href={`/goals/${goalId}`}
          className="text-[11px] text-charcoal/60 hover:text-charcoal"
        >
          Full log →
        </Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {recent.map((c) => {
          const ph = phaseOf(c.phase_id);
          const isGabby = c.created_by === "gabby";
          const pillClass = isGabby
            ? "bg-terracotta/10 text-terracotta border-terracotta/20"
            : "bg-forest/10 text-forest border-forest/30";
          return (
            <div key={c.id} className="p-3 flex items-baseline gap-3">
              <div className="font-mono font-bold text-charcoal text-sm flex-shrink-0">
                ${Math.round(Number(c.amount)).toLocaleString()}
              </div>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase border rounded px-1.5 py-0.5 flex-shrink-0 ${pillClass}`}
              >
                {isGabby ? "Gabby" : "Jon"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-charcoal/60">
                  {displayShort(c.date)}
                  {ph ? ` · Phase ${ph.phase_number}` : ""}
                </div>
                {c.note && (
                  <div className="text-xs text-charcoal/80 italic truncate">"{c.note}"</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OtherFinancialGoals({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
        Other Financial Goals
      </div>
      {goals.map((g) => (
        <Link
          key={g.id}
          href={`/goals/${g.id}`}
          className="block bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-3 mb-2 hover:shadow-sm transition"
        >
          <div className="font-bold text-charcoal text-sm">{g.title}</div>
          <div className="text-[11px] text-charcoal/60 uppercase tracking-wider">{g.status}</div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
      <div className="text-4xl mb-2">💰</div>
      <div className="font-bold text-charcoal mb-1">No financial goals yet</div>
      <p className="text-sm text-charcoal/60 mb-4">
        Create a phased goal to track recovery, savings, or any money milestone.
      </p>
      <Link
        href="/goals/new"
        className="inline-block tappable bg-forest text-terracotta font-semibold py-2 px-4 rounded-md text-sm"
      >
        Create a goal
      </Link>
    </div>
  );
}
