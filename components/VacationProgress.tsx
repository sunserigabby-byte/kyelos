"use client";

import { useEffect, useMemo, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { getCurrentPhaseDay, getTotalDays } from "@/lib/phases";
import {
  getVacationPlan,
  getVacationTargets,
} from "@/lib/vacation-plan";

type Log = {
  day_num: number;
  protein_g: number | null;
  water_oz: number | null;
  steps: number | null;
};

type Completion = {
  day_num: number;
  item_key: string;
  completed: boolean;
};

export default function VacationProgress() {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const plan = getVacationPlan(person);

  const [logs, setLogs] = useState<Log[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!activePhase) return;
    let mounted = true;
    async function load() {
      const phaseId = activePhase!.id;
      const [logsRes, compsRes] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("day_num, protein_g, water_oz, steps, recovery_mode")
          .eq("person", person)
          .eq("phase_id", phaseId),
        supabase
          .from("completions")
          .select("day_num, item_key, completed")
          .eq("person", person)
          .eq("phase_id", phaseId),
      ]);
      if (!mounted) return;
      const ls = (logsRes.data as any[]) ?? [];
      setLogs(ls);
      setCompletions((compsRes.data as Completion[]) ?? []);
      // Use today's recovery_mode if available
      const todayDay = getCurrentPhaseDay(activePhase!, new Date());
      const todayLog = ls.find((l) => l.day_num === todayDay);
      setRecoveryMode(!!todayLog?.recovery_mode);
    }
    load();

    const channel = supabase
      .channel(`vac_progress_${person}_${activePhase.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions", filter: `person=eq.${person}` },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person, activePhase]);

  if (!activePhase) return null;

  const totalDays = getTotalDays(activePhase);
  const currentDay = getCurrentPhaseDay(activePhase, new Date());
  const daysLeft = Math.max(0, totalDays - currentDay);

  const targets = getVacationTargets(person, recoveryMode);

  const stats = useMemo(() => {
    const workoutsAvailable = plan.length;
    const workoutsDone = completions.filter(
      (c) =>
        (c.item_key === "vac_workout_done" || c.item_key === "vac_workout_rest_day") &&
        c.completed
    ).length;
    const waterHits = logs.filter(
      (l) => (l.water_oz ?? 0) >= targets.waterOz
    ).length;
    const proteinHits = logs.filter(
      (l) => (l.protein_g ?? 0) >= targets.proteinG
    ).length;
    const stepHits = logs.filter(
      (l) => (l.steps ?? 0) >= targets.steps
    ).length;
    return { workoutsAvailable, workoutsDone, waterHits, proteinHits, stepHits };
  }, [logs, completions, plan, targets]);

  function dayCompletionPct(dayNum: number): number {
    const dayItems = [
      "vac_workout_done",
      "vac_workout_rest_day",
      "vac_meal_breakfast",
      "vac_meal_lunch",
      "vac_meal_dinner",
      "vac_supp_creatine",
      "vac_supp_mag",
    ];
    const total = dayItems.length;
    const done = completions.filter(
      (c) => c.day_num === dayNum && dayItems.includes(c.item_key) && c.completed
    ).length;
    return Math.round((done / total) * 100);
  }

  return (
    <div>
      {/* Trip overview */}
      <div className="bg-navy text-white rounded-lg p-5 mb-4 border-t-4 border-b-4 border-gold">
        <div className="text-gold text-xs font-bold tracking-widest mb-1">
          🌴 PUERTO RICO
        </div>
        <div className="text-2xl font-bold mb-1">
          Day {currentDay} of {totalDays}
        </div>
        <div className="text-white/70 text-sm">
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left
        </div>
      </div>

      {/* Wins counters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <WinCard
          icon="🏋️"
          label="Workouts"
          value={`${stats.workoutsDone} / ${stats.workoutsAvailable}`}
        />
        <WinCard icon="💧" label="Water hits" value={`${stats.waterHits}`} />
        <WinCard icon="🥩" label="Protein hits" value={`${stats.proteinHits}`} />
        <WinCard icon="👟" label="Step hits" value={`${stats.stepHits}`} />
      </div>

      {/* 8-day grid */}
      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
        Trip Days
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {plan.map((d) => {
          const isToday = d.day === currentDay;
          const pct = dayCompletionPct(d.day);
          return (
            <div
              key={d.day}
              className={`bg-white rounded-lg p-3 ${
                isToday ? "border-2 border-gold" : "border border-gray-200"
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-xs font-bold text-navy">Day {d.day}</div>
                {pct >= 80 && d.day < currentDay && (
                  <div className="text-xs text-green-700">✓</div>
                )}
              </div>
              <div className="text-[10px] text-gray-500 truncate">{d.date}</div>
              <div className="text-xs text-navy mt-1 truncate">{d.vibe}</div>
              <div className="text-xs font-semibold text-gold mt-1">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WinCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-[10px] uppercase tracking-wider text-navy/60 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-navy">{value}</div>
    </div>
  );
}
