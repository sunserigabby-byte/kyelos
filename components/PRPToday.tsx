"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { getCurrentPhaseDay, getTotalDays } from "@/lib/phases";
import { gabbyPRP, PRP_PHOTO_DAYS } from "@/lib/prp-plan";
import { gabbyMealSlots } from "@/lib/meal-options";
import DaySelector from "@/components/DaySelector";
import PhaseBanner from "@/components/PhaseBanner";
import WorkoutTracker, { useWorkoutSession } from "@/components/WorkoutTracker";
import MealSelector from "@/components/MealSelector";
import CardioCard from "@/components/CardioCard";
import SingleLegSection from "@/components/SingleLegSection";
import RightLegRehab from "@/components/RightLegRehab";
import PhotoPrompt from "@/components/PhotoPrompt";
import CheckItem from "@/components/CheckItem";

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

      <NSAIDReminder selectedDay={selectedDay} />

      <DayHeader day={day} />

      <DailyMetricsCard person={person} dayNum={selectedDay} isoDate={day.isoDate} />

      <CardioCard dayNum={selectedDay} />

      <WorkoutBlock day={day} selectedDay={selectedDay} />

      <SupplementsCard dayNum={selectedDay} />

      <KneePainCard person={person} dayNum={selectedDay} isoDate={day.isoDate} />

      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3 mt-6">
        Meals
      </div>
      {gabbyMealSlots.map((slot) => (
        <MealSelector key={slot.key} slot={slot} dayNum={selectedDay} />
      ))}
    </div>
  );
}

function DayHeader({ day }: { day: any }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="text-gold text-[10px] font-bold tracking-widest mb-1">
        {day.dayOfWeek.toUpperCase()} · WEEK {day.weekNum}
      </div>
      <div className="text-xl font-bold text-navy">{day.workoutName}</div>
      <div className="text-sm text-navy/70 italic mb-2">{day.focus}</div>
      <p className="text-sm text-gray-700 leading-relaxed">{day.intro}</p>
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
        <span className="font-semibold text-navy">Week {day.weekNum} note:</span> {day.progressionNote}
      </div>
    </div>
  );
}

function WorkoutBlock({ day, selectedDay }: { day: any; selectedDay: number }) {
  const sessionId = useWorkoutSession(selectedDay, day.workoutName, day.isoDate);

  return (
    <>
      {day.swingPrep && (
        <SwingPrepCard exercises={day.swingPrep} sessionId={sessionId} dayNum={selectedDay} />
      )}

      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3 mt-6">
        Workout
      </div>
      {day.exercises.map((ex: any) => (
        <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={selectedDay} />
      ))}

      {day.singleLegLeft && (
        <SingleLegSection exercises={day.singleLegLeft} sessionId={sessionId} dayNum={selectedDay} />
      )}

      {day.rightLegRehab && (
        <RightLegRehab exercises={day.rightLegRehab} sessionId={sessionId} currentDay={selectedDay} unlockDay={8} />
      )}
    </>
  );
}

function SwingPrepCard({ exercises, sessionId, dayNum }: { exercises: any[]; sessionId: string | null; dayNum: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-gold-light/30 border-l-4 border-gold rounded-r-md p-3 mb-3">
      <button onClick={() => setOpen((v) => !v)} className="tappable w-full text-left flex items-center justify-between">
        <div>
          <div className="font-bold text-navy text-sm">🏐 Swing Prep — 5 min</div>
          <div className="text-xs text-navy/70">Mandatory shoulder warm-up before any lifting</div>
        </div>
        <div className="text-navy/40 text-xs">{open ? "▲" : "▼"}</div>
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
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("prp_nsaid_ack")) setDismissed(true);
  }, []);
  if (dismissed) return null;
  if (selectedDay > 28) return null; // First 4 weeks only

  function dismiss() {
    localStorage.setItem("prp_nsaid_ack", "1");
    setDismissed(true);
  }
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mb-3 flex items-start gap-3">
      <div className="text-xl flex-shrink-0">⚠️</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-red-900 text-sm mb-0.5">First 4 weeks: NO ibuprofen / Advil / Naproxen</div>
        <div className="text-xs text-red-800">Tylenol OK. NSAIDs blunt the PRP healing response.</div>
      </div>
      <button onClick={dismiss} className="tappable text-red-700/60 text-xs underline-offset-2 hover:underline flex-shrink-0">
        Got it
      </button>
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
      <div className="text-navy font-bold text-sm mb-3">Today's Targets</div>

      <Bar label="🥩 Protein" current={m.protein_g} target={PROTEIN_TARGET} unit="g">
        <div className="flex gap-1">
          {[20, 30, 40].map((g) => (
            <button key={g} onClick={() => { vibrate(8); save({ protein_g: m.protein_g + g }); }} className="tappable bg-navy text-gold font-semibold py-1 px-2 rounded text-[11px]">+{g}</button>
          ))}
        </div>
      </Bar>

      <Bar label="💧 Water" current={m.water_oz} target={WATER_TARGET} unit="oz">
        <div className="flex gap-1">
          {[8, 12, 16].map((d) => (
            <button key={d} onClick={() => { vibrate(8); save({ water_oz: m.water_oz + d }); }} className="tappable bg-navy text-gold font-semibold py-1 px-2 rounded text-[11px]">+{d}</button>
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
            className="tappable bg-navy text-gold font-semibold py-1 px-2 rounded text-[11px]"
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
        <div className="text-sm font-semibold text-navy">{label}</div>
        <div className="text-xs text-navy"><span className="font-bold">{fmt(current)}</span><span className="text-gray-500"> / {fmt(target)}{unit}</span></div>
      </div>
      <div className="h-2 bg-navy/10 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gold transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function SupplementsCard({ dayNum }: { dayNum: number }) {
  const { person } = useProfile();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-navy font-bold text-sm mb-2">Supplements</div>
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
      <div className="font-bold text-navy text-sm mb-1">Knee Pain (0-10)</div>
      <div className="text-xs text-gray-500 mb-2">0 = no pain, 10 = unbearable</div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            onClick={() => save(n)}
            className={`tappable w-8 h-8 rounded text-xs font-bold ${pain === n ? "bg-navy text-gold" : "bg-white border border-gray-300 text-gray-700"}`}
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
