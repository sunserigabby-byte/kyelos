"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { dailyKneeGluteActivation } from "@/lib/exercises-common";
import { todayLocalISO } from "@/lib/local-date";

type Props = {
  dayNum: number;
};

const ITEM_KEYS = [
  "activation_quad_sets",
  "activation_clamshells",
  "activation_lateral_steps",
  "activation_glute_bridge",
  "activation_wall_sit_squeeze",
  "activation_balance_reach",
];

// Daily morning circuit for VMO + glute activation. Six bilateral
// exercises, low volume, ~10-15 min. Tracks a streak based on
// daily_logs.daily_activation_done across consecutive dates.
export default function DailyActivationCard({ dayNum }: Props) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id ?? null;

  const [checked, setChecked] = useState<boolean[]>(() => ITEM_KEYS.map(() => false));
  const [streak, setStreak] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [marking, setMarking] = useState(false);

  const loadState = useCallback(async () => {
    if (!phaseId) {
      setLoaded(true);
      return;
    }
    const { data } = await supabase
      .from("completions")
      .select("item_key, completed")
      .eq("person", person)
      .eq("day_num", dayNum)
      .eq("phase_id", phaseId)
      .in("item_key", ITEM_KEYS);
    const map = new Map<string, boolean>();
    for (const r of (data as { item_key: string; completed: boolean }[] | null) ?? []) {
      map.set(r.item_key, !!r.completed);
    }
    setChecked(ITEM_KEYS.map((k) => map.get(k) ?? false));
    setLoaded(true);
  }, [person, dayNum, phaseId]);

  const loadStreak = useCallback(async () => {
    const { data } = await supabase
      .from("daily_logs")
      .select("date, daily_activation_done")
      .eq("person", person)
      .order("date", { ascending: false })
      .limit(90);
    setStreak(computeStreak((data as { date: string; daily_activation_done: boolean | null }[] | null) ?? []));
  }, [person]);

  useEffect(() => {
    loadState();
    loadStreak();
  }, [loadState, loadStreak]);

  useEffect(() => {
    if (!phaseId) return;
    const channel = supabase
      .channel(`activation_${person}_${dayNum}_${phaseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions", filter: `person=eq.${person}` },
        () => loadState()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` },
        () => loadStreak()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, phaseId, loadState, loadStreak]);

  async function toggle(idx: number) {
    if (!phaseId) return;
    const newVal = !checked[idx];
    setChecked((xs) => xs.map((v, i) => (i === idx ? newVal : v)));
    await supabase.from("completions").upsert(
      {
        person,
        day_num: dayNum,
        item_key: ITEM_KEYS[idx],
        phase_id: phaseId,
        completed: newVal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,item_key,phase_id" }
    );
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(newVal ? 8 : 4);
    // If all six are now checked, flip the daily_logs flag for streak tracking.
    const allChecked = checked.map((v, i) => (i === idx ? newVal : v)).every(Boolean);
    if (allChecked) {
      await markDailyActivationDone(person, dayNum, phaseId, true);
    }
  }

  async function markAllComplete() {
    if (!phaseId) return;
    setMarking(true);
    setChecked(ITEM_KEYS.map(() => true));
    const now = new Date().toISOString();
    const rows = ITEM_KEYS.map((k) => ({
      person,
      day_num: dayNum,
      item_key: k,
      phase_id: phaseId,
      completed: true,
      updated_at: now,
    }));
    await supabase.from("completions").upsert(rows, { onConflict: "person,day_num,item_key,phase_id" });
    await markDailyActivationDone(person, dayNum, phaseId, true);
    setMarking(false);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(15);
  }

  const allDone = checked.every(Boolean);

  return (
    <div className={`bg-white border ${allDone ? "border-emerald-300" : "border-gray-200"} rounded-lg p-3 mb-3`}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="text-sm font-bold text-charcoal">
          🧎 Daily VMO + Glute Activation
        </div>
        {streak > 0 && (
          <div className="text-xs font-bold text-amber-700">
            🔥 {streak}-day streak
          </div>
        )}
      </div>
      <div className="text-[11px] text-charcoal/60 mb-2">
        10-15 min · Every morning · {loaded ? `${checked.filter(Boolean).length}/${ITEM_KEYS.length} done today` : "loading…"}
      </div>

      {loaded && (
        <ul className="space-y-1.5 mb-2">
          {dailyKneeGluteActivation.map((ex, i) => (
            <li key={ITEM_KEYS[i]}>
              <button
                onClick={() => toggle(i)}
                className="tappable w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-gray-50"
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition ${
                    checked[i] ? "bg-forest border-forest" : "border-gray-300"
                  }`}
                >
                  {checked[i] && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-semibold text-charcoal ${
                      checked[i] ? "line-through opacity-60" : ""
                    }`}
                  >
                    {ex.name}
                  </span>
                  <span className="block text-[11px] text-charcoal/60">{ex.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!allDone && (
        <button
          onClick={markAllComplete}
          disabled={marking || !phaseId}
          className="tappable w-full bg-forest text-terracotta font-semibold py-2 rounded-md text-xs disabled:opacity-50"
        >
          {marking ? "Saving…" : "Mark all complete"}
        </button>
      )}
      {allDone && (
        <div className="text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded py-2">
          ✓ Daily activation complete
        </div>
      )}
    </div>
  );
}

async function markDailyActivationDone(
  person: string,
  dayNum: number,
  phaseId: string,
  done: boolean
) {
  const today = todayLocalISO();
  await supabase.from("daily_logs").upsert(
    {
      person,
      day_num: dayNum,
      phase_id: phaseId,
      date: today,
      daily_activation_done: done,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "person,day_num,phase_id" }
  );
}

// Walk through recent daily_logs descending by date and count consecutive
// dates where daily_activation_done = true. Starting point is today if
// today's row exists with done=true, otherwise the most-recent done date.
// A gap of 1+ missing days breaks the streak.
function computeStreak(rows: { date: string; daily_activation_done: boolean | null }[]): number {
  if (rows.length === 0) return 0;
  // Build a lookup of dates that have done=true.
  const doneDates = new Set<string>();
  for (const r of rows) {
    if (r.daily_activation_done) doneDates.add(r.date);
  }
  if (doneDates.size === 0) return 0;

  // Anchor: today if today is in doneDates, else yesterday (so a streak
  // doesn't break immediately at midnight before today's done flag).
  const today = todayLocalISO();
  let anchor = today;
  if (!doneDates.has(today)) {
    const y = subOneDay(today);
    if (!doneDates.has(y)) return 0;
    anchor = y;
  }

  let streak = 0;
  let cursor = anchor;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = subOneDay(cursor);
  }
  return streak;
}

function subOneDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
