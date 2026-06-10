"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { getActiveTrainingPhase } from "@/lib/training-plan";
import { todayLocalISO, displayWithYear } from "@/lib/local-date";

type PR = {
  id: string;
  user_id: string;
  logged_at: string;
  lift_name: string;
  weight_lbs: number;
  reps: number;
  estimated_1rm_lbs: number;
  phase_id: string | null;
  notes: string | null;
};

const LIFTS = [
  "Back Squat",
  "Trap Bar Deadlift",
  "Conventional Deadlift",
  "Bench Press",
  "Weighted Pull-up",
  "Hip Thrust",
  "Power Clean",
];

// Epley formula: 1RM = w * (1 + r/30)
function epley(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || reps < 1) return 0;
  return weight * (1 + reps / 30);
}

export default function StrengthPRTracker() {
  const { person } = useProfile();
  const [prs, setPrs] = useState<PR[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("strength_prs")
      .select("*")
      .eq("user_id", person)
      .order("logged_at", { ascending: false });
    setPrs((data as PR[]) ?? []);
    setLoaded(true);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`prs_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "strength_prs", filter: `user_id=eq.${person}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  const bestByLift = useMemo(() => {
    const map = new Map<string, PR>();
    for (const p of prs) {
      const existing = map.get(p.lift_name);
      if (!existing || Number(p.estimated_1rm_lbs) > Number(existing.estimated_1rm_lbs)) {
        map.set(p.lift_name, p);
      }
    }
    return map;
  }, [prs]);

  if (!loaded) return null;

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
          Best estimated 1RM by lift
        </div>
        {bestByLift.size === 0 ? (
          <div className="text-xs text-charcoal/60 italic">No PRs logged yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {LIFTS.filter((l) => bestByLift.has(l)).map((lift) => {
              const pr = bestByLift.get(lift)!;
              return (
                <div key={lift} className="bg-cream/40 rounded px-2 py-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-charcoal/60 truncate">
                    {lift}
                  </div>
                  <div className="font-mono font-bold text-charcoal">
                    {Number(pr.estimated_1rm_lbs).toFixed(0)} lb
                  </div>
                  <div className="text-[10px] text-charcoal/50">
                    {pr.weight_lbs}×{pr.reps}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="tappable w-full bg-forest text-terracotta font-bold py-3 rounded-lg text-sm mb-4"
      >
        + Log a PR
      </button>

      <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
        History ({prs.length})
      </div>
      {prs.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-charcoal/60 italic">
          No entries yet.
        </div>
      )}
      {prs.map((p) => (
        <PRRow key={p.id} pr={p} onChange={load} />
      ))}

      {open && (
        <LogModal
          onCancel={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function PRRow({ pr, onChange }: { pr: PR; onChange: () => void }) {
  async function del() {
    await supabase.from("strength_prs").delete().eq("id", pr.id);
    onChange();
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-baseline justify-between mb-1 gap-2">
        <div className="font-bold text-charcoal text-sm">{pr.lift_name}</div>
        <button onClick={del} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
      </div>
      <div className="text-xs text-charcoal/80">
        <span className="font-mono font-bold">{pr.weight_lbs} lb × {pr.reps}</span>
        <span className="text-charcoal/60"> · e1RM </span>
        <span className="font-mono font-bold">{Number(pr.estimated_1rm_lbs).toFixed(0)} lb</span>
      </div>
      <div className="text-[11px] text-charcoal/60 mt-0.5">
        {displayWithYear(pr.logged_at.slice(0, 10))}
        {pr.phase_id ? ` · ${pr.phase_id.replace("phase_", "Phase ").toUpperCase()}` : ""}
      </div>
      {pr.notes && <div className="text-[11px] text-charcoal/70 italic mt-0.5">"{pr.notes}"</div>}
    </div>
  );
}

function LogModal({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { person } = useProfile();
  const [lift, setLift] = useState(LIFTS[0]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const e1rm = epley(w, r);

  async function submit() {
    if (!Number.isFinite(w) || !Number.isFinite(r) || r < 1) return;
    setSaving(true);
    const phase = getActiveTrainingPhase(todayLocalISO()).code;
    await supabase.from("strength_prs").insert({
      user_id: person,
      lift_name: lift,
      weight_lbs: w,
      reps: r,
      estimated_1rm_lbs: Math.round(e1rm * 10) / 10,
      logged_at: `${date}T12:00:00Z`,
      notes: notes.trim() || null,
      phase_id: phase,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div className="bg-white rounded-2xl p-4 w-full max-w-md fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-lg font-bold text-charcoal">Log a PR</div>
          <button onClick={onCancel} className="text-charcoal/50 text-lg">✕</button>
        </div>

        <Label>Lift</Label>
        <select
          value={lift}
          onChange={(e) => setLift(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        >
          {LIFTS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label>Weight (lb)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="135"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label>Reps</Label>
            <input
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="5"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {e1rm > 0 && (
          <div className="bg-cream/40 rounded px-2 py-1.5 mb-3 text-xs text-charcoal/80">
            Estimated 1RM: <span className="font-mono font-bold text-charcoal">{e1rm.toFixed(1)} lb</span>
          </div>
        )}

        <Label>Date</Label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <Label>Notes</Label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="form notes, RPE, etc."
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-4"
        />

        <button
          onClick={submit}
          disabled={saving || !weight || !reps}
          className="tappable w-full bg-forest text-terracotta font-bold py-2.5 rounded-md text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Log it"}
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-charcoal mb-1">{children}</div>;
}
