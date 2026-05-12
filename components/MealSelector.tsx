"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import type { FoodOption, MealSlot } from "@/lib/training-types";
import CheckItem from "@/components/CheckItem";

type Selection = {
  protein_food: string | null;
  protein_serving: string | null;
  carb_food: string | null;
  carb_serving: string | null;
  fat_food: string | null;
  fat_serving: string | null;
  veggie_food: string | null;
  veggie_serving: string | null;
};

const EMPTY: Selection = {
  protein_food: null, protein_serving: null,
  carb_food: null, carb_serving: null,
  fat_food: null, fat_serving: null,
  veggie_food: null, veggie_serving: null,
};

type Cat = "protein" | "carb" | "fat" | "veggie";

export default function MealSelector({ slot, dayNum }: { slot: MealSlot; dayNum: number }) {
  const { person } = useProfile();
  const { activePhase } = usePhase();
  const phaseId = activePhase?.id;
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [openCat, setOpenCat] = useState<Cat | null>(null);

  useEffect(() => {
    setSel(EMPTY);
    if (!phaseId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("meal_selections")
        .select("*")
        .eq("person", person)
        .eq("phase_id", phaseId)
        .eq("day_num", dayNum)
        .eq("meal_key", slot.key)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setSel({
          protein_food: (data as any).protein_food,
          protein_serving: (data as any).protein_serving,
          carb_food: (data as any).carb_food,
          carb_serving: (data as any).carb_serving,
          fat_food: (data as any).fat_food,
          fat_serving: (data as any).fat_serving,
          veggie_food: (data as any).veggie_food,
          veggie_serving: (data as any).veggie_serving,
        });
      }
    })();

    const channel = supabase
      .channel(`meal_sel_${person}_${dayNum}_${slot.key}_${phaseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_selections", filter: `person=eq.${person}` }, (p) => {
        const row = p.new as any;
        if (row && row.day_num === dayNum && row.meal_key === slot.key && row.phase_id === phaseId) {
          setSel({
            protein_food: row.protein_food, protein_serving: row.protein_serving,
            carb_food: row.carb_food, carb_serving: row.carb_serving,
            fat_food: row.fat_food, fat_serving: row.fat_serving,
            veggie_food: row.veggie_food, veggie_serving: row.veggie_serving,
          });
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, phaseId, dayNum, slot.key]);

  async function pick(cat: Cat, food: FoodOption) {
    if (!phaseId) return;
    const next: Selection = { ...sel };
    next[`${cat}_food` as keyof Selection] = food.name as any;
    next[`${cat}_serving` as keyof Selection] = food.serving as any;
    // If user picked a fatHeavy protein, auto-clear/lock fat
    if (cat === "protein" && food.fatHeavy) {
      next.fat_food = "Covered by protein";
      next.fat_serving = "none needed";
    }
    setSel(next);
    setOpenCat(null);
    await supabase.from("meal_selections").upsert({
      person,
      phase_id: phaseId,
      day_num: dayNum,
      meal_key: slot.key,
      ...next,
      updated_at: new Date().toISOString(),
    }, { onConflict: "person,phase_id,day_num,meal_key" });
  }

  const fatHeavyChosen = (() => {
    const proteinName = sel.protein_food;
    if (!proteinName) return false;
    return slot.options.proteins.find((p) => p.name === proteinName)?.fatHeavy ?? false;
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-semibold text-navy text-sm">{slot.label}</div>
        <div className="text-[11px] text-gray-500">{slot.time}</div>
      </div>
      <div className="text-[10px] uppercase tracking-wider text-navy/60 font-semibold mb-2">
        Target: {slot.targetMacros.protein}P · {slot.targetMacros.carbs}C · {slot.targetMacros.fat}F
      </div>

      <Row label="Protein" current={sel.protein_food} serving={sel.protein_serving} onChange={() => setOpenCat("protein")} />
      <Row label="Carb"    current={sel.carb_food}    serving={sel.carb_serving}    onChange={() => setOpenCat("carb")} />
      <Row label="Fat"     current={fatHeavyChosen && !sel.fat_food ? "Covered by protein" : sel.fat_food} serving={sel.fat_serving} onChange={() => setOpenCat("fat")} disabled={fatHeavyChosen} />
      {slot.showVeggies && (
        <Row label="Veggie" current={sel.veggie_food} serving={sel.veggie_serving} onChange={() => setOpenCat("veggie")} />
      )}

      <div className="mt-2">
        <CheckItem person={person} dayNum={dayNum} itemKey={`${slot.key}_eaten`} title={`${slot.label} eaten ✓`} />
      </div>

      {openCat && (
        <PickerModal
          title={`Pick ${openCat === "veggie" ? "Veggie" : openCat}`}
          options={
            openCat === "protein" ? slot.options.proteins :
            openCat === "carb"    ? slot.options.carbs :
            openCat === "fat"     ? slot.options.fats :
            slot.options.veggies ?? []
          }
          onPick={(opt) => pick(openCat, opt)}
          onClose={() => setOpenCat(null)}
        />
      )}
    </div>
  );
}

function Row({ label, current, serving, onChange, disabled }: { label: string; current: string | null; serving: string | null; onChange: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-b-0">
      <div className="min-w-0 flex-1 pr-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`text-sm font-semibold ${current ? "text-navy" : "text-gray-400"} truncate`}>
          {current ?? "Tap to choose"}
        </div>
        {serving && <div className="text-[11px] text-gray-500">{serving}</div>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className="tappable text-xs font-semibold text-navy underline-offset-2 hover:underline disabled:text-gray-400 disabled:no-underline"
      >
        {current ? "Change" : "Choose"}
      </button>
    </div>
  );
}

function PickerModal({ title, options, onPick, onClose }: { title: string; options: FoodOption[]; onPick: (o: FoodOption) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[80vh] flex flex-col fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-2 border-b border-gray-200 flex items-start justify-between">
          <div className="font-bold text-navy">{title}</div>
          <button onClick={onClose} className="tappable text-gray-400 px-2">✕</button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {options.map((opt) => (
            <li key={opt.id}>
              <button onClick={() => onPick(opt)} className="tappable w-full text-left px-4 py-3 hover:bg-gray-50">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold text-navy text-sm">
                    {opt.name}
                    {opt.fatHeavy && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">fatty</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-700 flex-shrink-0 text-right">{opt.serving}</div>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {opt.macros.protein != null && `${opt.macros.protein}P `}
                  {opt.macros.carbs   != null && `${opt.macros.carbs}C `}
                  {opt.macros.fat     != null && `${opt.macros.fat}F`}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
