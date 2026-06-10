"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { useWorkoutSession } from "@/components/WorkoutTracker";
import WorkoutList from "@/components/WorkoutList";
import {
  dayKindForISO,
  dayKindLabel,
  workoutForISO,
  type DayKind,
} from "@/lib/upper-body-program";
import {
  todayLocalISO,
  displayShort,
  displayLong,
  daysSince,
} from "@/lib/local-date";
import { markWorkoutComplete } from "@/lib/workout-queue";

// Phase-wide day scroller. Auto-selects today's day, can scroll forward to
// preview upcoming workouts, can scroll back to view past. Each day renders
// content based on its day-of-week schedule:
//   - Upper Body days: full exercise list with set tracker and Mark Complete.
//   - THP Lower days: short placeholder + "Mark complete" checkbox.
//   - Court / Rest: contextual note.
export default function PhaseWorkoutSchedule() {
  const { activePhase } = usePhase();
  const [todayISO, setTodayISO] = useState<string>(() => todayLocalISO());

  // Re-evaluate today's date when the tab regains focus or at midnight.
  useEffect(() => {
    const onFocus = () => setTodayISO(todayLocalISO());
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const id = setInterval(onFocus, 60_000); // every minute
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(id);
    };
  }, []);

  const todayDayN = activePhase ? Math.max(1, daysSince(activePhase.start_date)) : 1;
  const [selectedDay, setSelectedDay] = useState<number>(todayDayN);

  // When today changes (e.g. midnight tick), nudge the selected day forward
  // unless the user is actively viewing a different day.
  useEffect(() => {
    setSelectedDay((prev) => (prev === todayDayN - 1 ? todayDayN : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDayN]);

  const totalDays = useMemo(() => {
    if (!activePhase) return 0;
    const [sy, sm, sd] = activePhase.start_date.split("-").map(Number);
    const [ey, em, ed] = activePhase.end_date.split("-").map(Number);
    const startMs = Date.UTC(sy, sm - 1, sd);
    const endMs = Date.UTC(ey, em - 1, ed);
    return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  }, [activePhase]);

  if (!activePhase) return null;

  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  const selectedISO = isoForPhaseDay(activePhase.start_date, selectedDay);

  return (
    <div className="mb-3">
      <DayScroller
        days={allDays}
        selectedDay={selectedDay}
        todayDayN={todayDayN}
        phaseStartISO={activePhase.start_date}
        onSelect={setSelectedDay}
      />

      <DayDetail
        dayNum={selectedDay}
        isoDate={selectedISO}
        isToday={selectedDay === todayDayN}
        totalDays={totalDays}
      />
    </div>
  );
}

// =============================================================
// Horizontal day scroller — compact cells with icon + day number.
// =============================================================
function DayScroller({
  days,
  selectedDay,
  todayDayN,
  phaseStartISO,
  onSelect,
}: {
  days: number[];
  selectedDay: number;
  todayDayN: number;
  phaseStartISO: string;
  onSelect: (n: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll the selected day into view when it changes.
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedDay]);

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs font-bold tracking-widest text-charcoal/60 uppercase">
          Day-by-day
        </div>
        <button
          onClick={() => onSelect(todayDayN)}
          className="tappable text-[11px] text-terracotta font-semibold hover:underline"
        >
          Today →
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth no-scrollbar"
      >
        {days.map((d) => {
          const iso = isoForPhaseDay(phaseStartISO, d);
          const kind = dayKindForISO(iso);
          const label = dayKindLabel(kind);
          const isSelected = d === selectedDay;
          const isToday = d === todayDayN;
          return (
            <button
              key={d}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelect(d)}
              className={`tappable flex-shrink-0 w-14 rounded-lg border p-1.5 text-center transition ${
                isSelected
                  ? "bg-forest text-cream border-forest"
                  : isToday
                  ? "bg-cream/40 border-terracotta text-charcoal"
                  : "bg-white border-gray-200 text-charcoal"
              }`}
            >
              <div className="text-[10px] font-bold tracking-widest opacity-70">
                {isToday ? "TODAY" : `D${d}`}
              </div>
              <div className="text-lg leading-tight">{label.icon}</div>
              <div className={`text-[10px] font-semibold ${isSelected ? "text-cream/90" : "text-charcoal/70"}`}>
                {label.short}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
// Detail of the selected day.
// =============================================================
function DayDetail({
  dayNum,
  isoDate,
  isToday,
  totalDays,
}: {
  dayNum: number;
  isoDate: string;
  isToday: boolean;
  totalDays: number;
}) {
  const kind = dayKindForISO(isoDate);
  const label = dayKindLabel(kind);
  const workout = workoutForISO(isoDate);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="text-[10px] font-bold tracking-widest text-charcoal/60">
            {isToday ? "TODAY · " : ""}DAY {dayNum} OF {totalDays}
          </div>
          <div className="text-[11px] text-charcoal/60">{displayLong(isoDate)}</div>
        </div>
        <div className="text-base font-bold text-charcoal flex items-center gap-2">
          <span className="text-xl">{label.icon}</span>
          <span>{label.long}</span>
        </div>
      </div>

      {kind.type === "upper" && workout && (
        <UpperBodyDetail dayNum={dayNum} isoDate={isoDate} workoutKey={kind.workoutKey} />
      )}

      {kind.type === "thp_lower" && (
        <THPPlaceholder dayNum={dayNum} isoDate={isoDate} />
      )}

      {kind.type === "court" && (
        <ContextNote
          icon="🏐"
          title="Court / Practice day"
          body="Get on the court. Practice swings, serves, transitions. Treat warm-ups as the activation circuit if it's your only movement today."
        />
      )}

      {kind.type === "rest" && (
        <ContextNote
          icon="😴"
          title="Rest day"
          body="Full recovery. Daily activation circuit only if you feel like it. Sleep and food do the work today."
        />
      )}
    </div>
  );
}

// =============================================================
// Upper body day — full workout with Mark Complete.
// =============================================================
function UpperBodyDetail({
  dayNum,
  isoDate,
  workoutKey,
}: {
  dayNum: number;
  isoDate: string;
  workoutKey: "push" | "pull_midtrap" | "swing_power";
}) {
  const workout = workoutForISO(isoDate);
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const sessionId = useWorkoutSession(dayNum, workout?.name ?? "", isoDate);
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!activePhase) return;
    const { data } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("person", person)
      .eq("phase_id", activePhase.id)
      .eq("day_num", dayNum)
      .maybeSingle();
    if (data) setCompleted(!!(data as { completed: boolean | null }).completed);
    setLoaded(true);
  }, [person, activePhase, dayNum]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activePhase) return;
    const channel = supabase
      .channel(`upper_detail_${activePhase.id}_${dayNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workout_sessions",
          filter: `phase_id=eq.${activePhase.id}`,
        },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePhase, dayNum, refresh]);

  async function toggle() {
    if (!activePhase || !workout) return;
    setSaving(true);
    await markWorkoutComplete({
      person,
      phaseId: activePhase.id,
      dayNum,
      workoutName: workout.name,
      workoutDate: isoDate,
      completed: !completed,
    });
    setSaving(false);
  }

  if (!workout) return null;

  return (
    <div>
      <div
        className={`rounded-lg p-3 mb-3 border ${
          completed ? "bg-emerald-50 border-emerald-300" : "bg-cream/40 border-gray-200"
        }`}
      >
        <div className="text-xs font-bold text-charcoal mb-0.5">{workout.focus}</div>
        <p className="text-xs text-charcoal/80 leading-relaxed">{workout.intro}</p>
      </div>

      <button
        onClick={toggle}
        disabled={!loaded || saving || !activePhase}
        className={`tappable w-full font-bold py-2.5 rounded-md text-sm mb-3 transition disabled:opacity-50 ${
          completed ? "bg-white border border-gray-300 text-charcoal" : "bg-emerald-600 text-white"
        }`}
      >
        {saving ? "Saving…" : completed ? "✓ Marked complete · tap to re-open" : "✓ Mark workout complete"}
      </button>

      <WorkoutList exercises={workout.exercises} sessionId={sessionId} dayNum={dayNum} />

      <button
        onClick={toggle}
        disabled={!loaded || saving || !activePhase}
        className={`tappable w-full font-bold py-2.5 rounded-md text-sm mt-4 transition disabled:opacity-50 ${
          completed ? "bg-white border border-gray-300 text-charcoal" : "bg-emerald-600 text-white"
        }`}
      >
        {saving ? "Saving…" : completed ? "Re-open this workout" : "✓ Mark workout complete"}
      </button>
    </div>
  );
}

// =============================================================
// THP day — checkbox placeholder.
// =============================================================
function THPPlaceholder({ dayNum, isoDate }: { dayNum: number; isoDate: string }) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!activePhase) return;
    const { data } = await supabase
      .from("workout_sessions")
      .select("completed")
      .eq("person", person)
      .eq("phase_id", activePhase.id)
      .eq("day_num", dayNum)
      .maybeSingle();
    if (data) setCompleted(!!(data as { completed: boolean | null }).completed);
    setLoaded(true);
  }, [person, activePhase, dayNum]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activePhase) return;
    const channel = supabase
      .channel(`thp_${activePhase.id}_${dayNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workout_sessions",
          filter: `phase_id=eq.${activePhase.id}`,
        },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePhase, dayNum, refresh]);

  async function toggle() {
    if (!activePhase) return;
    await markWorkoutComplete({
      person,
      phaseId: activePhase.id,
      dayNum,
      workoutName: "THP Lower Body",
      workoutDate: isoDate,
      completed: !completed,
    });
  }

  return (
    <div
      className={`rounded-lg p-4 border ${
        completed ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="text-base font-bold text-charcoal mb-1">🏋️ THP Lower Body</div>
      <p className="text-sm text-charcoal/70 leading-relaxed mb-3">
        Programmed by THP. Pull up the session in their app, run it, then log it here.
      </p>
      <button
        onClick={toggle}
        disabled={!loaded || !activePhase}
        className={`tappable w-full font-bold py-2.5 rounded-md text-sm ${
          completed ? "bg-white border border-gray-300 text-charcoal" : "bg-forest text-terracotta"
        }`}
      >
        {completed ? "✓ THP session marked complete" : "Mark THP session complete"}
      </button>
    </div>
  );
}

function ContextNote({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-base font-bold text-charcoal mb-1">
        {icon} {title}
      </div>
      <p className="text-sm text-charcoal/70 leading-relaxed">{body}</p>
    </div>
  );
}

function isoForPhaseDay(startISO: string, dayN: number): string {
  const [y, m, d] = startISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dayN - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
