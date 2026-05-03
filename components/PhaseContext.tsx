"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { supabase } from "@/lib/supabase";
import type { Phase } from "@/lib/phases";
import { getActivePhase } from "@/lib/phases";

type PhaseContextType = {
  activePhase: Phase | null;
  loading: boolean;
  refresh: () => void;
};

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

export function PhaseProvider({ children }: { children: React.ReactNode }) {
  const { person } = useProfile();
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getActivePhase(person).then((p) => {
      if (cancelled) return;
      setActivePhase(p);
      setLoading(false);
    });

    const channel = supabase
      .channel(`phases_${person}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "phases",
          filter: `person=eq.${person}`,
        },
        () => {
          getActivePhase(person).then((p) => {
            if (!cancelled) setActivePhase(p);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [person, tick]);

  return (
    <PhaseContext.Provider
      value={{ activePhase, loading, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </PhaseContext.Provider>
  );
}

export function usePhase(): PhaseContextType {
  const ctx = useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used inside PhaseProvider");
  return ctx;
}
