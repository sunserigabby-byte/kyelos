"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getContributionSplitForMonth,
  monthlyTargetFromPhases,
  getPhasesForGoal,
  type ContributionSplit,
  type GoalPhase,
} from "@/lib/goals";
import {
  currentMonthInfo,
  getMonthlyTotal,
  taxReserveFor,
} from "@/lib/income-ramp";

type IncomeSplit = ContributionSplit;

export default function TogetherThisMonthCard({ goalId }: { goalId: string }) {
  const month = currentMonthInfo();
  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [contribSplit, setContribSplit] = useState<ContributionSplit>({
    gabby: 0,
    jon: 0,
    combined: 0,
  });
  const [incomeSplit, setIncomeSplit] = useState<IncomeSplit>({
    gabby: 0,
    jon: 0,
    combined: 0,
  });

  const load = useCallback(async () => {
    const [ps, cs, ig, ij] = await Promise.all([
      getPhasesForGoal(goalId),
      getContributionSplitForMonth(goalId, month.yyyyMm),
      getMonthlyTotal("gabby", month.yyyyMm),
      getMonthlyTotal("jon", month.yyyyMm),
    ]);
    setPhases(ps);
    setContribSplit(cs);
    setIncomeSplit({ gabby: ig, jon: ij, combined: ig + ij });
  }, [goalId, month.yyyyMm]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`together_month_${goalId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "income_entries" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, load]);

  const monthlyTarget = monthlyTargetFromPhases(phases);
  const pct = monthlyTarget > 0 ? Math.min(100, Math.round((contribSplit.combined / monthlyTarget) * 100)) : 0;
  const incomeCombinedTarget = (month.target ?? 0) * 2;
  const incomePct = incomeCombinedTarget > 0 ? Math.min(100, Math.round((incomeSplit.combined / incomeCombinedTarget) * 100)) : 0;

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-rose-400 rounded-lg p-4 mb-4">
      <div className="text-charcoal font-bold text-base mb-3">
        🤝 Together · {month.label}
      </div>

      <SplitRow
        label="Contributed to goal"
        split={contribSplit}
        target={monthlyTarget}
        pct={pct}
      />

      <div className="my-3 border-t border-gray-100" />

      <SplitRow
        label="Side income (gross)"
        split={incomeSplit}
        target={incomeCombinedTarget}
        pct={incomePct}
        accent="forest"
      />

      <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-charcoal/60 leading-snug">
        Est. tax reserve from side income: ~$
        {taxReserveFor(incomeCombinedTarget).toLocaleString()}/mo (≈20%).{" "}
        The rest is what's available to move toward the goal.
      </div>
    </div>
  );
}

function SplitRow({
  label,
  split,
  target,
  pct,
  accent = "terracotta",
}: {
  label: string;
  split: ContributionSplit;
  target: number;
  pct: number;
  accent?: "terracotta" | "forest";
}) {
  const barColor = accent === "forest" ? "bg-forest" : "bg-terracotta";
  const targetText =
    target > 0
      ? `${pct}% of $${target.toLocaleString()}/mo`
      : "no target set";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs font-semibold text-charcoal">{label}</div>
        <div className="text-xs font-mono text-charcoal/70">
          ${Math.round(split.combined).toLocaleString()} <span className="text-charcoal/50">· {targetText}</span>
        </div>
      </div>
      <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2 text-[11px]">
        <PersonPill person="gabby" amount={split.gabby} />
        <PersonPill person="jon" amount={split.jon} />
      </div>
    </div>
  );
}

function PersonPill({ person, amount }: { person: "gabby" | "jon"; amount: number }) {
  const isGabby = person === "gabby";
  const cls = isGabby
    ? "bg-terracotta/10 text-terracotta border-terracotta/20"
    : "bg-forest/10 text-forest border-forest/30";
  return (
    <div className={`flex-1 border rounded px-2 py-1 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">
        {isGabby ? "Gabby" : "Jon"}
      </div>
      <div className="font-mono font-bold">${Math.round(amount).toLocaleString()}</div>
    </div>
  );
}
