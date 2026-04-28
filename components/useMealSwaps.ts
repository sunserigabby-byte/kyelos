"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person, MealSwap } from "@/lib/plan-data";

// Map of meal_key -> swap row for the given person/day.
export type MealSwapMap = Record<string, MealSwap>;

export function useMealSwaps(person: Person, dayNum: number) {
  const [swaps, setSwaps] = useState<MealSwapMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear stale day data immediately so the new day starts blank
    // until the fresh load completes.
    setSwaps({});
    setLoading(true);

    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from("meal_swaps")
        .select(
          "meal_key, protein_food, protein_serving, carb_food, carb_serving, fat_food, fat_serving, veggie_food, veggie_serving"
        )
        .eq("person", person)
        .eq("day_num", dayNum);

      if (!mounted) return;

      if (error) {
        // Table may not exist yet (pre-migration). Treat as no swaps.
        setSwaps({});
      } else {
        const map: MealSwapMap = {};
        for (const row of data || []) {
          map[(row as any).meal_key] = row as MealSwap;
        }
        setSwaps(map);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`meal_swaps_${person}_${dayNum}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_swaps",
          filter: `person=eq.${person}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = (payload.new as any) || (payload.old as any);
          if (row && row.day_num === dayNum) {
            // Reload all (small dataset, simpler than diffing)
            load();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person, dayNum]);

  return { swaps, loading };
}
