"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { getCurrentPhaseDay, getTotalDays } from "@/lib/phases";
import { gabbyPRP, PRP_PHOTO_DAYS, PRP_INJECTION_DAYS } from "@/lib/prp-plan";
import { gabbyMealSlots } from "@/lib/meal-options";
import DaySelector from "@/components/DaySelector";
import PhaseBanner from "@/components/PhaseBanner";
import WorkoutTracker, { useWorkoutSession } from "@/components/WorkoutTracker";
import WorkoutList from "@/components/WorkoutList";
import MealSelector from "@/components/MealSelector";
import CardioCard from "@/components/CardioCard";
import RightLegRehab from "@/components/RightLegRehab";
import PhotoPrompt from "@/components/PhotoPrompt";
import CheckItem from "@/components/CheckItem";
import MoneyTodayCard from "@/components/MoneyTodayCard";
import CycleTodayCard from "@/components/CycleTodayCard";
import CollapsibleSection from "@/components/CollapsibleSection";

type DailyMetrics = {
  protein_g: number;
  water_oz: number;
  steps: number;
  collagen_taken: boolean;
  knee_pain: number | null;
};

const EMPTY_METRICS: DailyMetrics = {
  protein_g: 0,
  water_oz: 0,
  steps: 0,
  collagen_taken: false,
  knee_pain: null,
};

const WATER_TARGET = 100;
const PROTEIN_TARGET = 150;
const STEPS_TARGET = 10000;

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
}

export default function PRPToday() {
  const { person } = useProfile();
  const { activePhase } = usePhase();

  const todayDay = activePhase ? getCurrentPhaseDay(activePhase) : 1;
  const totalDays = activePhase ? getTotalDays(activePhase) : 39;
  const [selectedDay, setSelectedDay] = useState(todayDay);

  useEffect(() => {
    setSelectedDay(todayDay);
  }, [todayDay, activePhase?.id]);

  if (!activePhase) return null;
  const day = gabbyPRP[selectedDay - 1] ?? gabbyPRP[0];
  const isDay1Rest = selectedDay === 1;
  const isDay2Rest = selectedDay === 2;
  const isInjectionDay2 = PRP_INJECTION_DAYS.has(selectedDay) && selectedDay !== 1;

  return (
    <div key={`prp-${activePhase.id}-${selectedDay}`}>
      <PhaseBanner phase={activePhase} phaseNumber={3} dayNum={selectedDay} totalDays={totalDays} />

      <DaySelector
        currentDay={todayDay}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        totalDays={totalDays}
      />

      {PRP_PHOTO_DAYS.has(selectedDay) && <PhotoPrompt dayNum={selectedDay} />}

      <MoneyTodayCard />
      <CycleTodayCard />

      <NSAIDReminder selectedDay={selectedDay} />

      {isInjectionDay2 && <InjectionDay2Banner />}

      {isDay1Rest ? (
        <Day1RestBanner />
      ) : isDay2Rest ? (
        <Day2RestBanner />
      ) : (
        <DayHeader day={day} />
      )}

      <DailyMetricsCard person={person} dayNum={selectedDay} isoDate={day.isoDate} />

      <CardioCard dayNum={selectedDay} />

      <WorkoutBlock day={day} selectedDay={selectedDay} />

      <SupplementsCard dayNum={selectedDay} />

      <KneePainCard person={person} dayNum={selectedDay} isoDate={day.isoDate} />

      <MealsBlock dayNum={selectedDay} />
    </div>
  );
}

function MealsBlock({ dayNum }: { dayNum: number }) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const [loggedCount, setLoggedCount] = useState(0);
  const totalSlots = gabbyMealSlots.length;

  useEffect(() => {
    if (!activePhase) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("meal_selections")
        .select("*", { count: "exact", head: true })
        .eq("person", person)
        .eq("phase_id", activePhase.id)
        .eq("day_num", dayNum);
      if (!cancelled) setLoggedCount(count ?? 0);
    })();

    const channel = supabase
      .channel(`meals_done_${person}_${dayNum}_${activePhase.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_selections", filter: `person=eq.${person}` },
        async () => {
          const { count } = await supabase
            .from("meal_selections")
            .select("*", { count: "exact", head: true })
            .eq("person", person)
            .eq("phase_id", activePhase.id)
            .eq("day_num", dayNum);
          setLoggedCount(count ?? 0);
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, activePhase]);

  const done = loggedCount >= totalSlots;
  const doneLabel = done
    ? `${loggedCount}/${totalSlots} logged`
    : `${loggedCount}/${totalSlots} so far`;

  return (
    <CollapsibleSection title="Meals" done={done} doneLabel={doneLabel}>
      {gabbyMealSlots.map((slot) => (
        <MealSelector key={slot.key} slot={slot} dayNum={dayNum} />
      ))}
    </CollapsibleSection>
  );
}

function Day1RestBanner() {
  return (
    <div className="bg-cream-light border-2 border-terracotta rounded-lg p-4 mb-3">
      <div className="text-terracotta text-[10px] font-bold tracking-widest mb-1">
        TUE · WEEK 1 · DAY 1
      </div>
      <div className="text-xl font-bold text-charcoal mb-1">⚕️ Injection Day Rest</div>
      <p className="text-sm text-charcoal/80 leading-relaxed">
        You just had the PRP injection. Stay off your feet, hydrate well, and let
        the joint settle today.
      </p>
      <div className="mt-3 pt-3 border-t border-terracotta/30 text-xs text-charcoal/70 italic">
        Optional gentle upper-body mobility is in the Workout section below — skip
        it entirely if the knee is throbbing. Sleep matters more than mobility tonight.
      </div>
    </div>
  );
}

function Day2RestBanner() {
  return (
    <div className="bg-cream-light border-2 border-terracotta rounded-lg p-4 mb-3">
      <div className="text-terracotta text-[10px] font-bold tracking-widest mb-1">
        WED · WEEK 1 · DAY 2
      </div>
      <div className="text-xl font-bold text-charcoal mb-1">🛌 Bonus Rest Day</div>
      <p className="text-sm text-charcoal/80 leading-relaxed">
        Another rest day to let the joint settle. Workouts begin tomorrow
        (Thursday May 14).
      </p>
      <div className="mt-3 pt-3 border-t border-terracotta/30 text-xs text-charcoal/70 italic">
        Optional gentle upper-body mobility is in the Workout section below if
        you need to move a little.
      </div>
    </div>
  );
}

function InjectionDay2Banner() {
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-3">
      <div className="text-red-700 text-[10px] font-bold tracking-widest mb-1">
        TUE MAY 26 · INJECTION DAY 2
      </div>
      <div className="text-xl font-bold text-charcoal mb-1">
        💉 Second PRP Injection Today
      </div>
      <p className="text-sm text-charcoal/80 leading-relaxed">
        No cycling, no right-leg work. Upper body and left-leg work only through
        Friday May 29. Right-leg rehab and cardio resume Saturday May 30.
      </p>
    </div>
  );
}

function DayHeader({ day }: { day: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="text-terracotta text-[10px] font-bold tracking-widest mb-1">
        {day.dayOfWeek.toUpperCase()} · WEEK {day.weekNum}
      </div>
      <div className="text-xl font-bold text-charcoal">{day.workoutName}</div>
      <div className="text-sm text-charcoal/70 italic mb-2">{day.focus}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{day.intro}</p>
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
        <span className="font-semibold text-charcoal">Week {day.weekNum} note:</span> {day.progressionNote}
      </div>
    </div>
  );
}

function WorkoutBlock({ day, selectedDay }: { day: any; selectedDay: number }) {
  const sessionId = useWorkoutSession(selectedDay, day.workoutName, day.isoDate);

  return (
    <>
      {day.swingPrep && day.swingPrep.length > 0 && (
        <SwingPrepCard exercises={day.swingPrep} sessionId={sessionId} dayNum={selectedDay} />
      )}

      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Workout
      </div>
      <WorkoutList exercises={day.exercises} sessionId={sessionId} dayNum={selectedDay} />

      {day.rightLegRehab && (
        <RightLegRehab exercises={day.rightLegRehab} sessionId={sessionId} currentDay={selectedDay} unlockDay={8} />
      )}
    </>
  );
}

function SwingPrepCard({ exercises, sessionId, dayNum }: { exercises: any[]; sessionId: string | null; dayNum: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-forest-pale/30 border-l-4 border-terracotta rounded-r-md p-3 mb-3">
      <button onClick={() => setOpen((v) => !v)} className="tappable w-full text-left flex items-center justify-between">
        <div>
          <div className="font-bold text-charcoal text-sm">🏐 Swing Prep — 5 min</div>
          <div className="text-xs text-charcoal/70">Mandatory shoulder warm-up before any lifting</div>
        </div>
        <div className="text-charcoal/40 text-xs">{open ? "▲" : "▼"}</div>
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {exercises.map((ex) => (
            <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={dayNum} />
          ))}
        </div>
      )}
    </div>
  );
}

function NSAIDReminder({ selectedDay }: { selectedDay: number }) {
  // Always visible through Week 4 (Day 28) — not dismissible.
  // PRP healing is too important to risk forgetting.
  if (selectedDay > 28) return null;

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mb-3 flex items-start gap-3">
      <div className="text-xl flex-shrink-0">⚠️</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-red-900 text-sm mb-0.5">
          First 4 weeks: NO ibuprofen / Advil / Naproxen
        </div>
        <div className="text-xs text-red-800">
          Tylenol only if needed for pain. NSAIDs blunt the PRP healing response.
        </div>
      </div>
    </div>
  );
}

function DailyMetricsCard({ person, dayNum, isoDate }: { person: "gabby" | "jon"; dayNum: number; isoDate: string }) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [m, setM] = useState<DailyMetrics>(EMPTY_METRICS);
  const [stepsInput, setStepsInput] = useState("");

  useEffect(() => {
    setM(EMPTY_METRICS);
    setStepsInput("");
    if (!phaseId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("protein_g, water_oz, steps, collagen_taken, knee_pain")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("phase_id", phaseId)
        .maybeSingle();
      if (cancelled || !data) return;
      const d = data as any;
      setM({
        protein_g: d.protein_g ?? 0,
        water_oz: d.water_oz ?? 0,
        steps: d.steps ?? 0,
        collagen_taken: !!d.collagen_taken,
        knee_pain: d.knee_pain ?? null,
      });
    })();

    const channel = supabase
      .channel(`prp_metrics_${person}_${dayNum}_${phaseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` }, (p) => {
        const row = p.new as any;
        if (row && row.day_num === dayNum && row.phase_id === phaseId) {
          setM({
            protein_g: row.protein_g ?? 0,
            water_oz: row.water_oz ?? 0,
            steps: row.steps ?? 0,
            collagen_taken: !!row.collagen_taken,
            knee_pain: row.knee_pain ?? null,
          });
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [person, phaseId, dayNum]);

  async function save(patch: Partial<DailyMetrics>) {
    if (!phaseId) return;
    const next = { ...m, ...patch };
    setM(next);
    await supabase.from("daily_logs").upsert({
      person, day_num: dayNum, phase_id: phaseId, date: isoDate,
      protein_g: next.protein_g, water_oz: next.water_oz, steps: next.steps,
      collagen_taken: next.collagen_taken,
      knee_pain: next.knee_pain,
      updated_at: new Date().toISOString(),
    }, { onConflict: "person,day_num,phase_id" });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-3">Today's Targets</div>

      <Bar label="🥩 Protein" current={m.protein_g} target={PROTEIN_TARGET} unit="g">
        <div className="flex gap-1">
          {[20, 30, 40].map((g) => (
            <button key={g} onClick={() => { vibrate(8); save({ protein_g: m.protein_g + g }); }} className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]">+{g}</button>
          ))}
        </div>
      </Bar>

      <Bar label="💧 Water" current={m.water_oz} target={WATER_TARGET} unit="oz">
        <div className="flex gap-1">
          {[8, 12, 16].map((d) => (
            <button key={d} onClick={() => { vibrate(8); save({ water_oz: m.water_oz + d }); }} className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]">+{d}</button>
          ))}
          <button onClick={() => { vibrate(5); save({ water_oz: Math.max(0, m.water_oz - 8) }); }} className="tappable bg-white border border-gray-300 text-gray-600 font-semibold py-1 px-2 rounded text-[11px]">−8</button>
        </div>
      </Bar>

      <Bar label="👟 Steps" current={m.steps} target={STEPS_TARGET} unit="" format={(n) => n.toLocaleString()}>
        <div className="flex gap-1 items-center">
          <input
            type="text"
            inputMode="numeric"
            value={stepsInput}
            onChange={(e) => setStepsInput(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(m.steps)}
            className="w-20 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right"
          />
          <button
            onClick={() => {
              const n = parseInt(stepsInput, 10);
              if (Number.isFinite(n)) { vibrate(8); save({ steps: n }); setStepsInput(""); }
            }}
            className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]"
          >Set</button>
        </div>
      </Bar>

      <button
        onClick={() => { vibrate(8); save({ collagen_taken: !m.collagen_taken }); }}
        className={`tappable w-full mt-2 py-2 rounded text-sm font-semibold ${m.collagen_taken ? "bg-green-50 border border-green-300 text-green-800" : "bg-white border border-gray-300 text-gray-700"}`}
      >
        {m.collagen_taken ? "✓ Collagen taken (15-20g)" : "Collagen 15-20g — mark taken"}
      </button>
    </div>
  );
}

function Bar({ label, current, target, unit, children, format }: { label: string; current: number; target: number; unit: string; children: React.ReactNode; format?: (n: number) => string }) {
  const fmt = format ?? ((n: number) => String(n));
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-semibold text-charcoal">{label}</div>
        <div className="text-xs text-charcoal"><span className="font-bold">{fmt(current)}</span><span className="text-gray-500"> / {fmt(target)}{unit}</span></div>
      </div>
      <div className="h-2 bg-forest/10 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function SupplementsCard({ dayNum }: { dayNum: number }) {
  const { person } = useProfile();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-2">Supplements</div>
      <CheckItem person={person} dayNum={dayNum} itemKey="prp_supp_collagen"   title="Collagen 15-20g" detail="With vitamin C" />
      <CheckItem person={person} dayNum={dayNum} itemKey="prp_supp_creatine"   title="Creatine 5g" />
      <CheckItem person={person} dayNum={dayNum} itemKey="prp_supp_fishoil"    title="Fish oil 2-3g" detail="With dinner" />
      <CheckItem person={person} dayNum={dayNum} itemKey="prp_supp_mag"        title="Magnesium 400mg" detail="PM" />
      <CheckItem person={person} dayNum={dayNum} itemKey="prp_supp_vitd"       title="Vitamin D 5000 IU" />
    </div>
  );
}

function KneePainCard({ person, dayNum, isoDate }: { person: "gabby" | "jon"; dayNum: number; isoDate: string }) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [pain, setPain] = useState<number | null>(null);

  useEffect(() => {
    setPain(null);
    if (!phaseId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("knee_pain")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("phase_id", phaseId)
        .maybeSingle();
      if (!cancelled && data) setPain((data as any).knee_pain ?? null);
    })();
    return () => { cancelled = true; };
  }, [person, phaseId, dayNum]);

  async function save(p: number) {
    setPain(p);
    if (!phaseId) return;
    await supabase.from("daily_logs").upsert({
      person, day_num: dayNum, phase_id: phaseId, date: isoDate,
      knee_pain: p,
      updated_at: new Date().toISOString(),
    }, { onConflict: "person,day_num,phase_id" });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="font-bold text-charcoal text-sm mb-1">Knee Pain (0-10)</div>
      <div className="text-xs text-gray-500 mb-2">0 = no pain, 10 = unbearable</div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            onClick={() => save(n)}
            className={`tappable w-8 h-8 rounded text-xs font-bold ${pain === n ? "bg-forest text-terracotta" : "bg-white border border-gray-300 text-gray-700"}`}
          >{n}</button>
        ))}
      </div>
      {pain !== null && pain >= 5 && (
        <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 text-xs text-amber-900">
          ⚠️ Knee pain at {pain}/10. Consider easing today's volume. Check in with PT if persistent.
        </div>
      )}
    </div>
  );
}
