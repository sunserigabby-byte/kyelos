"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";

type SetRow = {
  id: string;
  exercise_name: string;
  set_number: number;
  set_type: string;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  duration_seconds: number | null;
  created_at: string;
  session_id: string;
};

type Session = {
  id: string;
  workout_name: string;
  workout_date: string;
  day_num: number;
  phase_id: string | null;
};

export default function WorkoutHistoryPage() {
  const { person } = useProfile();
  const [sets, setSets] = useState<SetRow[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [exercise, setExercise] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: sessRes } = await supabase
        .from("workout_sessions")
        .select("id, workout_name, workout_date, day_num, phase_id")
        .eq("person", person)
        .order("workout_date", { ascending: false });

      const sessIds = (sessRes as Session[] | null)?.map((s) => s.id) ?? [];
      const { data: setsRes } = sessIds.length > 0
        ? await supabase
            .from("set_logs")
            .select("id, exercise_name, set_number, set_type, weight, reps, rpe, duration_seconds, created_at, session_id")
            .in("session_id", sessIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      if (cancelled) return;
      const sessMap: Record<string, Session> = {};
      for (const s of (sessRes as Session[]) ?? []) sessMap[s.id] = s;
      setSessions(sessMap);
      setSets((setsRes as SetRow[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [person]);

  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of sets) set.add(s.exercise_name);
    return Array.from(set).sort();
  }, [sets]);

  const filtered = useMemo(() => {
    if (!exercise) return [];
    return sets
      .filter((s) => s.exercise_name === exercise)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [sets, exercise]);

  // Compute PR for each set_type: highest weight (or highest reps for bodyweight)
  const prByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filtered) {
      const val = s.weight ?? s.reps ?? 0;
      if (val > (map[s.set_type] ?? 0)) map[s.set_type] = val;
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Workout History</h1>
      <p className="text-sm text-gray-500 mb-4">All logged sets across all phases.</p>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading...</div>
      ) : exerciseNames.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No workouts logged yet. Start your first session — sets will appear here.</p>
      ) : (
        <>
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="w-full mb-4 bg-white border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">Pick an exercise…</option>
            {exerciseNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {exercise && filtered.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-sage text-white">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Set</th>
                    <th className="p-2 text-right">Wt</th>
                    <th className="p-2 text-right">Reps</th>
                    <th className="p-2 text-right">RPE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const session = sessions[s.session_id];
                    const val = s.weight ?? s.reps ?? 0;
                    const isPR = val === prByType[s.set_type] && val > 0;
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 ${isPR ? "bg-sage-pale/50" : ""}`}>
                        <td className="p-2 text-xs">
                          <div className="font-semibold text-charcoal">{session?.workout_date ?? "—"}</div>
                          <div className="text-gray-500">Day {session?.day_num ?? "?"}</div>
                        </td>
                        <td className="p-2 text-xs text-gray-600">
                          #{s.set_number}
                          <div className="text-[10px] uppercase tracking-wider text-charcoal/60">{s.set_type}</div>
                        </td>
                        <td className="p-2 text-right text-sm font-semibold">
                          {s.weight ?? "—"}
                          {isPR && <span className="ml-1 text-terracotta">★</span>}
                        </td>
                        <td className="p-2 text-right text-sm">{s.reps ?? "—"}</td>
                        <td className="p-2 text-right text-sm">{s.rpe ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {exercise && filtered.length === 0 && (
            <p className="text-sm text-gray-500 italic">No sets logged for this exercise yet.</p>
          )}
        </>
      )}

      <p className="text-xs text-gray-400 italic mt-4">
        Line charts coming in a future update. For now: sage-tinted rows are PRs by set type.
      </p>
    </div>
  );
}
