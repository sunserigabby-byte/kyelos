"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import { getPhaseById, getTotalDays, type Phase } from "@/lib/phases";
import { getPlan } from "@/lib/plan-data";
import { getVacationPlan } from "@/lib/vacation-plan";

type Log = {
  day_num: number;
  weight: number | null;
  waist: number | null;
  sleep: number | null;
  energy: number | null;
  compliance: number | null;
  steps: number | null;
  water_oz: number | null;
  protein_g: number | null;
  notes: string | null;
};

type Completion = {
  day_num: number;
  item_key: string;
  completed: boolean;
};

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export default function ArchivedPhasePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { person } = useProfile();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const p = await getPhaseById(id);
      if (cancelled) return;
      setPhase(p);
      if (!p) {
        setLoading(false);
        return;
      }
      const [logsRes, compsRes] = await Promise.all([
        supabase
          .from("daily_logs")
          .select("day_num, weight, waist, sleep, energy, compliance, steps, water_oz, protein_g, notes")
          .eq("person", p.person)
          .eq("phase_id", p.id)
          .order("day_num"),
        supabase
          .from("completions")
          .select("day_num, item_key, completed")
          .eq("person", p.person)
          .eq("phase_id", p.id),
      ]);
      if (cancelled) return;
      setLogs((logsRes.data as Log[]) ?? []);
      setCompletions((compsRes.data as Completion[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;
  if (!phase) {
    return (
      <div>
        <p className="text-gray-500">Phase not found.</p>
        <Link href="/phases" className="text-charcoal underline-offset-2 underline text-sm">
          ← Back to History
        </Link>
      </div>
    );
  }

  const totalDays = getTotalDays(phase);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const isCut = phase.phase_type === "cut";
  const isVacation = phase.phase_type === "vacation";

  // For % completion per day, choose item set based on phase type
  const cutPlan = isCut ? getPlan(phase.person) : null;
  const vacationPlan = isVacation ? getVacationPlan(phase.person) : null;

  function requiredKeysFor(dayNum: number): string[] {
    if (cutPlan) {
      const day = cutPlan[dayNum - 1];
      if (!day) return [];
      return [
        "am_cardio",
        ...day.meals.map((m) => m.key),
        ...day.supplements.map((s) => s.key),
        "workout_complete",
      ];
    }
    if (vacationPlan) {
      return [
        "vac_workout_done",
        "vac_workout_rest_day",
        "vac_meal_breakfast",
        "vac_meal_lunch",
        "vac_meal_dinner",
        "vac_supp_creatine",
        "vac_supp_mag",
      ];
    }
    return [];
  }

  function pctFor(dayNum: number): number {
    const required = requiredKeysFor(dayNum);
    if (required.length === 0) return 0;
    const done = completions.filter(
      (c) => c.day_num === dayNum && c.completed && required.includes(c.item_key)
    ).length;
    const denom = isVacation ? required.length - 1 : required.length;
    return Math.round((done / denom) * 100);
  }

  const displayedPerson = phase.person === "gabby" ? "Gabby" : "Jon";

  return (
    <div>
      {/* Banner */}
      <div className="bg-sage-pale border border-terracotta/60 rounded-md px-4 py-3 mb-4">
        <div className="text-sm text-charcoal">
          <span className="font-semibold">Viewing archived phase</span> — {phase.name}
          {phase.is_active ? "" : `. Switch to active to log new data.`}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {displayedPerson} · {fmtDate(phase.start_date)} – {fmtDate(phase.end_date)}
        </div>
      </div>

      <Link
        href="/phases"
        className="inline-block text-xs text-charcoal underline-offset-2 hover:underline mb-4"
      >
        ← Back to History
      </Link>

      {/* Per-day rows */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-sage text-white">
            <tr>
              <th className="p-2 text-left">Day</th>
              {isCut && <th className="p-2 text-right">Wt</th>}
              {isCut && <th className="p-2 text-right">Wst</th>}
              {isVacation && <th className="p-2 text-right">P (g)</th>}
              {isVacation && <th className="p-2 text-right">H₂O</th>}
              <th className="p-2 text-right">Steps</th>
              <th className="p-2 text-right">✓</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const log = logs.find((l) => l.day_num === d);
              const pct = pctFor(d);
              return (
                <tr
                  key={d}
                  className={`border-b border-gray-100 ${d % 2 === 0 ? "bg-cream/30" : ""}`}
                >
                  <td className="p-2 font-semibold text-charcoal">{d}</td>
                  {isCut && <td className="p-2 text-right">{log?.weight ?? "—"}</td>}
                  {isCut && <td className="p-2 text-right">{log?.waist ?? "—"}</td>}
                  {isVacation && <td className="p-2 text-right">{log?.protein_g ?? 0}</td>}
                  {isVacation && <td className="p-2 text-right">{log?.water_oz ?? 0}</td>}
                  <td className="p-2 text-right">
                    {log?.steps != null ? log.steps.toLocaleString() : "—"}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      className={`font-semibold ${
                        pct === 100 ? "text-green-700" : pct > 0 ? "text-charcoal" : "text-gray-400"
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

      {/* Notes summary (cut only) */}
      {isCut && (
        <div>
          <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
            Notes
          </div>
          {logs.filter((l) => l.notes).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes were saved for this phase.</p>
          ) : (
            logs
              .filter((l) => l.notes)
              .map((l) => (
                <div
                  key={l.day_num}
                  className="bg-white border border-gray-200 rounded-lg p-3 mb-2"
                >
                  <div className="text-xs font-semibold text-charcoal mb-1">Day {l.day_num}</div>
                  <div className="text-sm text-gray-700">{l.notes}</div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
