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
};

const REMINDER_LABELS: { key: keyof Settings; label: string; sub: string }[] = [
  { key: "wake_supps", label: "5:30 AM — Wake up", sub: "Coffee + electrolytes" },
  { key: "am_cardio", label: "6:00 AM — Cardio", sub: "Fasted incline walk" },
  { key: "tea_2pm", label: "2:00 PM — Tea break", sub: "Dandelion cup 1" },
  { key: "pm_workout", label: "4:00 PM — Pre-workout", sub: "Workout in 30 min" },
  { key: "wind_down", label: "9:30 PM — Wind down", sub: "Magnesium + tea" },
];

const PARTNER_LABELS: { key: keyof Settings; label: string; sub: string }[] = [
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
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [person]);

  async function toggle(key: keyof Settings) {
    const next = { ...settings, [key]: !settings[key] };
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
    </div>
  );
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
