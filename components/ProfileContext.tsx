"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Person } from "@/lib/plan-data";

type ProfileContextType = {
  person: Person;
  setPerson: (p: Person) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [person, setPersonState] = useState<Person>("gabby");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cut_tracker_person");
    if (stored === "gabby" || stored === "jon") {
      setPersonState(stored);
    }
    setHydrated(true);
  }, []);

  const setPerson = (p: Person) => {
    setPersonState(p);
    localStorage.setItem("cut_tracker_person", p);
  };

  if (!hydrated) {
    return <div className="flex items-center justify-center min-h-screen text-charcoal">Loading...</div>;
  }

  return (
    <ProfileContext.Provider value={{ person, setPerson }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
