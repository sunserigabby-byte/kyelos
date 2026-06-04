"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { useWorkoutSession } from "@/components/WorkoutTracker";
import WorkoutList from "@/components/WorkoutList";
import WorkoutTracker from "@/components/WorkoutTracker";
import RightLegRehab from "@/components/RightLegRehab";
import { gabbyPRP } from "@/lib/prp-plan";
import { markWorkoutComplete } from "@/lib/workout-queue";

type Props = { params: { dayNum: string } };

export default function WorkoutDetailPage({ params }: Props) {
  const router = useRouter();
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const dayNum = Number(params.dayNum);
  const day = gabbyPRP[dayNum - 1];

  const [completed, setCompleted] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [marking, setMarking] = useState(false);
  const [swingOpen, setSwingOpen] = useState(true);

  const sessionId = useWorkoutSession(dayNum, day?.workoutName ?? "", day?.isoDate ?? "");

  const refresh = useCallback(async () => {
    if (!activePhase) return;
    const { data } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("person", person)
      .eq("phase_id", activePhase.id)
      .eq("day_num", dayNum)
      .maybeSingle();
    if (data) setCompleted(!!(data as { completed: boolean | null }).completed);
    setSessionLoaded(true);
  }, [person, activePhase?.id, dayNum]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activePhase) return;
    const channel = supabase
      .channel(`workout_detail_${dayNum}_${activePhase.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workout_sessions",
          filter: `phase_id=eq.${activePhase.id}`,
        },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePhase?.id, dayNum, refresh]);

  if (!day) {
    return (
      <div className="text-center text-gray-500 py-8">
        Workout not found.{" "}
        <Link href="/fitness/workouts" className="text-terracotta hover:underline">
          Back to schedule
        </Link>
      </div>
    );
  }

  async function toggleComplete() {
    if (!activePhase) return;
    setMarking(true);
    await markWorkoutComplete({
      person,
      phaseId: activePhase.id,
      dayNum,
      workoutName: day.workoutName,
      workoutDate: day.isoDate,
      completed: !completed,
    });
    setMarking(false);
  }

  const hasSwingPrep = (day.swingPrep?.length ?? 0) > 0;

  return (
    <div>
      <Link
        href="/fitness/workouts"
        className="text-xs text-charcoal/60 hover:text-charcoal mb-2 inline-block"
      >
        ← All workouts
      </Link>

      {/* Header */}
      <div
        className={`rounded-xl p-5 mb-4 text-cream shadow-md bg-gradient-to-br ${
          completed ? "from-emerald-600 to-emerald-700" : "from-forest to-forest-dark"
        }`}
      >
        <div className="text-[10px] tracking-widest font-bold text-cream/70 mb-1">
          DAY {day.day} · WEEK {day.weekNum}
        </div>
        <div className="text-xl font-bold mb-1">{day.workoutName}</div>
        <div className="text-sm text-cream/80 italic mb-2">{day.focus}</div>
        <p className="text-sm text-cream/90 leading-relaxed mb-3">{day.intro}</p>
        {completed && (
          <div className="text-sm font-bold bg-cream/10 rounded px-2 py-1 inline-block">
            ✓ Marked complete
          </div>
        )}
      </div>

      {/* Mark complete button (top) */}
      <button
        onClick={toggleComplete}
        disabled={!sessionLoaded || marking || !activePhase}
        className={`tappable w-full font-bold py-3 rounded-lg text-sm mb-4 transition disabled:opacity-50 ${
          completed
            ? "bg-white border border-gray-300 text-charcoal"
            : "bg-emerald-600 text-white"
        }`}
      >
        {marking
          ? "Saving…"
          : completed
          ? "Re-open this workout"
          : "✓ Mark workout complete"}
      </button>

      {/* Swing prep */}
      {hasSwingPrep && (
        <div className="bg-forest-pale/30 border-l-4 border-terracotta rounded-r-md p-3 mb-3">
          <button
            onClick={() => setSwingOpen((v) => !v)}
            className="tappable w-full text-left flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-charcoal text-sm">🏐 Swing Prep — 5 min</div>
              <div className="text-xs text-charcoal/70">Mandatory shoulder warm-up</div>
            </div>
            <div className="text-charcoal/40 text-xs">{swingOpen ? "▲" : "▼"}</div>
          </button>
          {swingOpen && (
            <div className="mt-2 space-y-1">
              {day.swingPrep!.map((ex) => (
                <WorkoutTracker
                  key={ex.name}
                  exercise={ex}
                  sessionId={sessionId}
                  dayNum={dayNum}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout exercises */}
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Workout
      </div>
      <WorkoutList exercises={day.exercises} sessionId={sessionId} dayNum={dayNum} />

      {/* Right-leg rehab (if applicable) */}
      {day.rightLegRehab && (
        <RightLegRehab
          exercises={day.rightLegRehab}
          sessionId={sessionId}
          currentDay={dayNum}
          unlockDay={8}
        />
      )}

      {/* Mark complete button (bottom) */}
      <button
        onClick={toggleComplete}
        disabled={!sessionLoaded || marking || !activePhase}
        className={`tappable w-full font-bold py-3 rounded-lg text-sm mt-6 transition disabled:opacity-50 ${
          completed
            ? "bg-white border border-gray-300 text-charcoal"
            : "bg-emerald-600 text-white"
        }`}
      >
        {marking
          ? "Saving…"
          : completed
          ? "Re-open this workout"
          : "✓ Mark workout complete"}
      </button>
    </div>
  );
}
