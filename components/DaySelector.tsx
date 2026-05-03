"use client";

type Props = {
  currentDay: number;
  selectedDay: number;
  onSelect: (day: number) => void;
  totalDays?: number;
};

export default function DaySelector({ currentDay, selectedDay, onSelect, totalDays = 7 }: Props) {
  return (
    <div className="overflow-x-auto no-scrollbar mb-4 -mx-4 px-4">
      <div className="flex gap-2">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const isToday = day === currentDay;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => {
                onSelect(day);
                if (typeof window !== "undefined" && "vibrate" in navigator) {
                  navigator.vibrate(5);
                }
              }}
              className={`tappable flex-shrink-0 w-14 h-14 rounded-xl font-bold text-lg transition border-2 ${
                isSelected
                  ? "bg-navy text-white border-navy shadow-md"
                  : isToday
                  ? "bg-gold-light text-navy border-gold"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
