"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { gabbyMealSlots } from "@/lib/meal-options";
import TodayBadge from "@/components/TodayBadge";
import MoneyTodayCard from "@/components/MoneyTodayCard";
import CycleTodayCard from "@/components/CycleTodayCard";
import ActivePhaseBanner from "@/components/ActivePhaseBanner";
import MilestoneCard from "@/components/MilestoneCard";
import LongRangeGoalsCard from "@/components/LongRangeGoalsCard";
import PhaseWorkoutSchedule from "@/components/PhaseWorkoutSchedule";
import CardioCard from "@/components/CardioCard";
import DailyActivationCard from "@/components/DailyActivationCard";
import CheckItem from "@/components/CheckItem";
import MealSelector from "@/components/MealSelector";
import CollapsibleSection from "@/components/CollapsibleSection";
import { getCurrentPhaseDay } from "@/lib/phases";

type DailyMetrics = {
  protein_g: number;
  water_oz: number;
  steps: number;
};

const EMPTY: DailyMetrics = { protein_g: 0, water_oz: 0, steps: 0 };
const PROTEIN_TARGET = 150;
const WATER_TARGET = 100;
const STEPS_TARGET = 10000;

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
}

// Today screen for phase_type='training_plan' (the new 6-phase plan).
// Layout: ActivePhaseBanner → MilestoneCard → LongRangeGoalsCard →
// Money/Cycle → daily metrics → workouts → cardio → supplements → meals.
export default function TrainingPlanToday() {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  if (!activePhase) return null;

  const todayDay = getCurrentPhaseDay(activePhase);

  return (
    <div>
      <TodayBadge startISO={activePhase.start_date} context="phase" />

      <ActivePhaseBanner />
      <MilestoneCard />
      <LongRangeGoalsCard />

      <MoneyTodayCard />
      <CycleTodayCard />

      <DailyMetricsCard person={person} dayNum={todayDay} phaseId={activePhase.id} />

      <CardioCard dayNum={todayDay} />

      <DailyActivationCard dayNum={todayDay} />

      <PhaseWorkoutSchedule />

      <SupplementsCard dayNum={todayDay} />

      <MealsBlock dayNum={todayDay} />
    </div>
  );
}

function DailyMetricsCard({ person, dayNum, phaseId }: { person: "gabby" | "jon"; dayNum: number; phaseId: string }) {
  const [m, setM] = useState<DailyMetrics>(EMPTY);
  const [stepsInput, setStepsInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("protein_g, water_oz, steps")
        .eq("person", person)
        .eq("day_num", dayNum)
        .eq("phase_id", phaseId)
        .maybeSingle();
      if (cancelled || !data) return;
      const d = data as { protein_g: number | null; water_oz: number | null; steps: number | null };
      setM({
        protein_g: d.protein_g ?? 0,
        water_oz: d.water_oz ?? 0,
        steps: d.steps ?? 0,
      });
    })();

    const channel = supabase
      .channel(`tp_metrics_${person}_${dayNum}_${phaseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` },
        (p) => {
          const row = p.new as { day_num?: number; phase_id?: string } & DailyMetrics;
          if (row && row.day_num === dayNum && row.phase_id === phaseId) {
            setM({
              protein_g: row.protein_g ?? 0,
              water_oz: row.water_oz ?? 0,
              steps: row.steps ?? 0,
            });
          }
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum, phaseId]);

  async function save(patch: Partial<DailyMetrics>) {
    const next = { ...m, ...patch };
    setM(next);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("daily_logs").upsert(
      {
        person,
        day_num: dayNum,
        phase_id: phaseId,
        date: today,
        protein_g: next.protein_g,
        water_oz: next.water_oz,
        steps: next.steps,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "person,day_num,phase_id" }
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-3">Today's Targets</div>
      <Bar label="🥩 Protein" current={m.protein_g} target={PROTEIN_TARGET} unit="g">
        <div className="flex gap-1">
          {[20, 30, 40].map((g) => (
            <button key={g} onClick={() => { vibrate(8); save({ protein_g: m.protein_g + g }); }} className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]">
              +{g}
            </button>
          ))}
        </div>
      </Bar>
      <Bar label="💧 Water" current={m.water_oz} target={WATER_TARGET} unit="oz">
        <div className="flex gap-1">
          {[8, 12, 16].map((d) => (
            <button key={d} onClick={() => { vibrate(8); save({ water_oz: m.water_oz + d }); }} className="tappable bg-forest text-terracotta font-semibold py-1 px-2 rounded text-[11px]">
              +{d}
            </button>
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
          >
            Set
          </button>
        </div>
      </Bar>
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
        <div className="text-xs text-charcoal">
          <span className="font-bold">{fmt(current)}</span>
          <span className="text-gray-500"> / {fmt(target)}{unit}</span>
        </div>
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
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_creatine" title="Creatine 5g" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_hmb" title="HMB 3g" detail="1g × 3 with meals" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_collagen" title="Collagen 15-20g" detail="With vitamin C" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_fishoil" title="Fish oil 2-3g" detail="With dinner" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_mag" title="Magnesium 400mg" detail="PM" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tp_supp_vitd" title="Vitamin D 5000 IU" />
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
      .channel(`tp_meals_done_${person}_${dayNum}_${activePhase.id}`)
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
  return (
    <CollapsibleSection title="Meals" done={done} doneLabel={`${loggedCount}/${totalSlots} logged`}>
      {gabbyMealSlots.map((slot) => (
        <MealSelector key={slot.key} slot={slot} dayNum={dayNum} />
      ))}
    </CollapsibleSection>
  );
}
