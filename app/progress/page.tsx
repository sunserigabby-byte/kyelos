"use client";

import { useEffect, useState, useRef } from "react";
import { useProfile } from "@/components/ProfileContext";
import { getPlan } from "@/lib/plan-data";
import { supabase } from "@/lib/supabase";
import PartnerView from "@/components/PartnerView";

type Log = {
  day_num: number;
  weight: number | null;
  waist: number | null;
  sleep: number | null;
  energy: number | null;
  compliance: number | null;
  notes: string | null;
};

type Completion = {
  day_num: number;
  item_key: string;
  completed: boolean;
};

export default function ProgressPage() {
  const { person } = useProfile();
  const plan = getPlan(person);
  const [logs, setLogs] = useState<Log[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    load();

    // Live sync: refresh data on any change
    const channel = supabase
      .channel(`progress_${person}`)
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
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person]);

  async function load() {
    const [logsRes, compsRes] = await Promise.all([
      supabase.from("daily_logs").select("*").eq("person", person).order("day_num"),
      supabase.from("completions").select("*").eq("person", person),
    ]);
    if (!mountedRef.current) return;
    setLogs((logsRes.data as Log[]) || []);
    setCompletions((compsRes.data as Completion[]) || []);
    setLoading(false);
  }

  function getLog(day: number): Log | undefined {
    return logs.find((l) => l.day_num === day);
  }

  function getCompletionPct(day: number): number {
    const dayPlan = plan[day - 1];
    if (!dayPlan) return 0;
    const totalItems =
      1 + // am cardio
      dayPlan.meals.length +
      dayPlan.supplements.length +
      1; // workout
    const completedCount = completions.filter(
      (c) => c.day_num === day && c.completed
    ).length;
    return Math.round((completedCount / totalItems) * 100);
  }

  const startWeight = getLog(1)?.weight;
  const latestLog = [...logs].reverse().find((l) => l.weight != null);
  const latestWeight = latestLog?.weight;
  const weightDelta =
    startWeight != null && latestWeight != null
      ? (latestWeight - startWeight).toFixed(1)
      : null;

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }

  return (
    <div>
      {/* Partner view — live both profiles */}
      <div className="mb-2">
        <div className="text-xs font-bold tracking-widest text-navy/60 mb-2">
          BOTH OF YOU — LIVE
        </div>
        <PartnerView />
      </div>

      {/* Your own summary */}
      <div className="text-xs font-bold tracking-widest text-navy/60 mb-2">
        YOUR 7-DAY PROGRESS
      </div>
      <div className="bg-navy text-white rounded-lg p-5 mb-4 border-t-4 border-b-4 border-gold">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Start"
            value={startWeight != null ? `${startWeight} lb` : "—"}
          />
          <Stat
            label="Latest"
            value={latestWeight != null ? `${latestWeight} lb` : "—"}
          />
          <Stat
            label="Delta"
            value={weightDelta != null ? `${weightDelta} lb` : "—"}
            accent={weightDelta != null && parseFloat(weightDelta) < 0}
          />
        </div>
      </div>

      {/* 7-day table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="p-3 text-left">Day</th>
              <th className="p-3 text-right">Wt</th>
              <th className="p-3 text-right">Waist</th>
              <th className="p-3 text-right">Sl</th>
              <th className="p-3 text-right">En</th>
              <th className="p-3 text-right">✓</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((day) => {
              const log = getLog(day.day);
              const pct = getCompletionPct(day.day);
              return (
                <tr
                  key={day.day}
                  className={`border-b border-gray-100 ${
                    day.day % 2 === 0 ? "bg-navy-light/50" : ""
                  }`}
                >
                  <td className="p-3">
                    <div className="font-semibold text-navy">Day {day.day}</div>
                    <div className="text-xs text-gray-500">
                      {day.date.split(", ")[1]}
                    </div>
                  </td>
                  <td className="p-3 text-right">{log?.weight ?? "—"}</td>
                  <td className="p-3 text-right">{log?.waist ?? "—"}</td>
                  <td className="p-3 text-right">{log?.sleep ?? "—"}</td>
                  <td className="p-3 text-right">{log?.energy ?? "—"}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`font-semibold ${
                        pct === 100
                          ? "text-green-700"
                          : pct > 0
                          ? "text-navy"
                          : "text-gray-400"
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes summary */}
      <div className="mt-6">
        <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
          Notes
        </div>
        {logs.filter((l) => l.notes).length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notes yet.</p>
        ) : (
          logs
            .filter((l) => l.notes)
            .map((l) => (
              <div
                key={l.day_num}
                className="bg-white border border-gray-200 rounded-lg p-3 mb-2"
              >
                <div className="text-xs font-semibold text-navy mb-1">
                  Day {l.day_num}
                </div>
                <div className="text-sm text-gray-700">{l.notes}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-gold/80 font-semibold tracking-wider">
        {label}
      </div>
      <div className={`text-xl font-bold ${accent ? "text-gold" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
