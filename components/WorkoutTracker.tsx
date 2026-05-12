"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePhase } from "@/components/PhaseContext";
import { useProfile } from "@/components/ProfileContext";
import type { Exercise, ExerciseSet, TrackingMode } from "@/lib/training-types";

type Props = {
  exercise: Exercise;
  sessionId: string | null;
  dayNum: number;
};

type LoggedSet = {
  id?: string;
  setNumber: number;
  weight?: string;
  reps?: string;
  rpe?: string;
  durationSeconds?: number;
  intent?: string;
};

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
}

export default function WorkoutTracker({ exercise, sessionId, dayNum }: Props) {
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState<Record<number, LoggedSet>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  // Load any previously logged sets for this exercise + session
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("set_logs")
        .select("id, set_number, weight, reps, rpe, duration_seconds, intent")
        .eq("session_id", sessionId)
        .eq("exercise_name", exercise.name);
      if (cancelled) return;
      const map: Record<number, LoggedSet> = {};
      for (const row of (data as any[]) ?? []) {
        map[row.set_number] = {
          id: row.id,
          setNumber: row.set_number,
          weight: row.weight != null ? String(row.weight) : "",
          reps: row.reps != null ? String(row.reps) : "",
          rpe: row.rpe != null ? String(row.rpe) : "",
          durationSeconds: row.duration_seconds ?? undefined,
          intent: row.intent ?? undefined,
        };
      }
      setLogged(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, exercise.name]);

  async function saveSet(set: ExerciseSet, patch: Partial<LoggedSet>) {
    if (!sessionId) return;
    const current = logged[set.setNumber] ?? { setNumber: set.setNumber };
    const next: LoggedSet = { ...current, ...patch, setNumber: set.setNumber };
    setLogged({ ...logged, [set.setNumber]: next });
    setSaving({ ...saving, [set.setNumber]: true });

    const payload: any = {
      session_id: sessionId,
      exercise_name: exercise.name,
      set_number: set.setNumber,
      set_type: set.setType,
      weight: next.weight ? Number(next.weight) : null,
      reps: next.reps ? parseInt(next.reps, 10) : null,
      rpe: next.rpe ? parseInt(next.rpe, 10) : null,
      duration_seconds: next.durationSeconds ?? null,
      intent: next.intent ?? null,
    };

    if (next.id) {
      await supabase.from("set_logs").update(payload).eq("id", next.id);
    } else {
      const { data } = await supabase.from("set_logs").insert(payload).select("id").maybeSingle();
      if (data && (data as any).id) {
        setLogged((prev) => ({ ...prev, [set.setNumber]: { ...next, id: (data as any).id } }));
      }
    }
    setSaving((s) => ({ ...s, [set.setNumber]: false }));
  }

  const badge = TYPE_BADGE[exercise.exerciseType] ?? { label: exercise.exerciseType.toUpperCase(), color: "bg-navy text-gold" };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tappable w-full text-left p-3 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-semibold text-navy text-sm">{exercise.name}</span>
            <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded ${badge.color}`}>
              {badge.label}
            </span>
            {exercise.optional && (
              <span className="text-[9px] font-bold tracking-widest text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                OPTIONAL
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">{exercise.description}</div>
          {exercise.notes && !open && (
            <div className="text-[11px] text-gray-500 italic mt-1 line-clamp-2">{exercise.notes}</div>
          )}
        </div>
        <div className="text-navy/40 text-xs flex-shrink-0">{open ? "▲" : "▼"}</div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-gray-100">
          {exercise.notes && (
            <div className="text-xs text-gray-600 italic my-2">{exercise.notes}</div>
          )}
          {exercise.volleyballNote && (
            <div className="border-l-4 border-gold bg-gold-light/40 px-3 py-2 my-2 text-xs text-navy">
              🏐 <span className="font-semibold">Volleyball:</span> {exercise.volleyballNote}
            </div>
          )}
          <div className="mt-2 space-y-2">
            {exercise.sets.map((set) => (
              <SetRow
                key={set.setNumber}
                set={set}
                trackingMode={exercise.trackingMode}
                logged={logged[set.setNumber]}
                saving={!!saving[set.setNumber]}
                onPatch={(patch) => saveSet(set, patch)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  ramp_top: { label: "RAMP+TOP", color: "bg-navy text-gold" },
  volume: { label: "VOLUME", color: "bg-navy text-gold" },
  accessory: { label: "ACCESSORY", color: "bg-gray-200 text-navy" },
  power_throw: { label: "POWER", color: "bg-amber-500 text-white" },
  power_plyo: { label: "PLYO", color: "bg-amber-500 text-white" },
  tantrum: { label: "TANTRUM", color: "bg-amber-500 text-white" },
  core: { label: "CORE", color: "bg-navy text-gold" },
  conditioning: { label: "CONDITIONING", color: "bg-gray-200 text-navy" },
  mobility: { label: "MOBILITY", color: "bg-gray-200 text-navy" },
  swing_prep: { label: "SWING PREP", color: "bg-gold-light text-navy" },
  single_leg: { label: "SINGLE-LEG", color: "bg-gray-200 text-navy" },
  rehab: { label: "REHAB", color: "bg-green-100 text-green-800" },
};

function SetRow({
  set,
  trackingMode,
  logged,
  saving,
  onPatch,
}: {
  set: ExerciseSet;
  trackingMode: TrackingMode;
  logged: LoggedSet | undefined;
  saving: boolean;
  onPatch: (p: Partial<LoggedSet>) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-md p-2">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs font-semibold text-navy">
          Set {set.setNumber}
          <span className="text-gray-500 font-normal ml-1.5">[{set.setType}]</span>
        </div>
        <div className="text-[11px] text-gray-500 text-right">
          {set.targetReps} · {set.targetIntensity}
          {saving && <span className="ml-1 text-gold">saving...</span>}
          {!saving && logged?.id && <span className="ml-1 text-green-700">✓</span>}
        </div>
      </div>

      {trackingMode === "weight_reps" && (
        <div className="grid grid-cols-3 gap-2">
          <NumInput label="Weight" value={logged?.weight ?? ""} onCommit={(v) => onPatch({ weight: v })} placeholder="lb" />
          <NumInput label="Reps"   value={logged?.reps   ?? ""} onCommit={(v) => onPatch({ reps: v })} placeholder="reps" />
          <NumInput label="RPE"    value={logged?.rpe    ?? ""} onCommit={(v) => onPatch({ rpe: v })} placeholder="1-10" />
        </div>
      )}

      {trackingMode === "power" && (
        <div className="grid grid-cols-2 gap-2">
          <NumInput label="Reps" value={logged?.reps ?? ""} onCommit={(v) => onPatch({ reps: v })} placeholder="reps" />
          <IntentToggle value={logged?.intent} onChange={(v) => onPatch({ intent: v })} />
        </div>
      )}

      {trackingMode === "bodyweight" && (
        <div className="grid grid-cols-2 gap-2">
          <NumInput label="Reps" value={logged?.reps ?? ""} onCommit={(v) => onPatch({ reps: v })} placeholder="reps" />
          <NumInput label="RPE"  value={logged?.rpe  ?? ""} onCommit={(v) => onPatch({ rpe: v })} placeholder="1-10" />
        </div>
      )}

      {trackingMode === "time" && (
        <Timer
          seconds={set.durationSeconds ?? 20}
          done={!!logged?.id}
          onComplete={() => onPatch({ durationSeconds: set.durationSeconds ?? 20, reps: String(set.durationSeconds ?? 20) })}
        />
      )}
    </div>
  );
}

function NumInput({ label, value, onCommit, placeholder }: { label: string; value: string; onCommit: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onCommit(local); }}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm text-navy focus:border-navy focus:outline-none"
      />
    </div>
  );
}

function IntentToggle({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Intent</label>
      <div className="flex gap-1">
        {(["sub_max", "max"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`tappable flex-1 text-[11px] py-1.5 rounded ${value === opt ? "bg-navy text-gold font-semibold" : "bg-white border border-gray-300 text-gray-600"}`}
          >
            {opt === "sub_max" ? "Sub-max" : "Max"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Timer({ seconds, done, onComplete }: { seconds: number; done: boolean; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  function start() {
    setRunning(true);
    setRemaining(seconds);
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          setRunning(false);
          vibrate([50, 80, 50]);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function stop() {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setRunning(false);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-bold text-navy tabular-nums w-12">{remaining}s</div>
      {!running ? (
        <button
          onClick={start}
          className="tappable bg-navy text-gold font-semibold py-1.5 px-3 rounded text-xs"
        >
          {done ? "Restart" : "Start"}
        </button>
      ) : (
        <button
          onClick={stop}
          className="tappable bg-white border border-gray-300 text-gray-700 font-semibold py-1.5 px-3 rounded text-xs"
        >
          Stop
        </button>
      )}
      {done && <span className="text-xs text-green-700 font-semibold">✓ Done</span>}
    </div>
  );
}

// Hook that creates/ensures a workout_sessions row for the given day, returns its id.
export function useWorkoutSession(dayNum: number, workoutName: string, workoutDate: string): string | null {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activePhase) return;
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("person", person)
        .eq("phase_id", activePhase.id)
        .eq("day_num", dayNum)
        .maybeSingle();
      if (cancelled) return;
      if (existing && (existing as any).id) {
        setSessionId((existing as any).id);
      } else {
        const { data: created } = await supabase
          .from("workout_sessions")
          .insert({
            person,
            phase_id: activePhase.id,
            day_num: dayNum,
            workout_name: workoutName,
            workout_date: workoutDate,
          })
          .select("id")
          .maybeSingle();
        if (!cancelled && created && (created as any).id) setSessionId((created as any).id);
      }
    })();
    return () => { cancelled = true; };
  }, [person, activePhase?.id, dayNum, workoutName, workoutDate]);

  return sessionId;
}
