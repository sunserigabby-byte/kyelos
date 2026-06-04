"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import {
  notificationPermissionState,
  requestNotificationPermission,
} from "@/lib/notifications";

type Settings = {
  wake_supps: boolean;
  am_cardio: boolean;
  tea_2pm: boolean;
  pm_workout: boolean;
  wind_down: boolean;
  partner_cardio: boolean;
  partner_workout: boolean;
  partner_meals: boolean;
  partner_supps: boolean;
  weekly_transfer: boolean;
  weekly_transfer_day: number;
  weekly_transfer_hour: number;
};

const DEFAULTS: Settings = {
  wake_supps: true,
  am_cardio: true,
  tea_2pm: true,
  pm_workout: true,
  wind_down: true,
  partner_cardio: true,
  partner_workout: true,
  partner_meals: false,
  partner_supps: false,
  weekly_transfer: false,
  weekly_transfer_day: 1,
  weekly_transfer_hour: 9,
};

const DOW_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type BoolKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

const REMINDER_LABELS: { key: BoolKey; label: string; sub: string }[] = [
  { key: "wake_supps", label: "5:30 AM — Wake up", sub: "Coffee + electrolytes" },
  { key: "am_cardio", label: "6:00 AM — Cardio", sub: "Fasted incline walk" },
  { key: "tea_2pm", label: "2:00 PM — Tea break", sub: "Dandelion cup 1" },
  { key: "pm_workout", label: "4:00 PM — Pre-workout", sub: "Workout in 30 min" },
  { key: "wind_down", label: "9:30 PM — Wind down", sub: "Magnesium + tea" },
];

const PARTNER_LABELS: { key: BoolKey; label: string; sub: string }[] = [
  { key: "partner_cardio", label: "Partner finished cardio", sub: "Notify me when they walk" },
  { key: "partner_workout", label: "Partner finished workout", sub: "Notify on workout complete" },
  { key: "partner_meals", label: "Partner is on track with meals", sub: "Fires once per day on meal 2" },
  { key: "partner_supps", label: "Partner took evening supps", sub: "Late-day check-in" },
];

export default function SettingsPage() {
  const { person } = useProfile();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [permission, setPermission] = useState<string>("default");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setPermission(notificationPermissionState());
    let mounted = true;
    supabase
      .from("notification_settings")
      .select("*")
      .eq("person", person)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) {
          setSettings({
            wake_supps: data.wake_supps ?? true,
            am_cardio: data.am_cardio ?? true,
            tea_2pm: data.tea_2pm ?? true,
            pm_workout: data.pm_workout ?? true,
            wind_down: data.wind_down ?? true,
            partner_cardio: data.partner_cardio ?? true,
            partner_workout: data.partner_workout ?? true,
            partner_meals: data.partner_meals ?? false,
            partner_supps: data.partner_supps ?? false,
            weekly_transfer: data.weekly_transfer ?? false,
            weekly_transfer_day: data.weekly_transfer_day ?? 1,
            weekly_transfer_hour: data.weekly_transfer_hour ?? 9,
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [person]);

  async function toggle(key: keyof Settings) {
    const current = settings[key];
    if (typeof current !== "boolean") return;
    const next = { ...settings, [key]: !current };
    setSettings(next);
    setSavingKey(key);
    await supabase
      .from("notification_settings")
      .upsert(
        { person, ...next, updated_at: new Date().toISOString() },
        { onConflict: "person" }
      );
    setSavingKey(null);
  }

  async function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await supabase
      .from("notification_settings")
      .upsert(
        { person, ...next, updated_at: new Date().toISOString() },
        { onConflict: "person" }
      );
  }

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    setPermission(notificationPermissionState());
    if (ok) localStorage.setItem("cut_tracker_notif_ack", "granted");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Reminders fire while the app is open. Partner nudges sync via the database.
      </p>

      {/* Permission */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="font-semibold text-charcoal mb-1">Browser notifications</div>
        <div className="text-sm text-gray-600 mb-3">
          Status:{" "}
          <span className="font-semibold">
            {permission === "granted"
              ? "Allowed"
              : permission === "denied"
              ? "Blocked (change in browser settings)"
              : permission === "unsupported"
              ? "Not supported in this browser"
              : "Not requested"}
          </span>
        </div>
        {permission === "default" && (
          <button
            onClick={enableNotifications}
            className="tappable bg-forest text-terracotta font-semibold py-2.5 px-5 rounded-md text-sm"
          >
            Enable notifications
          </button>
        )}
      </div>

      {/* Personal reminders */}
      <Section title="Daily Reminders">
        {REMINDER_LABELS.map((r) => (
          <ToggleRow
            key={r.key}
            label={r.label}
            sub={r.sub}
            checked={settings[r.key]}
            saving={savingKey === r.key}
            onChange={() => toggle(r.key)}
          />
        ))}
      </Section>

      {/* Partner nudges */}
      <Section title="Partner Nudges">
        {PARTNER_LABELS.map((r) => (
          <ToggleRow
            key={r.key}
            label={r.label}
            sub={r.sub}
            checked={settings[r.key]}
            saving={savingKey === r.key}
            onChange={() => toggle(r.key)}
          />
        ))}
      </Section>

      {/* Goals */}
      <Section title="Goals">
        <ToggleRow
          label="Weekly transfer reminder"
          sub={`Every ${DOW_OPTIONS.find((o) => o.value === settings.weekly_transfer_day)?.label} at ${formatHour(settings.weekly_transfer_hour)}`}
          checked={settings.weekly_transfer}
          saving={savingKey === "weekly_transfer"}
          onChange={() => toggle("weekly_transfer")}
        />
        {settings.weekly_transfer && (
          <div className="p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-semibold text-charcoal/70 mb-1">Day</div>
                <select
                  value={settings.weekly_transfer_day}
                  onChange={(e) => setField("weekly_transfer_day", Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  {DOW_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-charcoal/70 mb-1">Hour</div>
                <select
                  value={settings.weekly_transfer_hour}
                  onChange={(e) => setField("weekly_transfer_hour", Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:00 ${ampm}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
        {title}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  saving,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  saving: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={saving}
      className="tappable w-full flex items-center justify-between p-3 hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="text-left">
        <div className="text-sm font-semibold text-charcoal">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
      <div
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-forest" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}
