"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DayPlan, Person } from "@/lib/plan-data";
import { usePhase } from "@/components/PhaseContext";

type Log = {
  day_num: number;
  weight: number | null;
  waist: number | null;
};

type Completion = {
  day_num: number;
  item_key: string;
  completed: boolean;
};

type Props = {
  person: Person;
  plan: DayPlan[];
  selectedDay: number;
};

function requiredItemKeys(plan: DayPlan[], dayNum: number): string[] {
  const day = plan[dayNum - 1];
  if (!day) return [];
  return [
    "am_cardio",
    ...day.meals.map((m) => m.key),
    ...day.supplements.map((s) => s.key),
    "workout_complete",
  ];
}

function isDayComplete(
  plan: DayPlan[],
  dayNum: number,
  completions: Completion[]
): boolean {
  const required = requiredItemKeys(plan, dayNum);
  if (required.length === 0) return false;
  const done = new Set(
    completions.filter((c) => c.day_num === dayNum && c.completed).map((c) => c.item_key)
  );
  return required.every((k) => done.has(k));
}

export default function DaySummary({ person, plan, selectedDay }: Props) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id ?? null;

  const [logs, setLogs] = useState<Log[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!phaseId) return;
    let mounted = true;
    async function load() {
      const [logsRes, compsRes] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("day_num, weight, waist")
          .eq("person", person)
          .eq("phase_id", phaseId),
        supabase
          .from("completions")
          .select("day_num, item_key, completed")
          .eq("person", person)
          .eq("phase_id", phaseId),
      ]);
      if (!mounted) return;
      setLogs((logsRes.data as Log[]) || []);
      setCompletions((compsRes.data as Completion[]) || []);
    }
    load();
    const channel = supabase
      .channel(`summary_${person}_${phaseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions", filter: `person=eq.${person}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` },
        () => load()
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person, phaseId]);

  const required = useMemo(() => requiredItemKeys(plan, selectedDay), [plan, selectedDay]);
  const doneToday = useMemo(
    () =>
      completions.filter((c) => c.day_num === selectedDay && c.completed).map((c) => c.item_key),
    [completions, selectedDay]
  );
  const doneCount = doneToday.filter((k) => required.includes(k)).length;
  const totalCount = required.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const after8pm = now.getHours() >= 20;

  if (!allDone && !after8pm) return null;

  const todayLog = logs.find((l) => l.day_num === selectedDay);
  const day1Log = logs.find((l) => l.day_num === 1);
  const yesterdayLog = logs.find((l) => l.day_num === selectedDay - 1);

  const weightVsDay1 =
    selectedDay > 1 && todayLog?.weight != null && day1Log?.weight != null
      ? +(todayLog.weight - day1Log.weight).toFixed(1)
      : null;
  const waistVsDay1 =
    selectedDay > 1 && todayLog?.waist != null && day1Log?.waist != null
      ? +(todayLog.waist - day1Log.waist).toFixed(1)
      : null;
  const weightVsYesterday =
    selectedDay > 1 && todayLog?.weight != null && yesterdayLog?.weight != null
      ? +(todayLog.weight - yesterdayLog.weight).toFixed(1)
      : null;

  // Streak: consecutive days from day 1 forward where 100% complete
  let streak = 0;
  for (let d = 1; d <= selectedDay; d++) {
    if (isDayComplete(plan, d, completions)) streak++;
    else break;
  }

  return (
    <div
      className="rounded-lg p-4 mb-4 border-2 border-terracotta shadow-sm fade-in"
      style={{
        background: "linear-gradient(135deg, #F7F2E8 0%, #DCE3D6 100%)",
      }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-charcoal font-bold text-base">Day {selectedDay} Summary</div>
        {streak > 1 && (
          <div className="text-sm font-semibold" style={{ color: "#A85E40" }}>
            🔥 {streak} {streak === 1 ? "day" : "days"} at 100%
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-white/60 rounded p-2">
          <div className="text-[10px] uppercase tracking-wider text-charcoal/60 font-semibold">
            Items
          </div>
          <div className="text-lg font-bold text-charcoal">
            {doneCount}/{totalCount}
            <span className="text-xs text-gray-500 ml-1">
              {allDone ? "✓ all done" : ""}
            </span>
          </div>
        </div>
        <div className="bg-white/60 rounded p-2">
          <div className="text-[10px] uppercase tracking-wider text-charcoal/60 font-semibold">
            Weight / Waist
          </div>
          <div className="text-lg font-bold text-charcoal">
            {todayLog?.weight != null ? `${todayLog.weight} lb` : "—"}
            <span className="text-xs text-gray-500 ml-1">
              {todayLog?.waist != null ? `/ ${todayLog.waist}"` : ""}
            </span>
          </div>
        </div>
      </div>

      {(weightVsDay1 != null || waistVsDay1 != null || weightVsYesterday != null) && (
        <div className="text-xs text-charcoal/80 space-y-0.5 mt-2">
          {weightVsDay1 != null && (
            <div>
              vs Day 1:
              <span className="font-semibold ml-1">
                {weightVsDay1 > 0 ? "+" : ""}
                {weightVsDay1} lb
              </span>
              {waistVsDay1 != null && (
                <>
                  , waist
                  <span className="font-semibold ml-1">
                    {waistVsDay1 > 0 ? "+" : ""}
                    {waistVsDay1}"
                  </span>
                </>
              )}
            </div>
          )}
          {weightVsYesterday != null && (
            <div>
              vs yesterday:
              <span className="font-semibold ml-1">
                {weightVsYesterday > 0 ? "+" : ""}
                {weightVsYesterday} lb
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
