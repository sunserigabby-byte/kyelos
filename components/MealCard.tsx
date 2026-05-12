"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  MealComponent,
  MealSwap,
  Person,
  StructuredMeal,
} from "@/lib/plan-data";
import type { SwapCategory } from "@/lib/food-database";
import CheckItem from "./CheckItem";
import SwapModal from "./SwapModal";

type Props = {
  person: Person;
  dayNum: number;
  meal: StructuredMeal;
  swap: MealSwap | undefined;
  currentDay: number;
  maxDay: number;
};

const COMPONENT_EMOJI: Record<SwapCategory, string> = {
  protein: "🥩",
  carb: "🍚",
  fat: "🥑",
  veggie: "🥬",
};

const COMPONENT_LABEL: Record<SwapCategory, string> = {
  protein: "Protein",
  carb: "Carb",
  fat: "Fat",
  veggie: "Veggie",
};

export default function MealCard({
  person,
  dayNum,
  meal,
  swap,
  currentDay,
  maxDay,
}: Props) {
  const [openCategory, setOpenCategory] = useState<SwapCategory | null>(null);

  const hasAnySwap =
    !!(
      swap?.protein_food ||
      swap?.carb_food ||
      swap?.fat_food ||
      swap?.veggie_food
    );

  // Note-only meals (travel day) — render plain text
  if (meal.note && !meal.protein && !meal.carb && !meal.fat && !meal.veggie) {
    return (
      <div className="mb-2">
        <div className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider mb-1 ml-1">
          {meal.label} — {meal.time}
        </div>
        <CheckItem
          person={person}
          dayNum={dayNum}
          itemKey={meal.key}
          title={meal.note}
        />
      </div>
    );
  }

  async function resetToDefault() {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(5);
    }
    await supabase
      .from("meal_swaps")
      .delete()
      .eq("person", person)
      .eq("day_num", dayNum)
      .eq("meal_key", meal.key);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-baseline justify-between">
        <div>
          <div className="font-semibold text-charcoal text-base">{meal.label}</div>
          <div className="text-xs text-gray-500">{meal.time}</div>
        </div>
        {hasAnySwap && (
          <button
            onClick={resetToDefault}
            className="tappable text-xs text-charcoal/60 hover:text-charcoal underline-offset-2 hover:underline"
          >
            ↺ reset to default
          </button>
        )}
      </div>

      {/* Component rows */}
      <div className="divide-y divide-gray-100">
        <ComponentRow
          category="protein"
          component={meal.protein}
          swapFood={swap?.protein_food}
          swapServing={swap?.protein_serving}
          onTap={() => setOpenCategory("protein")}
        />
        <ComponentRow
          category="carb"
          component={meal.carb}
          swapFood={swap?.carb_food}
          swapServing={swap?.carb_serving}
          onTap={() => setOpenCategory("carb")}
        />
        <ComponentRow
          category="fat"
          component={meal.fat}
          swapFood={swap?.fat_food}
          swapServing={swap?.fat_serving}
          onTap={() => setOpenCategory("fat")}
        />
        <ComponentRow
          category="veggie"
          component={meal.veggie}
          swapFood={swap?.veggie_food}
          swapServing={swap?.veggie_serving}
          onTap={() => setOpenCategory("veggie")}
        />
      </div>

      {meal.note && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 italic">
          {meal.note}
        </div>
      )}

      {/* Done checkbox */}
      <div className="p-3 bg-gray-50">
        <CheckItem
          person={person}
          dayNum={dayNum}
          itemKey={meal.key}
          title="Mark meal complete ✓"
        />
      </div>

      {/* Swap modal */}
      {openCategory && (
        <SwapModal
          open={true}
          onClose={() => setOpenCategory(null)}
          person={person}
          dayNum={dayNum}
          mealKey={meal.key}
          category={openCategory}
          targetGrams={
            openCategory === "protein"
              ? meal.protein?.targetGrams ?? 0
              : openCategory === "carb"
              ? meal.carb?.targetGrams ?? 0
              : openCategory === "fat"
              ? meal.fat?.targetGrams ?? 0
              : 0
          }
          currentDay={currentDay}
          maxDay={maxDay}
        />
      )}
    </div>
  );
}

function ComponentRow({
  category,
  component,
  swapFood,
  swapServing,
  onTap,
}: {
  category: SwapCategory;
  component: MealComponent | undefined;
  swapFood: string | null | undefined;
  swapServing: string | null | undefined;
  onTap: () => void;
}) {
  if (!component) return null;
  const isSwapped = !!(swapFood && swapServing);
  const food = isSwapped ? swapFood! : component.food;
  const serving = isSwapped ? swapServing! : component.serving;

  return (
    <button
      onClick={onTap}
      className="tappable w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3"
    >
      <span className="text-xl flex-shrink-0">{COMPONENT_EMOJI[category]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-charcoal truncate">{food}</span>
          <span className="text-xs text-gray-600 flex-shrink-0">{serving}</span>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          {COMPONENT_LABEL[category]}
          {component.targetGrams > 0 ? ` · ${component.targetGrams}g target` : ""}
          {isSwapped && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-charcoal bg-sage-pale px-1.5 py-0.5 rounded">
              swapped
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
