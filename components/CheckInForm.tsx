"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";

type Props = {
  person: Person;
  dayNum: number;
  isoDate: string;
};

type LogState = {
  weight: string;
  waist: string;
  sleep: string;
  energy: string;
  compliance: string;
  steps: string;
  notes: string;
};

const EMPTY: LogState = {
  weight: "",
  waist: "",
  sleep: "",
  energy: "",
  compliance: "",
  steps: "",
  notes: "",
};

export default function CheckInForm({ person, dayNum, isoDate }: Props) {
  const [state, setState] = useState<LogState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    load();

    const channel = supabase
      .channel(`log_${person}_${dayNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_logs",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row && row.day_num === dayNum && mountedRef.current) {
            // Only update if this isn't a save from our own form
            if (!saving) {
              setState({
                weight: row.weight?.toString() ?? "",
                waist: row.waist?.toString() ?? "",
                sleep: row.sleep?.toString() ?? "",
                energy: row.energy?.toString() ?? "",
                compliance: row.compliance?.toString() ?? "",
                steps: row.steps?.toString() ?? "",
                notes: row.notes ?? "",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person, dayNum]);

  async function load() {
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("person", person)
      .eq("day_num", dayNum)
      .maybeSingle();
    if (!mountedRef.current) return;
    if (data) {
      setState({
        weight: data.weight?.toString() ?? "",
        waist: data.waist?.toString() ?? "",
        sleep: data.sleep?.toString() ?? "",
        energy: data.energy?.toString() ?? "",
        compliance: data.compliance?.toString() ?? "",
        steps: data.steps?.toString() ?? "",
        notes: data.notes ?? "",
      });
    } else {
      setState(EMPTY);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const payload = {
      person,
      day_num: dayNum,
      date: isoDate,
      weight: state.weight ? parseFloat(state.weight) : null,
      waist: state.waist ? parseFloat(state.waist) : null,
      sleep: state.sleep ? parseInt(state.sleep) : null,
      energy: state.energy ? parseInt(state.energy) : null,
      compliance: state.compliance ? parseInt(state.compliance) : null,
      steps: state.steps ? parseInt(state.steps) : null,
      notes: state.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "person,day_num" });
    setSaving(false);
    if (!error) {
      setSaved(true);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([8, 40, 8]);
      }
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field
          label="Weight (AM)"
          value={state.weight}
          onChange={(v) => setState({ ...state, weight: v })}
          inputMode="decimal"
          step="0.1"
        />
        <Field
          label="Waist"
          value={state.waist}
          onChange={(v) => setState({ ...state, waist: v })}
          inputMode="decimal"
          step="0.1"
        />
        <Field
          label="Sleep /10"
          value={state.sleep}
          onChange={(v) => setState({ ...state, sleep: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
        <Field
          label="Energy /10"
          value={state.energy}
          onChange={(v) => setState({ ...state, energy: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
        <Field
          label="Compliance /10"
          value={state.compliance}
          onChange={(v) => setState({ ...state, compliance: v })}
          inputMode="numeric"
          min="1"
          max="10"
        />
        <Field
          label="Steps"
          value={state.steps}
          onChange={(v) => setState({ ...state, steps: v })}
          inputMode="numeric"
        />
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-500 block mb-1">Notes / cravings / mood</label>
        <textarea
          value={state.notes}
          onChange={(e) => setState({ ...state, notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-navy focus:outline-none"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="tappable w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-dark transition disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save Check-In"}
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
