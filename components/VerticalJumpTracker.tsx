"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { getActiveTrainingPhase } from "@/lib/training-plan";
import { todayLocalISO, displayWithYear } from "@/lib/local-date";

type VJLog = {
  id: string;
  user_id: string;
  logged_at: string;
  standing_reach_inches: number | null;
  standing_vertical_inches: number | null;
  approach_vertical_inches: number | null;
  max_touch_inches: number | null;
  cmj_cm: number | null;
  measurement_method: string | null;
  notes: string | null;
  phase_id: string | null;
};

// Reference markers from historical data + plan goals.
const JAN_APPROACH_BASELINE = 25.0;        // Pre-PRP baseline
const PRE_CONCUSSION_CMJ = 30.7;            // Career best (Sep 2025)
const PHASE_D_APPROACH_GOAL = 29.0;         // The breakthrough target

export default function VerticalJumpTracker() {
  const { person } = useProfile();
  const [logs, setLogs] = useState<VJLog[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("vertical_jump_logs")
      .select("*")
      .eq("user_id", person)
      .order("logged_at", { ascending: false });
    setLogs((data as VJLog[]) ?? []);
    setLoaded(true);
  }, [person]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`vj_${person}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "vertical_jump_logs", filter: `user_id=eq.${person}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [person, load]);

  if (!loaded) return null;

  const approachLogs = logs.filter((l) => l.approach_vertical_inches != null);
  const bestApproach = approachLogs.reduce<number>((m, l) => Math.max(m, Number(l.approach_vertical_inches)), 0);
  const latestApproach = approachLogs[0]?.approach_vertical_inches;

  const cmjLogs = logs.filter((l) => l.cmj_cm != null);
  const bestCmj = cmjLogs.reduce<number>((m, l) => Math.max(m, Number(l.cmj_cm)), 0);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
          Summary
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Stat
            label="Approach"
            value={latestApproach != null ? `${Number(latestApproach).toFixed(1)}"` : "—"}
            sub={`Best: ${bestApproach.toFixed(1)}"`}
          />
          <Stat
            label="CMJ"
            value={cmjLogs[0]?.cmj_cm != null ? `${Number(cmjLogs[0].cmj_cm).toFixed(1)} cm` : "—"}
            sub={`Best: ${bestCmj.toFixed(1)} cm`}
          />
        </div>
        <div className="text-[11px] text-charcoal/60 space-y-0.5">
          <Reference label={`Jan baseline (approach)`} value={`${JAN_APPROACH_BASELINE.toFixed(1)}"`} />
          <Reference label={`Pre-concussion CMJ peak`} value={`${PRE_CONCUSSION_CMJ.toFixed(1)} cm`} />
          <Reference label={`Phase D approach goal`} value={`${PHASE_D_APPROACH_GOAL.toFixed(1)}"`} />
        </div>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="tappable w-full bg-forest text-terracotta font-bold py-3 rounded-lg text-sm mb-4"
      >
        + Log a jump session
      </button>

      <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase mb-2">
        History ({logs.length})
      </div>
      {logs.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-charcoal/60 italic">
          No entries yet.
        </div>
      )}
      {logs.map((l) => (
        <LogRow key={l.id} log={l} onChange={load} />
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

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-cream/40 rounded p-2">
      <div className="text-[10px] uppercase tracking-wider text-charcoal/60">{label}</div>
      <div className="font-mono font-bold text-charcoal text-lg leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-charcoal/50">{sub}</div>}
    </div>
  );
}

function Reference({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-t border-gray-100 pt-1">
      <span>{label}</span>
      <span className="font-mono text-charcoal/80">{value}</span>
    </div>
  );
}

function LogRow({ log, onChange }: { log: VJLog; onChange: () => void }) {
  async function del() {
    await supabase.from("vertical_jump_logs").delete().eq("id", log.id);
    onChange();
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs font-bold text-charcoal">{displayWithYear(log.logged_at.slice(0, 10))}</div>
        <button onClick={del} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-1 text-[11px] text-charcoal/80">
        {log.standing_vertical_inches != null && (
          <div>Standing: <span className="font-mono font-bold">{Number(log.standing_vertical_inches).toFixed(1)}"</span></div>
        )}
        {log.approach_vertical_inches != null && (
          <div>Approach: <span className="font-mono font-bold">{Number(log.approach_vertical_inches).toFixed(1)}"</span></div>
        )}
        {log.max_touch_inches != null && (
          <div>Touch: <span className="font-mono font-bold">{Number(log.max_touch_inches).toFixed(1)}"</span></div>
        )}
        {log.cmj_cm != null && (
          <div>CMJ: <span className="font-mono font-bold">{Number(log.cmj_cm).toFixed(1)} cm</span></div>
        )}
      </div>
      {(log.measurement_method || log.notes) && (
        <div className="mt-1 text-[11px] text-charcoal/60">
          {log.measurement_method && <span className="italic">{log.measurement_method}</span>}
          {log.notes && <span> · "{log.notes}"</span>}
        </div>
      )}
    </div>
  );
}

function LogModal({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const { person } = useProfile();
  const [date, setDate] = useState(todayLocalISO());
  const [standingReach, setStandingReach] = useState("");
  const [standingVertical, setStandingVertical] = useState("");
  const [approachVertical, setApproachVertical] = useState("");
  const [maxTouch, setMaxTouch] = useState("");
  const [cmj, setCmj] = useState("");
  const [method, setMethod] = useState("Wall touch");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto-calc standing vertical from (touch - reach) if both are set and standingVertical isn't.
  const sr = parseFloat(standingReach);
  const mt = parseFloat(maxTouch);
  const autoStanding = Number.isFinite(sr) && Number.isFinite(mt) && !standingVertical
    ? (mt - sr).toFixed(1)
    : null;

  async function submit() {
    setSaving(true);
    const phase = getActiveTrainingPhase(todayLocalISO()).code;
    await supabase.from("vertical_jump_logs").insert({
      user_id: person,
      logged_at: `${date}T12:00:00Z`,
      standing_reach_inches: standingReach ? parseFloat(standingReach) : null,
      standing_vertical_inches: standingVertical
        ? parseFloat(standingVertical)
        : autoStanding
        ? parseFloat(autoStanding)
        : null,
      approach_vertical_inches: approachVertical ? parseFloat(approachVertical) : null,
      max_touch_inches: maxTouch ? parseFloat(maxTouch) : null,
      cmj_cm: cmj ? parseFloat(cmj) : null,
      measurement_method: method || null,
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
      <div className="bg-white rounded-2xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-lg font-bold text-charcoal">Log a jump session</div>
          <button onClick={onCancel} className="text-charcoal/50 text-lg">✕</button>
        </div>

        <Label>Date</Label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label>Standing reach (in)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={standingReach}
              onChange={(e) => setStandingReach(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="82.5"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Label>Max touch (in)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={maxTouch}
              onChange={(e) => setMaxTouch(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="107.5"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <Label>Standing vert (in)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={standingVertical}
              onChange={(e) => setStandingVertical(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder={autoStanding ?? "20"}
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
            {autoStanding && !standingVertical && (
              <div className="text-[10px] text-charcoal/60 mt-0.5">Auto: {autoStanding}"</div>
            )}
          </div>
          <div>
            <Label>Approach vert (in)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={approachVertical}
              onChange={(e) => setApproachVertical(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="25"
              className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Label>CMJ (cm)</Label>
        <input
          type="text"
          inputMode="decimal"
          value={cmj}
          onChange={(e) => setCmj(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="30.7"
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        />

        <Label>Method</Label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
        >
          <option>Wall touch</option>
          <option>Vertec</option>
          <option>Force plate</option>
          <option>Phone app</option>
          <option>Other</option>
        </select>

        <Label>Notes</Label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="conditions, RPE, etc."
          className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-4"
        />

        <button
          onClick={submit}
          disabled={saving}
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
