"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { supabase } from "@/lib/supabase";
import { getCurrentPhaseDay, getTotalDays, dateForPhaseDay, isoDate, displayDate } from "@/lib/phases";
import { jonMealSlots } from "@/lib/jon-meal-options";
import DaySelector from "@/components/DaySelector";
import PhaseBanner from "@/components/PhaseBanner";
import MealSelector from "@/components/MealSelector";
import EatingWindowBanner from "@/components/EatingWindowBanner";
import TreatTracker from "@/components/TreatTracker";
import PhotoPrompt from "@/components/PhotoPrompt";
import CheckItem from "@/components/CheckItem";
import CheckInForm from "@/components/CheckInForm";

const PROTEIN_TARGET = 180;
const WATER_TARGET = 120;
const STEPS_TARGET = 10000;

const JON_PHOTO_DAYS = new Set([1, 15, 29, 43, 45]);

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(p);
}

type Metrics = {
  protein_g: number;
  water_oz: number;
  steps: number;
};

const EMPTY: Metrics = { protein_g: 0, water_oz: 0, steps: 0 };

export default function JonToday() {
  const { person } = useProfile();
  const { activePhase } = usePhase();

  const todayDay = activePhase ? getCurrentPhaseDay(activePhase) : 1;
  const totalDays = activePhase ? getTotalDays(activePhase) : 46;
  const [selectedDay, setSelectedDay] = useState(todayDay);

  useEffect(() => {
    setSelectedDay(todayDay);
  }, [todayDay, activePhase?.id]);

  if (!activePhase) return null;

  const dateObj = dateForPhaseDay(activePhase, selectedDay);
  const selectedIso = isoDate(dateObj);
  const selectedDisplay = displayDate(dateObj);
  const isSunday = dateObj.getUTCDay() === 0;

  return (
    <div key={`jon-${activePhase.id}-${selectedDay}`}>
      <PhaseBanner phase={activePhase} phaseNumber={3} dayNum={selectedDay} totalDays={totalDays} />

      <EatingWindowBanner />

      <DaySelector
        currentDay={todayDay}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        totalDays={totalDays}
      />

      {JON_PHOTO_DAYS.has(selectedDay) && <PhotoPrompt dayNum={selectedDay} />}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        <div className="text-terracotta text-[10px] font-bold tracking-widest mb-1">
          DAY {selectedDay} · {selectedDisplay.toUpperCase()}
        </div>
        <div className="text-lg font-bold text-charcoal">Lean and strong</div>
        <p className="text-sm text-gray-700 leading-relaxed mt-1">
          1,900 cal · 180 P / 160 C / 60 F. Train on your own program. Treats fit into the weekly budget.
        </p>
      </div>

      <DailyTargetsCard person={person} dayNum={selectedDay} isoDate={selectedIso} />

      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Meals
      </div>
      {jonMealSlots.map((slot) => (
        <MealSelector key={slot.key} slot={slot} dayNum={selectedDay} />
      ))}

      <TreatTracker />

      <SupplementsCard dayNum={selectedDay} />

      {isSunday && (
        <div className="mt-6">
          <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3">
            🗓️ Weekly Check-In
          </div>
          <CheckInForm
            person={person}
            dayNum={selectedDay}
            isoDate={selectedIso}
            phase="am"
          />
          <CheckInForm
            person={person}
            dayNum={selectedDay}
            isoDate={selectedIso}
            phase="pm"
          />
        </div>
      )}
    </div>
  );
}

function DailyTargetsCard({ person, dayNum, isoDate }: { person: "gabby" | "jon"; dayNum: number; isoDate: string }) {
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [m, setM] = useState<Metrics>(EMPTY);
  const [stepsInput, setStepsInput] = useState("");
  const [proteinModalOpen, setProteinModalOpen] = useState(false);

  useEffect(() => {
    setM(EMPTY);
    setStepsInput("");
    if (!phaseId) return;
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
      const d = data as any;
      setM({
        protein_g: d.protein_g ?? 0,
        water_oz: d.water_oz ?? 0,
        steps: d.steps ?? 0,
      });
    })();

    const channel = supabase
      .channel(`jon_metrics_${person}_${dayNum}_${phaseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs", filter: `person=eq.${person}` }, (p) => {
        const row = p.new as any;
        if (row && row.day_num === dayNum && row.phase_id === phaseId) {
          setM({
            protein_g: row.protein_g ?? 0,
            water_oz: row.water_oz ?? 0,
            steps: row.steps ?? 0,
          });
        }
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [person, phaseId, dayNum]);

  async function save(patch: Partial<Metrics>) {
    if (!phaseId) return;
    const next = { ...m, ...patch };
    setM(next);
    await supabase.from("daily_logs").upsert({
      person, day_num: dayNum, phase_id: phaseId, date: isoDate,
      protein_g: next.protein_g, water_oz: next.water_oz, steps: next.steps,
      updated_at: new Date().toISOString(),
    }, { onConflict: "person,day_num,phase_id" });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-3">Today's Targets</div>

      <Bar label="🥩 Protein" current={m.protein_g} target={PROTEIN_TARGET} unit="g">
        <button
          onClick={() => setProteinModalOpen(true)}
          className="tappable bg-terracotta text-cream font-semibold py-1 px-2 rounded text-[11px]"
        >
          + Add
        </button>
      </Bar>

      <Bar label="💧 Water" current={m.water_oz} target={WATER_TARGET} unit="oz">
        <div className="flex gap-1">
          {[12, 16, 20].map((d) => (
            <button
              key={d}
              onClick={() => { vibrate(8); save({ water_oz: m.water_oz + d }); }}
              className="tappable bg-sage text-cream font-semibold py-1 px-2 rounded text-[11px]"
            >+{d}</button>
          ))}
          <button
            onClick={() => { vibrate(5); save({ water_oz: Math.max(0, m.water_oz - 8) }); }}
            className="tappable bg-white border border-gray-300 text-gray-600 font-semibold py-1 px-2 rounded text-[11px]"
          >−8</button>
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
            className="tappable bg-sage text-cream font-semibold py-1 px-2 rounded text-[11px]"
          >Set</button>
        </div>
      </Bar>

      {proteinModalOpen && (
        <ProteinQuickAdd
          current={m.protein_g}
          onAdd={(n) => { save({ protein_g: m.protein_g + n }); setProteinModalOpen(false); }}
          onClose={() => setProteinModalOpen(false)}
        />
      )}
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
      <div className="h-2 bg-sage-pale rounded-full overflow-hidden mb-1">
        <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function ProteinQuickAdd({ current, onAdd, onClose }: { current: number; onAdd: (n: number) => void; onClose: () => void }) {
  const [custom, setCustom] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl p-5 fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-charcoal text-lg mb-1">Add Protein</div>
        <div className="text-sm text-gray-500 mb-4">
          Currently at <span className="font-semibold text-charcoal">{current}g</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[25, 35, 50].map((g) => (
            <button
              key={g}
              onClick={() => onAdd(g)}
              className="tappable bg-terracotta text-cream font-semibold py-3 rounded-md text-sm"
            >+ {g}g</button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Custom grams"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-base focus:border-sage focus:outline-none"
          />
          <button
            onClick={() => { const n = parseInt(custom, 10); if (Number.isFinite(n) && n > 0) onAdd(n); }}
            className="tappable bg-terracotta text-cream font-semibold py-2 px-4 rounded-md text-sm"
          >Add</button>
        </div>
        <button onClick={onClose} className="tappable w-full text-gray-500 text-sm py-2">Cancel</button>
      </div>
    </div>
  );
}

function SupplementsCard({ dayNum }: { dayNum: number }) {
  const { person } = useProfile();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-2">Supplements</div>
      <CheckItem person={person} dayNum={dayNum} itemKey="jon_supp_creatine" title="Creatine 5g" />
      <CheckItem person={person} dayNum={dayNum} itemKey="jon_supp_vitd"     title="Vitamin D 5000 IU" />
      <CheckItem person={person} dayNum={dayNum} itemKey="jon_supp_mag"      title="Magnesium 400mg PM" />
      <CheckItem person={person} dayNum={dayNum} itemKey="jon_supp_fishoil"  title="Fish oil 2g" />
    </div>
  );
}
