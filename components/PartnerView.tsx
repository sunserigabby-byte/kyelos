"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getPlan, getCurrentDay, type Person } from "@/lib/plan-data";

type PersonStats = {
  currentDay: number;
  todayCompletionPct: number;
  startWeight: number | null;
  latestWeight: number | null;
  delta: number | null;
};

async function fetchStats(person: Person, currentDay: number): Promise<PersonStats> {
  const plan = getPlan(person);

  const [logsRes, compsRes] = await Promise.all([
    supabase.from("daily_logs").select("day_num, weight").eq("person", person).order("day_num"),
    supabase.from("completions").select("day_num, completed").eq("person", person).eq("day_num", currentDay),
  ]);

  const logs = logsRes.data || [];
  const comps = compsRes.data || [];

  const startWeight = logs.find((l) => l.day_num === 1)?.weight ?? null;
  const latestLog = [...logs].reverse().find((l) => l.weight != null);
  const latestWeight = latestLog?.weight ?? null;
  const delta =
    startWeight != null && latestWeight != null
      ? parseFloat((latestWeight - startWeight).toFixed(1))
      : null;

  // today's completion %
  const todayPlan = plan[currentDay - 1];
  const totalItems =
    1 + // am cardio
    todayPlan.meals.length +
    todayPlan.supplements.length +
    1; // workout
  const doneCount = comps.filter((c) => c.completed).length;
  const todayCompletionPct = Math.round((doneCount / totalItems) * 100);

  return { currentDay, todayCompletionPct, startWeight, latestWeight, delta };
}

export default function PartnerView() {
  const [gabbyStats, setGabbyStats] = useState<PersonStats | null>(null);
  const [jonStats, setJonStats] = useState<PersonStats | null>(null);
  const currentDay = getCurrentDay();

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      const [g, j] = await Promise.all([
        fetchStats("gabby", currentDay),
        fetchStats("jon", currentDay),
      ]);
      if (mounted) {
        setGabbyStats(g);
        setJonStats(j);
      }
    }
    loadAll();

    // Subscribe to live changes in both logs and completions
    const channel = supabase
      .channel("partner_view_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs" },
        () => loadAll()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentDay]);

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <PartnerCard name="Gabby" stats={gabbyStats} />
      <PartnerCard name="Jon" stats={jonStats} />
    </div>
  );
}

function PartnerCard({ name, stats }: { name: string; stats: PersonStats | null }) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }
  const deltaPositive = stats.delta != null && stats.delta < 0;
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-navy/20 fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-navy">{name}</div>
        <div className="text-xs text-gray-500">Day {stats.currentDay}</div>
      </div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Today</span>
          <span className="font-semibold text-navy">{stats.todayCompletionPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${stats.todayCompletionPct}%` }}
          ></div>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-lg font-bold text-navy">
            {stats.latestWeight != null ? `${stats.latestWeight}` : "—"}
            <span className="text-xs text-gray-500 ml-1">lb</span>
          </div>
        </div>
        {stats.delta != null && (
          <div
            className={`text-sm font-semibold ${
              deltaPositive ? "text-green-700" : stats.delta === 0 ? "text-gray-500" : "text-gray-600"
            }`}
          >
            {stats.delta > 0 ? "+" : ""}
            {stats.delta} lb
          </div>
        )}
      </div>
    </div>
  );
}
