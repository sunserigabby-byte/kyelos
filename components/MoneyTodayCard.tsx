"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import {
  getVisibleGoals,
  getPhasesForGoal,
  getWeeklyContributionsForGoal,
  weeklyTargetFromMonthly,
  monthlyTargetFromPhases,
  activePhaseOf,
  addContribution,
  type Goal,
  type GoalPhase,
} from "@/lib/goals";
import { todayLocalISO } from "@/lib/local-date";

// Compact money snapshot for the Today page. Shows the primary active
// financial goal: this week's contribution vs target, with a quick-add.
export default function MoneyTodayCard() {
  const { person } = useProfile();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [phases, setPhases] = useState<GoalPhase[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const goals = await getVisibleGoals(person);
    const primary = goals
      .filter((g) => g.category === "financial" && g.status === "active")
      .at(0);
    if (!primary) {
      setGoal(null);
      setPhases([]);
      setWeekTotal(0);
      setLoaded(true);
      return;
    }
    const [ps, wk] = await Promise.all([
      getPhasesForGoal(primary.id),
      getWeeklyContributionsForGoal(primary.id),
    ]);
    setGoal(primary);
    setPhases(ps);
    setWeekTotal(wk);
    setLoaded(true);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`money_today_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_contributions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goal_phases" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (!loaded || !goal) return null;

  const active = activePhaseOf(phases);
  const monthlyTarget = monthlyTargetFromPhases(phases);
  const weeklyTarget = weeklyTargetFromMonthly(monthlyTarget);
  const pct = weeklyTarget > 0 ? Math.min(100, Math.round((weekTotal / weeklyTarget) * 100)) : 0;

  async function quickAdd() {
    const n = parseFloat(quickAmount);
    if (!Number.isFinite(n) || n <= 0 || !active) return;
    setSaving(true);
    await addContribution({
      phaseId: active.id,
      amount: n,
      date: todayLocalISO(),
      createdBy: person,
    });
    setSaving(false);
    setQuickAmount("");
    setQuickOpen(false);
  }

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-lg p-3 mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <Link
          href="/finances"
          className="text-sm font-bold text-charcoal hover:underline"
        >
          💰 This week's transfer
        </Link>
        {weeklyTarget > 0 ? (
          <div className="text-xs font-mono text-charcoal/70">
            ${Math.round(weekTotal).toLocaleString()} / ${weeklyTarget.toLocaleString()}
          </div>
        ) : (
          <div className="text-[11px] text-charcoal/50 italic">No weekly target</div>
        )}
      </div>
      {weeklyTarget > 0 && (
        <div className="h-1.5 bg-forest/10 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-terracotta" style={{ width: `${pct}%` }} />
        </div>
      )}
      {active && (
        <div className="flex items-center gap-2">
          {!quickOpen ? (
            <button
              onClick={() => setQuickOpen(true)}
              className="tappable bg-forest text-terracotta font-semibold py-1 px-2.5 rounded text-[11px]"
            >
              + Quick log
            </button>
          ) : (
            <>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value.replace(/[^\d.]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") quickAdd();
                  if (e.key === "Escape") {
                    setQuickOpen(false);
                    setQuickAmount("");
                  }
                }}
                placeholder="$"
                className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs"
              />
              <button
                onClick={quickAdd}
                disabled={saving || !quickAmount}
                className="tappable bg-forest text-terracotta font-semibold py-1 px-2.5 rounded text-[11px] disabled:opacity-50"
              >
                {saving ? "…" : "Log"}
              </button>
              <button
                onClick={() => {
                  setQuickOpen(false);
                  setQuickAmount("");
                }}
                className="tappable text-charcoal/50 text-xs px-1"
                aria-label="Cancel"
              >
                ✕
              </button>
            </>
          )}
          <Link
            href="/finances"
            className="text-[11px] text-charcoal/60 hover:text-charcoal underline-offset-2 hover:underline ml-auto"
          >
            Finances →
          </Link>
        </div>
      )}
    </div>
  );
}
