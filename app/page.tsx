"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { getPlan, getCurrentDay } from "@/lib/plan-data";
import CheckItem from "@/components/CheckItem";
import CheckInForm from "@/components/CheckInForm";
import DaySelector from "@/components/DaySelector";
import MealCard from "@/components/MealCard";
import HydrationCard from "@/components/HydrationCard";
import DaySummary from "@/components/DaySummary";
import PartnerNudgeToast from "@/components/PartnerNudgeToast";
import VacationToday from "@/components/VacationToday";
import PRPToday from "@/components/PRPToday";
import TournamentToday from "@/components/TournamentToday";
import { useCycleSettings } from "@/components/useCycleSettings";
import { useMealSwaps } from "@/components/useMealSwaps";
import {
  PHASE_LABEL,
  getCycleDayForDate,
  getCyclePhase,
} from "@/lib/cycle";
import { supabase } from "@/lib/supabase";
import {
  REMINDERS,
  notificationPermissionState,
  requestNotificationPermission,
  scheduleLocalReminder,
  showNotification,
  recentlyDueReminders,
  type NotifSettings,
} from "@/lib/notifications";

export default function TodayPage() {
  const { activePhase, loading } = usePhase();
  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading...</div>;
  }
  if (activePhase?.phase_type === "vacation") {
    return <VacationToday />;
  }
  if (activePhase?.phase_type === "recovery_cut") {
    return <PRPToday />;
  }
  if (activePhase?.phase_type === "tournament_peak") {
    return <TournamentToday />;
  }
  return <CutTodayPage />;
}

function CutTodayPage() {
  const { person } = useProfile();
  const plan = getPlan(person);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const { settings: cycleSettings } = useCycleSettings(person);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [recentlyDueText, setRecentlyDueText] = useState<string | null>(null);
  const scheduledIds = useRef<number[]>([]);

  useEffect(() => {
    const d = getCurrentDay();
    setCurrentDay(d);
    setSelectedDay(d);
  }, []);

  // First-visit notification permission banner
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (notificationPermissionState() !== "default") return;
    if (localStorage.getItem("cut_tracker_notif_ack")) return;
    setShowNotifBanner(true);
  }, []);

  // Schedule local reminders (and surface any missed-by-30-min ones).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function setup() {
      // Clear any previously-scheduled timeouts
      scheduledIds.current.forEach((id) => clearTimeout(id));
      scheduledIds.current = [];

      const { data } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("person", person)
        .maybeSingle();
      if (cancelled || !data) return;

      const enabled = data as unknown as NotifSettings;
      if (notificationPermissionState() === "granted") {
        for (const r of REMINDERS) {
          if (!enabled[r.key]) continue;
          const id = scheduleLocalReminder(r.hour, r.minute, r.title, r.body);
          if (id) scheduledIds.current.push(id);
        }
      }

      // Show a banner for any reminders that fired in the last 30 minutes
      // (e.g. user opened the app late). Only the most recent one.
      const due = recentlyDueReminders(enabled);
      if (due.length > 0) {
        const last = due[due.length - 1];
        setRecentlyDueText(`${last.title} — ${last.body}`);
      }
    }

    setup();

    return () => {
      cancelled = true;
      scheduledIds.current.forEach((id) => clearTimeout(id));
      scheduledIds.current = [];
    };
  }, [person]);

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    localStorage.setItem("cut_tracker_notif_ack", ok ? "granted" : "denied");
    setShowNotifBanner(false);
    if (ok) {
      showNotification("Reminders on ✓", "You'll see daily nudges while the app is open.");
    }
  }

  function dismissBanner() {
    localStorage.setItem("cut_tracker_notif_ack", "dismissed");
    setShowNotifBanner(false);
  }

  const day = plan[selectedDay - 1];
  const { swaps: mealSwaps } = useMealSwaps(person, selectedDay);
  if (!day) return null;

  let cycleBadge: { cycleDay: number; phaseLabel: string } | null = null;
  if (person === "gabby" && cycleSettings) {
    const cd = getCycleDayForDate(cycleSettings.last_period_start, day.isoDate);
    const phase = getCyclePhase(cd, cycleSettings.cycle_length);
    cycleBadge = { cycleDay: cd, phaseLabel: PHASE_LABEL[phase] };
  }

  return (
    <div>
      <PartnerNudgeToast person={person} />

      {showNotifBanner && (
        <div className="bg-gold-light border-2 border-gold rounded-lg p-3 mb-3 flex items-center gap-3">
          <div className="flex-1 text-sm text-navy">
            <div className="font-semibold mb-0.5">Want reminders?</div>
            <div className="text-xs text-navy/70">
              Coffee, cardio, tea, workout, wind-down.
            </div>
          </div>
          <button
            onClick={enableNotifications}
            className="tappable bg-navy text-gold font-semibold py-2 px-3 rounded-md text-xs flex-shrink-0"
          >
            Enable
          </button>
          <button
            onClick={dismissBanner}
            className="tappable text-navy/50 text-xs underline-offset-2 hover:underline flex-shrink-0"
          >
            Not now
          </button>
        </div>
      )}

      {recentlyDueText && (
        <div className="bg-navy text-white border-2 border-gold rounded-lg p-3 mb-3 flex items-start justify-between gap-2">
          <div className="text-sm">
            <div className="text-[10px] tracking-widest text-gold font-bold mb-0.5">
              REMINDER
            </div>
            <div>{recentlyDueText}</div>
          </div>
          <button
            onClick={() => setRecentlyDueText(null)}
            className="tappable text-white/60 text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <DaySummary person={person} plan={plan} selectedDay={selectedDay} />

      <DaySelector currentDay={currentDay} selectedDay={selectedDay} onSelect={setSelectedDay} />

      {/* Day banner */}
      <div className="bg-navy text-white rounded-lg p-5 mb-2 border-t-4 border-b-4 border-gold">
        <div className="text-gold text-xs font-bold tracking-widest mb-1">
          DAY {day.day}  •  {day.date.toUpperCase()}
        </div>
        <div className="text-2xl font-bold mb-1">{day.title}</div>
        <div className="text-white/70 text-sm italic">{day.phase}</div>
      </div>

      {cycleBadge && (
        <div className="text-xs font-semibold tracking-wide mb-4 ml-1" style={{ color: "#A88A3F" }}>
          Cycle Day {cycleBadge.cycleDay} · {cycleBadge.phaseLabel}
        </div>
      )}

      {/*
        Day-scoped UI is wrapped in a keyed div so React fully unmounts and
        remounts everything inside whenever person or selected day changes.
        That guarantees CheckItems / HydrationCard / CheckInForm start with
        fresh useState values rather than briefly flashing the previous
        day's data while the new fetch is in flight.
      */}
      <div key={`${person}-${day.day}`}>
        {/* Focus */}
        <Section title="Today's Focus">
          <p className="text-sm text-gray-700 leading-relaxed">{day.focus}</p>
        </Section>

        {/* Peak adjustments */}
        {day.peakAdjustments && (
          <Section title="Peak Week Adjustments">
            <ul className="text-sm text-gray-700 space-y-1">
              {day.peakAdjustments.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* AM Cardio */}
        <Section title="AM Cardio">
          <CheckItem
            person={person}
            dayNum={day.day}
            itemKey="am_cardio"
            title="AM Cardio Complete"
            detail={day.amCardio}
          />
        </Section>

        {/* Hydration */}
        <Section title="Hydration">
          <HydrationCard
            person={person}
            dayNum={day.day}
            isoDate={day.isoDate}
            totalDays={plan.length}
          />
        </Section>

        {/* Meals */}
        <Section title="Meals">
          {day.meals.map((m) => (
            <MealCard
              key={m.key}
              person={person}
              dayNum={day.day}
              meal={m}
              swap={mealSwaps[m.key]}
              currentDay={currentDay}
              maxDay={plan.length}
            />
          ))}
        </Section>

        {/* Supplements */}
        <Section title="Supplements & Tea">
          {day.supplements.map((s) => (
            <CheckItem
              key={s.key}
              person={person}
              dayNum={day.day}
              itemKey={s.key}
              title={s.time}
              detail={s.item}
            />
          ))}
        </Section>

        {/* Workout */}
        <Section title="PM Workout">
          {day.workout.circuitIntro && (
            <p className="text-sm text-gray-700 mb-3 font-medium">{day.workout.circuitIntro}</p>
          )}
          {day.workout.circuit && (
            <ul className="text-sm text-gray-700 space-y-1 mb-3 pl-4">
              {day.workout.circuit.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          )}
          {day.workout.exercises && (
            <div className="space-y-2 mb-3">
              {day.workout.exercises.map((ex, i) => (
                <div key={i} className="bg-navy-light rounded p-3">
                  <div className="font-semibold text-navy text-sm">{ex.name}</div>
                  <div className="text-sm text-gray-700 mt-1">{ex.prescription}</div>
                </div>
              ))}
            </div>
          )}
          <CheckItem
            person={person}
            dayNum={day.day}
            itemKey="workout_complete"
            title="Workout Complete ✓"
          />
        </Section>

        {/* Check-in — split into AM and PM cards. Each save merges with
            the existing daily_logs row so neither phase nulls the other's
            fields, and HydrationCard's water_oz is also preserved. */}
        <Section title="Daily Check-In">
          <CheckInForm
            person={person}
            dayNum={day.day}
            isoDate={day.isoDate}
            phase="am"
          />
          <CheckInForm
            person={person}
            dayNum={day.day}
            isoDate={day.isoDate}
            phase="pm"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}
