"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";

export type CheckInPhase = "am" | "pm";

// Module-scoped: when ANY CheckInForm (AM or PM) saves, both instances
// ignore incoming realtime events for a brief window so the upsert echo
// doesn't clobber whatever the user is typing in the other phase's card.
let lastSaveAt = 0;
const SAVE_ECHO_WINDOW_MS = 800;

type Props = {
  person: Person;
  dayNum: number;
  isoDate: string;
  phase: CheckInPhase;
};

const AM_KEYS = ["weight", "waist", "sleep", "energy"] as const;
const PM_KEYS = ["steps", "compliance", "notes"] as const;
type AmKey = (typeof AM_KEYS)[number];
type PmKey = (typeof PM_KEYS)[number];
type FieldKey = AmKey | PmKey;

const FIELD_LABEL: Record<FieldKey, string> = {
  weight: "Weight (AM)",
  waist: "Waist",
  sleep: "Sleep /10",
  energy: "Energy /10",
  steps: "Steps",
  compliance: "Compliance /10",
  notes: "Notes / cravings / mood",
};

const SUMMARY_LABEL: Record<FieldKey, string> = {
  weight: "Weight",
  waist: "Waist",
  sleep: "Sleep",
  energy: "Energy",
  steps: "Steps",
  compliance: "Compliance",
  notes: "Notes",
};

const PHASE_TITLE: Record<CheckInPhase, string> = {
  am: "Morning Check-In",
  pm: "Evening Check-In",
};

const PHASE_HINT: Record<CheckInPhase, string> = {
  am: "Weight, waist, sleep, energy. Submit when you wake up.",
  pm: "Steps, compliance, and notes. Submit at end of day.",
};

function emptyState(phase: CheckInPhase): Record<string, string> {
  const keys = phase === "am" ? AM_KEYS : PM_KEYS;
  return Object.fromEntries(keys.map((k) => [k, ""]));
}

function rowToState(row: any, phase: CheckInPhase): Record<string, string> {
  const keys = phase === "am" ? AM_KEYS : PM_KEYS;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = row?.[k];
    out[k] = v == null ? "" : String(v);
  }
  return out;
}

function hasAnyValue(state: Record<string, string>): boolean {
  return Object.values(state).some((v) => v.trim() !== "");
}

function parseField(key: FieldKey, raw: string): number | string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (key === "notes") return trimmed;
  if (key === "weight" || key === "waist") {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

function formatValue(key: FieldKey, raw: string): string {
  if (raw.trim() === "") return "—";
  switch (key) {
    case "weight":
      return `${raw} lb`;
    case "waist":
      return `${raw} in`;
    case "sleep":
    case "energy":
    case "compliance":
      return `${raw} / 10`;
    case "steps": {
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n.toLocaleString() : raw;
    }
    case "notes":
      return raw;
  }
}

export default function CheckInForm({ person, dayNum, isoDate, phase }: Props) {
  const [state, setState] = useState<Record<string, string>>(() => emptyState(phase));
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    setState(emptyState(phase));
    setEditing(true);
    setShowOverlay(false);

    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("person", person)
        .eq("day_num", dayNum)
        .maybeSingle();
      if (cancelled) return;
      const next = data ? rowToState(data, phase) : emptyState(phase);
      setState(next);
      // If anything was saved for this phase, start in summary view.
      setEditing(!hasAnyValue(next));
    }
    load();

    const channel = supabase
      .channel(`log_${phase}_${person}_${dayNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_logs",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as any;
          if (
            row &&
            row.day_num === dayNum &&
            Date.now() - lastSaveAt > SAVE_ECHO_WINDOW_MS
          ) {
            const next = rowToState(row, phase);
            setState(next);
            // Only auto-flip into summary view from realtime if user isn't
            // already mid-edit. We don't want to yank a typing user back.
            setEditing((prev) => (prev ? prev : !hasAnyValue(next)));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, phase]);

  async function save() {
    setSaving(true);
    lastSaveAt = Date.now();

    const { data: existing } = await supabase
      .from("daily_logs")
      .select(
        "weight, waist, sleep, energy, compliance, steps, notes, water_oz"
      )
      .eq("person", person)
      .eq("day_num", dayNum)
      .maybeSingle();

    const merged: Record<string, any> = {
      person,
      day_num: dayNum,
      date: isoDate,
      weight: existing?.weight ?? null,
      waist: existing?.waist ?? null,
      sleep: existing?.sleep ?? null,
      energy: existing?.energy ?? null,
      compliance: existing?.compliance ?? null,
      steps: existing?.steps ?? null,
      notes: existing?.notes ?? null,
      water_oz: existing?.water_oz ?? 0,
      updated_at: new Date().toISOString(),
    };

    const keys = phase === "am" ? AM_KEYS : PM_KEYS;
    for (const k of keys) {
      merged[k] = parseField(k, state[k] ?? "");
    }

    const { error } = await supabase
      .from("daily_logs")
      .upsert(merged, { onConflict: "person,day_num" });

    setSaving(false);
    lastSaveAt = Date.now();
    if (!error) {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([10, 40, 10]);
      }
      setShowOverlay(true);
      setEditing(false);
      setTimeout(() => setShowOverlay(false), 1200);
    }
  }

  function startEdit() {
    setEditing(true);
    setShowOverlay(false);
  }

  const keys = phase === "am" ? AM_KEYS : PM_KEYS;
  const isSaved = !editing && hasAnyValue(state);
  const containerBorder = isSaved
    ? "border-2 border-gold/60"
    : "border border-gray-200";

  return (
    <div
      className={`bg-white rounded-lg p-4 mb-3 relative overflow-hidden ${containerBorder}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-navy font-semibold text-sm flex items-center gap-2">
            {PHASE_TITLE[phase]}
            {isSaved && (
              <span
                className="text-[10px] font-bold tracking-widest text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
                aria-label="Saved"
              >
                ✓ SAVED
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {editing ? PHASE_HINT[phase] : "Tap Edit to update."}
          </div>
        </div>
        {isSaved && (
          <button
            onClick={startEdit}
            className="tappable text-xs font-semibold text-navy hover:text-navy-dark underline-offset-2 hover:underline flex-shrink-0"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <FormFields phase={phase} state={state} setState={setState} />
      ) : (
        <SummaryView keys={keys} state={state} phase={phase} />
      )}

      {editing && (
        <button
          onClick={save}
          disabled={saving}
          className="tappable w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
        >
          {saving ? "Saving..." : phase === "am" ? "Save Morning" : "Save Evening"}
        </button>
      )}

      {/* Submitted overlay */}
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center submit-overlay z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center mb-2 mx-auto shadow-lg pop-in">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l5 5 9-11"
                  stroke="#0D2550"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="font-bold text-navy text-lg">Submitted!</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes overlayFade {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes overlayPop {
          0% {
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
          }
        }
        .submit-overlay {
          background: linear-gradient(135deg, rgba(255, 251, 236, 0.97) 0%, rgba(245, 237, 214, 0.97) 100%);
          animation: overlayFade 1.2s ease-in-out forwards;
        }
        .pop-in {
          animation: overlayPop 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

function FormFields({
  phase,
  state,
  setState,
}: {
  phase: CheckInPhase;
  state: Record<string, string>;
  setState: (s: Record<string, string>) => void;
}) {
  if (phase === "am") {
    return (
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field
          label={FIELD_LABEL.weight}
          value={state.weight}
          onChange={(v) => setState({ ...state, weight: v })}
          inputMode="decimal"
          step="0.1"
        />
        <Field
          label={FIELD_LABEL.waist}
          value={state.waist}
          onChange={(v) => setState({ ...state, waist: v })}
          inputMode="decimal"
          step="0.1"
        />
        <Field
          label={FIELD_LABEL.sleep}
          value={state.sleep}
          onChange={(v) => setState({ ...state, sleep: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
        <Field
          label={FIELD_LABEL.energy}
          value={state.energy}
          onChange={(v) => setState({ ...state, energy: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field
          label={FIELD_LABEL.steps}
          value={state.steps}
          onChange={(v) => setState({ ...state, steps: v })}
          inputMode="numeric"
        />
        <Field
          label={FIELD_LABEL.compliance}
          value={state.compliance}
          onChange={(v) => setState({ ...state, compliance: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">
          {FIELD_LABEL.notes}
        </label>
        <textarea
          value={state.notes}
          onChange={(e) => setState({ ...state, notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
      </div>
    </div>
  );
}

function SummaryView({
  keys,
  state,
  phase,
}: {
  keys: readonly FieldKey[];
  state: Record<string, string>;
  phase: CheckInPhase;
}) {
  // For PM, render notes separately as a full-width block at the bottom.
  const metricKeys = keys.filter((k) => k !== "notes") as FieldKey[];
  const showNotes = phase === "pm";
  const noteText = state.notes?.trim() ?? "";

  return (
    <div className="mb-1">
      <dl className="divide-y divide-gray-100 mb-2">
        {metricKeys.map((k) => (
          <div key={k} className="flex items-baseline justify-between py-2">
            <dt className="text-xs uppercase tracking-wider text-navy/60 font-semibold">
              {SUMMARY_LABEL[k]}
            </dt>
            <dd
              className={`text-base font-semibold ${
                state[k]?.trim() ? "text-navy" : "text-gray-300"
              }`}
            >
              {formatValue(k, state[k] ?? "")}
            </dd>
          </div>
        ))}
      </dl>
      {showNotes && (
        <div className="bg-gold-light/40 rounded-md px-3 py-2 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-navy/60 font-semibold mb-1">
            {SUMMARY_LABEL.notes}
          </div>
          {noteText ? (
            <div className="text-sm text-navy whitespace-pre-wrap">{noteText}</div>
          ) : (
            <div className="text-sm text-gray-400 italic">No notes</div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode = "text",
  step,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "text" | "numeric" | "decimal";
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        max={max}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:border-navy focus:outline-none"
      />
    </div>
  );
}
