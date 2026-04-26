"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";

export type CycleSettings = {
  last_period_start: string;
  cycle_length: number;
};

export function useCycleSettings(person: Person): {
  settings: CycleSettings | null;
  loading: boolean;
  refresh: () => void;
} {
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (person !== "gabby") {
      setSettings(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    supabase
      .from("cycle_settings")
      .select("last_period_start, cycle_length")
      .eq("person", "gabby")
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) {
          setSettings(data ?? null);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`cycle_settings_${person}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cycle_settings",
          filter: "person=eq.gabby",
        },
        (payload) => {
          const row = payload.new as CycleSettings | undefined;
          if (row && mounted) setSettings(row);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [person, tick]);

  return { settings, loading, refresh: () => setTick((t) => t + 1) };
}
