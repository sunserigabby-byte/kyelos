"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";
import {
  type SwapCategory,
  calculatePortion,
  swapsForCategory,
} from "@/lib/food-database";

type Props = {
  open: boolean;
  onClose: () => void;
  person: Person;
  dayNum: number;
  mealKey: string;
  category: SwapCategory;
  targetGrams: number;
  currentDay: number;
  maxDay: number;
};

const CATEGORY_LABEL: Record<SwapCategory, string> = {
  protein: "Protein",
  carb: "Carb",
  fat: "Fat",
  veggie: "Veggie",
};

const CATEGORY_UNIT: Record<SwapCategory, string> = {
  protein: "g protein",
  carb: "g carbs",
  fat: "g fat",
  veggie: "",
};

export default function SwapModal({
  open,
  onClose,
  person,
  dayNum,
  mealKey,
  category,
  targetGrams,
  currentDay,
  maxDay,
}: Props) {
  const [applyToFuture, setApplyToFuture] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setApplyToFuture(false);
  }, [open]);

  if (!open) return null;

  const options = swapsForCategory(category);

  async function selectOption(food: string, serving: string) {
    setSaving(true);

    // For veggie, target grams is 0; just save the description as serving
    const updates: Record<string, string> = {};
    updates[`${category}_food`] = food;
    updates[`${category}_serving`] = serving;

    const days: number[] = [dayNum];
    if (applyToFuture) {
      for (let d = Math.max(currentDay, dayNum) + 1; d <= maxDay; d++) {
        days.push(d);
      }
    }

    const rows = days.map((d) => ({
      person,
      day_num: d,
      meal_key: mealKey,
      ...updates,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from("meal_swaps").upsert(rows, {
      onConflict: "person,day_num,meal_key",
    });

    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-2xl max-h-[85vh] flex flex-col fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">
              Swap {CATEGORY_LABEL[category]}
            </h2>
            {category !== "veggie" && (
              <p className="text-sm text-gray-500 mt-0.5">
                Need: <span className="font-semibold text-charcoal">{targetGrams}{CATEGORY_UNIT[category] ? " " + CATEGORY_UNIT[category] : ""}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="tappable text-gray-400 hover:text-gray-600 -mr-2 -mt-2 p-2"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {options.map((opt) => {
            const portion =
              category === "veggie"
                ? { displayServing: opt.note ?? "1 serving", actualGrams: 0 }
                : calculatePortion(opt, targetGrams);
            const off = category === "veggie" ? 0 : Math.abs(portion.actualGrams - targetGrams);
            const offWarn = off > targetGrams * 0.15 && targetGrams > 0;
            return (
              <li key={opt.name}>
                <button
                  onClick={() => selectOption(opt.name, portion.displayServing)}
                  disabled={saving}
                  className="tappable w-full text-left px-5 py-3 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-semibold text-charcoal text-sm">
                      {opt.name}
                      {opt.fattyProtein && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          fatty
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-700 flex-shrink-0 text-right">
                      {portion.displayServing}
                    </div>
                  </div>
                  {category !== "veggie" && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      ≈ {portion.actualGrams}{CATEGORY_UNIT[category] ? " " + CATEGORY_UNIT[category] : ""}
                      {offWarn && (
                        <span className="text-amber-700 ml-1">(off by {off.toFixed(1)}g)</span>
                      )}
                      {opt.note && <span className="italic ml-1">· {opt.note}</span>}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {dayNum < maxDay && (
          <label className="flex items-center gap-3 px-5 py-3 border-t border-gray-200 bg-gray-50">
            <input
              type="checkbox"
              checked={applyToFuture}
              onChange={(e) => setApplyToFuture(e.target.checked)}
              className="w-4 h-4 accent-sage-dark"
            />
            <span className="text-sm text-gray-700">
              Apply to all remaining days (Day {Math.max(currentDay, dayNum) + 1}–{maxDay})
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
