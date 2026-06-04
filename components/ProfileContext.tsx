"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Person } from "@/lib/plan-data";

export type ViewMode = "gabby" | "jon" | "together";

type ProfileContextType = {
  /** UI toggle position — what the user picked. */
  view: ViewMode;
  /** Always one of "gabby" | "jon" — for queries that need a single person.
   *  In couple mode, this is the most-recently-active individual. */
  person: Person;
  isCoupleMode: boolean;
  setView: (v: ViewMode) => void;
  /** Backwards-compat alias for old call sites. Sets view to that person and exits couple mode. */
  setPerson: (p: Person) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const VIEW_KEY = "kyelos_view";
const LAST_KEY = "kyelos_last_person";
const LEGACY_KEY = "cut_tracker_person";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewMode>("gabby");
  const [lastIndividual, setLastIndividual] = useState<Person>("gabby");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Migrate legacy key first if present.
    const legacy = localStorage.getItem(LEGACY_KEY);
    const storedView = localStorage.getItem(VIEW_KEY);
    const storedLast = localStorage.getItem(LAST_KEY);

    if (storedView === "gabby" || storedView === "jon" || storedView === "together") {
      setViewState(storedView);
    } else if (legacy === "gabby" || legacy === "jon") {
      setViewState(legacy);
    }

    if (storedLast === "gabby" || storedLast === "jon") {
      setLastIndividual(storedLast);
    } else if (legacy === "gabby" || legacy === "jon") {
      setLastIndividual(legacy);
    }

    setHydrated(true);
  }, []);

  function setView(v: ViewMode) {
    setViewState(v);
    localStorage.setItem(VIEW_KEY, v);
    if (v === "gabby" || v === "jon") {
      setLastIndividual(v);
      localStorage.setItem(LAST_KEY, v);
      // Also keep legacy key in sync for any old code paths.
      localStorage.setItem(LEGACY_KEY, v);
    }
  }

  function setPerson(p: Person) {
    setView(p);
  }

  if (!hydrated) {
    return <div className="flex items-center justify-center min-h-screen text-charcoal">Loading...</div>;
  }

  const person: Person = view === "together" ? lastIndividual : view;
  const isCoupleMode = view === "together";

  return (
    <ProfileContext.Provider value={{ view, person, isCoupleMode, setView, setPerson }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
