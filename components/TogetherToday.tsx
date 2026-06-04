"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import TodayBadge from "@/components/TodayBadge";
import MoneyTodayCard from "@/components/MoneyTodayCard";
import CycleTodayCard from "@/components/CycleTodayCard";
import { todayLocalISO, displayLong } from "@/lib/local-date";

type PersonStatus = {
  person: "gabby" | "jon";
  phaseName: string | null;
  dayNum: number | null;
  workoutDone: boolean;
  workoutName: string | null;
  mealsLogged: number;
  totalMeals: number;
};

// The "together" home screen: at-a-glance snapshot of what each of
// you needs to do today, with money front-and-center.
export default function TogetherToday() {
  const { setView } = useProfile();
  const [gabby, setGabby] = useState<PersonStatus | null>(null);
  const [jon, setJon] = useState<PersonStatus | null>(null);
  const today = todayLocalISO();

  const load = useCallback(async () => {
    setGabby(await loadStatusFor("gabby", today));
    setJon(await loadStatusFor("jon", today));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`together_today_${today}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_selections" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, load]);

  return (
    <div>
      <TodayBadge />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-charcoal mb-0.5">Together</h1>
        <p className="text-sm text-gray-500">{displayLong(today)} · here's where you both are.</p>
      </div>

      <MoneyTodayCard />
      <CycleTodayCard />

      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-4">
        Today at a glance
      </div>

      <PersonSummaryCard status={gabby} onJump={() => setView("gabby")} />
      <PersonSummaryCard status={jon} onJump={() => setView("jon")} />

      <div className="mt-6">
        <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
          Jump to
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/finances"
            className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
          >
            💰 Finances Together →
          </Link>
          <Link
            href="/fitness"
            className="tappable bg-white border border-forest/30 text-charcoal font-semibold py-2.5 px-3 rounded-md text-xs text-center"
          >
            🏋️ Fitness Together →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PersonSummaryCard({
  status,
  onJump,
}: {
  status: PersonStatus | null;
  onJump: () => void;
}) {
  if (!status) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 text-xs text-charcoal/60 italic">
        Loading…
      </div>
    );
  }
  const isGabby = status.person === "gabby";
  const accent = isGabby ? "border-l-terracotta" : "border-l-forest";
  const pill = isGabby ? "bg-terracotta/15 text-terracotta" : "bg-forest/15 text-forest";

  return (
    <button
      onClick={onJump}
      className={`tappable w-full text-left bg-white border border-gray-200 border-l-4 ${accent} rounded-lg p-4 mb-3 hover:shadow-sm transition`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${pill}`}>
            {isGabby ? "Gabby" : "Jon"}
          </span>
          {status.phaseName && (
            <span className="text-[11px] text-charcoal/60 truncate">{status.phaseName}</span>
          )}
        </div>
        <div className="text-[11px] text-charcoal/60">
          {status.dayNum ? `Day ${status.dayNum}` : ""}
        </div>
      </div>

      <div className="text-sm font-bold text-charcoal mb-2">
        {status.workoutName ?? "No workout planned"}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <StatusPill
          label="Workout"
          done={status.workoutDone}
          value={status.workoutDone ? "Done ✓" : "Pending"}
        />
        <StatusPill
          label="Meals"
          done={status.mealsLogged >= status.totalMeals && status.totalMeals > 0}
          value={`${status.mealsLogged} / ${status.totalMeals}`}
        />
      </div>

      <div className="mt-3 text-[11px] text-terracotta font-semibold">
        Open {isGabby ? "Gabby's" : "Jon's"} day →
      </div>
    </button>
  );
}

function StatusPill({ label, done, value }: { label: string; done: boolean; value: string }) {
  return (
    <div
      className={`rounded px-2 py-1 border ${
        done
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-gray-50 border-gray-200 text-charcoal/70"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

async function loadStatusFor(person: "gabby" | "jon", todayISO: string): Promise<PersonStatus> {
  // Find this person's active phase.
  const { data: phaseRow } = await supabase
    .from("phases")
    .select("id, name, start_date, phase_type")
    .eq("person", person)
    .eq("is_active", true)
    .maybeSingle();

  const phase = phaseRow as { id: string; name: string; start_date: string } | null;

  let dayNum: number | null = null;
  if (phase) {
    const [py, pm, pd] = phase.start_date.split("-").map(Number);
    const [ty, tm, td] = todayISO.split("-").map(Number);
    const startMs = Date.UTC(py, pm - 1, pd);
    const todayMs = Date.UTC(ty, tm - 1, td);
    dayNum = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    if (dayNum < 1) dayNum = null;
  }

  let workoutDone = false;
  let workoutName: string | null = null;
  if (phase && dayNum) {
    const { data: session } = await supabase
      .from("workout_sessions")
      .select("workout_name, completed")
      .eq("person", person)
      .eq("phase_id", phase.id)
      .eq("day_num", dayNum)
      .maybeSingle();
    if (session) {
      const s = session as { workout_name: string; completed: boolean | null };
      workoutName = s.workout_name;
      workoutDone = !!s.completed;
    }
  }

  let mealsLogged = 0;
  const totalMeals = 4;
  if (phase && dayNum) {
    const { count } = await supabase
      .from("meal_selections")
      .select("*", { count: "exact", head: true })
      .eq("person", person)
      .eq("phase_id", phase.id)
      .eq("day_num", dayNum);
    mealsLogged = count ?? 0;
  }

  return {
    person,
    phaseName: phase?.name ?? null,
    dayNum,
    workoutDone,
    workoutName,
    mealsLogged,
    totalMeals,
  };
}
