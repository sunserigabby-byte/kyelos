"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { todayLocalISO } from "@/lib/local-date";
import { getLatestWeight, logWeight } from "@/lib/weight-log";

type Props = {
  onSaved: () => void;
  onCancel: () => void;
  /** When true, renders inline content (no overlay) — for use inside the FAB sheet. */
  inline?: boolean;
};

export default function WeightLogModal({ onSaved, onCancel, inline }: Props) {
  const { person } = useProfile();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [latestHint, setLatestHint] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const latest = await getLatestWeight(person);
      if (latest) setLatestHint(`Last: ${latest.weight.toFixed(1)} lb on ${latest.date}`);
    })();
  }, [person]);

  async function submit() {
    const n = parseFloat(weight);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter a weight greater than 0.");
      return;
    }
    setSaving(true);
    const res = await logWeight({ person, weight: n, date });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  const body = (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-base font-bold text-charcoal">Log weight</div>
        {inline ? (
          <button onClick={onCancel} className="text-charcoal/50 text-sm">Back</button>
        ) : (
          <button onClick={onCancel} className="text-charcoal/50 text-lg" aria-label="Close">✕</button>
        )}
      </div>
      <div className="text-[11px] text-charcoal/60 mb-3">
        {latestHint ?? "First weight entry — sets the trend baseline."}
      </div>

      <Label>Weight (lb)</Label>
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        value={weight}
        onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="0.0"
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      <Label>Date</Label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm mb-3"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded p-2 mb-3">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving || !weight}
        className="tappable w-full bg-forest text-terracotta font-semibold py-2.5 rounded-md text-sm disabled:opacity-50"
      >
        {saving ? "Saving…" : "Log it"}
      </button>
    </>
  );

  if (inline) return body;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div className="bg-white rounded-2xl p-4 w-full max-w-md fade-in" onClick={(e) => e.stopPropagation()}>
        {body}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-charcoal mb-1">{children}</div>;
}
