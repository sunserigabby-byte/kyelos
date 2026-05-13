"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { usePhase } from "@/components/PhaseContext";
import { getCurrentPhaseDay, getTotalDays } from "@/lib/phases";
import { gabbyTournament, TOURNAMENT_PHOTO_DAYS } from "@/lib/tournament-peak";
import { gabbyMealSlots } from "@/lib/meal-options";
import DaySelector from "@/components/DaySelector";
import PhaseBanner from "@/components/PhaseBanner";
import WorkoutTracker, { useWorkoutSession } from "@/components/WorkoutTracker";
import MealSelector from "@/components/MealSelector";
import CardioCard from "@/components/CardioCard";
import PhotoPrompt from "@/components/PhotoPrompt";
import CheckItem from "@/components/CheckItem";

export default function TournamentToday() {
  const { person } = useProfile();
  const { activePhase } = usePhase();

  const todayDay = activePhase ? getCurrentPhaseDay(activePhase) : 1;
  const totalDays = activePhase ? getTotalDays(activePhase) : 7;
  const [selectedDay, setSelectedDay] = useState(todayDay);

  useEffect(() => {
    setSelectedDay(todayDay);
  }, [todayDay, activePhase?.id]);

  if (!activePhase) return null;
  const day = gabbyTournament[selectedDay - 1] ?? gabbyTournament[0];
  const peakWeek = selectedDay >= 4;

  return (
    <div key={`tournament-${activePhase.id}-${selectedDay}`}>
      <PhaseBanner phase={activePhase} phaseNumber={4} dayNum={selectedDay} totalDays={totalDays} />

      <DaySelector
        currentDay={todayDay}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        totalDays={totalDays}
      />

      {TOURNAMENT_PHOTO_DAYS.has(selectedDay) && <PhotoPrompt dayNum={selectedDay} />}

      {peakWeek && (
        <div className="bg-forest-pale border-2 border-terracotta rounded-lg p-3 mb-3 text-sm text-charcoal">
          <div className="font-bold mb-0.5">🌊 Peak Week — Day {selectedDay}</div>
          <div className="text-xs">Water + sodium manipulation active. Trust the protocol; you've earned this taper.</div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        <div className="text-terracotta text-[10px] font-bold tracking-widest mb-1">
          {day.dayOfWeek.toUpperCase()} · {day.workoutName}
        </div>
        <div className="text-lg font-bold text-charcoal mb-1">{day.focus}</div>
        <p className="text-sm text-gray-700 leading-relaxed">{day.intro}</p>
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <span className="font-semibold text-charcoal">Note:</span> {day.progressionNote}
        </div>
      </div>

      {selectedDay < 7 && <CardioCard dayNum={selectedDay} />}

      <TournamentWorkout day={day} selectedDay={selectedDay} />

      <SupplementsCard dayNum={selectedDay} />

      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Meals
      </div>
      {gabbyMealSlots.map((slot) => (
        <MealSelector key={slot.key} slot={slot} dayNum={selectedDay} />
      ))}
    </div>
  );
}

function TournamentWorkout({ day, selectedDay }: { day: any; selectedDay: number }) {
  const sessionId = useWorkoutSession(selectedDay, day.workoutName, day.isoDate);

  return (
    <>
      {day.swingPrep && (
        <div className="bg-forest-pale/30 border-l-4 border-terracotta rounded-r-md p-3 mb-3">
          <div className="font-bold text-charcoal text-sm mb-2">🏐 Swing Prep — 5 min</div>
          {day.swingPrep.map((ex: any) => (
            <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={selectedDay} />
          ))}
        </div>
      )}

      <div className="text-charcoal font-bold text-sm uppercase tracking-wider border-b-2 border-terracotta/60 pb-1 mb-3 mt-6">
        Workout
      </div>
      {day.exercises.map((ex: any) => (
        <WorkoutTracker key={ex.name} exercise={ex} sessionId={sessionId} dayNum={selectedDay} />
      ))}
    </>
  );
}

function SupplementsCard({ dayNum }: { dayNum: number }) {
  const { person } = useProfile();
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
      <div className="text-charcoal font-bold text-sm mb-2">Supplements</div>
      <CheckItem person={person} dayNum={dayNum} itemKey="tournament_supp_creatine" title="Creatine 5g" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tournament_supp_fishoil"  title="Fish oil 2-3g" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tournament_supp_mag"      title="Magnesium 400mg PM" />
      <CheckItem person={person} dayNum={dayNum} itemKey="tournament_supp_vitd"     title="Vitamin D 5000 IU" />
    </div>
  );
}
