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

// AM and PM each own their own form fields; a save in one phase reads the
// existing row first so the other phase's fields are never overwritten.
const AM_KEYS = ["weight", "waist", "sleep", "energy"] as const;
const PM_KEYS = ["steps", "compliance", "notes"] as const;
type AmKey = (typeof AM_KEYS)[number];
type PmKey = (typeof PM_KEYS)[number];

const FIELD_LABEL: Record<AmKey | PmKey, string> = {
  weight: "Weight (AM)",
  waist: "Waist",
  sleep: "Sleep /10",
  energy: "Energy /10",
  steps: "Steps",
  compliance: "Compliance /10",
  notes: "Notes / cravings / mood",
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

function parseField(key: AmKey | PmKey, raw: string): number | string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (key === "notes") return trimmed;
  if (key === "weight" || key === "waist") {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  // sleep, energy, compliance, steps -> int
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export default function CheckInForm({ person, dayNum, isoDate, phase }: Props) {
  const [state, setState] = useState<Record<string, string>>(() => emptyState(phase));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setState(emptyState(phase));
    setSaved(false);

    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("person", person)
        .eq("day_num", dayNum)
        .maybeSingle();
      if (cancelled) return;
      setState(data ? rowToState(data, phase) : emptyState(phase));
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
            setState(rowToState(row, phase));
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
    setSaved(false);

    // Read the existing row so we can merge — saving AM must never null PM
    // fields (or vice versa), and water_oz from HydrationCard must survive.
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
      // Preserve every existing field; phase-specific fields are overwritten below.
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
    // Refresh the timestamp once more so the realtime echo from this very
    // upsert (which arrives a moment after the request resolves) is also
    // inside the ignore window.
    lastSaveAt = Date.now();
    if (!error) {
      setSaved(true);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([8, 40, 8]);
      }
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const buttonLabel = saving
    ? "Saving..."
    : saved
    ? "✓ Saved"
    : phase === "am"
    ? "Save Morning"
    : "Save Evening";

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
      <div className="mb-3">
        <div className="text-navy font-semibold text-sm">{PHASE_TITLE[phase]}</div>
        <div className="text-xs text-gray-500">{PHASE_HINT[phase]}</div>
      </div>

      {phase === "am" ? (
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
      ) : (
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
      )}

      <button
        onClick={save}
        disabled={saving}
        className="tappable w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
      >
        {buttonLabel}
      </button>
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
