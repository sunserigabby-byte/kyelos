"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/components/ProfileContext";
import { getPlan, getCurrentDay } from "@/lib/plan-data";
import CheckItem from "@/components/CheckItem";
import CheckInForm from "@/components/CheckInForm";
import DaySelector from "@/components/DaySelector";

export default function TodayPage() {
  const { person } = useProfile();
  const plan = getPlan(person);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    const d = getCurrentDay();
    setCurrentDay(d);
    setSelectedDay(d);
  }, []);

  const day = plan[selectedDay - 1];
  if (!day) return null;

  return (
    <div>
      <DaySelector currentDay={currentDay} selectedDay={selectedDay} onSelect={setSelectedDay} />

      {/* Day banner */}
      <div className="bg-navy text-white rounded-lg p-5 mb-4 border-t-4 border-b-4 border-gold">
        <div className="text-gold text-xs font-bold tracking-widest mb-1">
          DAY {day.day}  •  {day.date.toUpperCase()}
        </div>
        <div className="text-2xl font-bold mb-1">{day.title}</div>
        <div className="text-white/70 text-sm italic">{day.phase}</div>
      </div>

      {/* Focus */}
      <Section title="Today's Focus">
        <p className="text-sm text-gray-700 leading-relaxed">{day.focus}</p>
      </Section>

      {/* Peak adjustments */}
      {day.peakAdjustments && (
        <Section title="Peak Week Adjustments">
          <ul className="text-sm text-gray-700 space-y-1">
            {day.peakAdjustments.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* AM Cardio */}
      <Section title="AM Cardio">
        <CheckItem
          person={person}
          dayNum={day.day}
          itemKey="am_cardio"
          title="AM Cardio Complete"
          detail={day.amCardio}
        />
      </Section>

      {/* Meals */}
      <Section title="Meals">
        {day.meals.map((m) => (
          <CheckItem
            key={m.key}
            person={person}
            dayNum={day.day}
            itemKey={m.key}
            title={`${m.label} — ${m.time}`}
            detail={m.food}
          />
        ))}
      </Section>

      {/* Supplements */}
      <Section title="Supplements & Tea">
        {day.supplements.map((s) => (
          <CheckItem
            key={s.key}
            person={person}
            dayNum={day.day}
            itemKey={s.key}
            title={s.time}
            detail={s.item}
          />
        ))}
      </Section>

      {/* Workout */}
      <Section title="PM Workout">
        {day.workout.circuitIntro && (
          <p className="text-sm text-gray-700 mb-3 font-medium">{day.workout.circuitIntro}</p>
        )}
        {day.workout.circuit && (
          <ul className="text-sm text-gray-700 space-y-1 mb-3 pl-4">
            {day.workout.circuit.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        )}
        {day.workout.exercises && (
          <div className="space-y-2 mb-3">
            {day.workout.exercises.map((ex, i) => (
              <div key={i} className="bg-navy-light rounded p-3">
                <div className="font-semibold text-navy text-sm">{ex.name}</div>
                <div className="text-sm text-gray-700 mt-1">{ex.prescription}</div>
              </div>
            ))}
          </div>
        )}
        <CheckItem
          person={person}
          dayNum={day.day}
          itemKey="workout_complete"
          title="Workout Complete ✓"
        />
      </Section>

      {/* Check-in */}
      <Section title="Daily Check-In">
        <CheckInForm person={person} dayNum={day.day} isoDate={day.isoDate} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="text-navy font-bold text-sm uppercase tracking-wider border-b-2 border-gold/60 pb-1 mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}
