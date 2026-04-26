"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileContext";
import { useCycleSettings } from "@/components/useCycleSettings";
import {
  PHASE_GUIDANCE,
  PHASE_LABEL,
  daysUntilPeriod,
  getCycleDay,
  getCyclePhase,
} from "@/lib/cycle";
import { supabase } from "@/lib/supabase";

export default function CyclePage() {
  const { person } = useProfile();
  const router = useRouter();
  const { settings, loading, refresh } = useCycleSettings(person);

  // Hide entirely for Jon — bounce to home
  useEffect(() => {
    if (person === "jon") router.replace("/");
  }, [person, router]);

  if (person !== "gabby") return null;
  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  if (!settings) {
    return <SettingsForm initial={null} onSaved={refresh} />;
  }

  const today = new Date();
  const cycleDay = getCycleDay(settings.last_period_start, today);
  const phase = getCyclePhase(cycleDay, settings.cycle_length);
  const daysToPeriod = daysUntilPeriod(
    settings.last_period_start,
    settings.cycle_length,
    today
  );

  return (
    <div>
      {/* Hero card */}
      <div className="bg-navy text-white rounded-lg p-5 mb-4 border-t-4 border-b-4 border-gold">
        <div className="text-gold text-xs font-bold tracking-widest mb-1">
          CYCLE DAY {cycleDay} OF {settings.cycle_length}
        </div>
        <div className="text-2xl font-bold mb-1">{PHASE_LABEL[phase]}</div>
        <div className="text-white/70 text-sm italic">
          {daysToPeriod >= 1
            ? `${daysToPeriod} day${daysToPeriod === 1 ? "" : "s"} until next period`
            : daysToPeriod === 0
            ? "Period expected today"
            : `Period overdue by ${Math.abs(daysToPeriod)} day${Math.abs(daysToPeriod) === 1 ? "" : "s"}`}
        </div>
      </div>

      {/* Guidance */}
      <div className="mb-6">
        <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
          What this means today
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {PHASE_GUIDANCE[phase]}
          </p>
        </div>
      </div>

      {/* Settings */}
      <SettingsForm initial={settings} onSaved={refresh} />
    </div>
  );
}

function SettingsForm({
  initial,
  onSaved,
}: {
  initial: { last_period_start: string; cycle_length: number } | null;
  onSaved: () => void;
}) {
  const [lastPeriod, setLastPeriod] = useState(
    initial?.last_period_start ?? ""
  );
  const [cycleLength, setCycleLength] = useState(
    initial?.cycle_length?.toString() ?? "28"
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const length = parseInt(cycleLength, 10);
    if (!lastPeriod) {
      setError("Pick a last period start date.");
      return;
    }
    if (isNaN(length) || length < 21 || length > 45) {
      setError("Cycle length must be between 21 and 45 days.");
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase
      .from("cycle_settings")
      .upsert(
        {
          person: "gabby",
          last_period_start: lastPeriod,
          cycle_length: length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "person" }
      );
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setSavedAt(Date.now());
    onSaved();
    setTimeout(() => setSavedAt(null), 2000);
  }

  return (
    <div>
      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
        Settings
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-navy/70 uppercase tracking-wider mb-1">
            Last period start
          </label>
          <input
            type="date"
            value={lastPeriod}
            onChange={(e) => setLastPeriod(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-base text-navy focus:outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy/70 uppercase tracking-wider mb-1">
            Cycle length (days)
          </label>
          <input
            type="number"
            min={21}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-base text-navy focus:outline-none focus:border-gold"
          />
          <p className="text-xs text-gray-500 mt-1">
            Average is 28. Range 21–45.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="tappable w-full bg-navy text-gold font-semibold py-3 rounded-md disabled:opacity-50"
        >
          {saving ? "Saving..." : savedAt ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
