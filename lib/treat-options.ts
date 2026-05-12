export type TreatCategory = "alcohol" | "sweet" | "savory" | "restaurant";

export type TreatOption = {
  id: string;
  name: string;
  emoji: string;
  calories: number;
  category: TreatCategory;
};

export const treatQuickAdds: TreatOption[] = [
  { id: "beer",              name: "Beer (12 oz)",            emoji: "🍺", calories: 150, category: "alcohol" },
  { id: "wine",              name: "Wine (5 oz)",             emoji: "🍷", calories: 125, category: "alcohol" },
  { id: "cocktail",          name: "Cocktail",                emoji: "🥃", calories: 200, category: "alcohol" },
  { id: "pizza_slice",       name: "Pizza slice",             emoji: "🍕", calories: 300, category: "savory" },
  { id: "burger",            name: "Burger out",              emoji: "🍔", calories: 500, category: "restaurant" },
  { id: "dessert",           name: "Dessert",                 emoji: "🍦", calories: 250, category: "sweet" },
  { id: "cookie",            name: "Cookie",                  emoji: "🍪", calories: 150, category: "sweet" },
  { id: "fries",             name: "Fries (side)",            emoji: "🍟", calories: 300, category: "savory" },
  { id: "restaurant_extras", name: "Restaurant meal extras",  emoji: "🥗", calories: 400, category: "restaurant" },
  { id: "chips",             name: "Chips (handful)",         emoji: "🥨", calories: 150, category: "savory" },
  { id: "ice_cream",         name: "Ice cream scoop",         emoji: "🍨", calories: 250, category: "sweet" },
];

export const JON_WEEKLY_TREAT_BUDGET = 1000;

// Map a phase day number (1-based) to a week number (1-based).
// Week 1 = days 1-7, Week 2 = days 8-14, etc.
export function phaseDayToWeek(dayNum: number): number {
  return Math.ceil(dayNum / 7);
}

// Map an ISO date to phase day number given the phase start date.
export function phaseDayForDate(phaseStartIso: string, iso: string): number {
  const [sy, sm, sd] = phaseStartIso.split("-").map(Number);
  const [y, m, d] = iso.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const target = Date.UTC(y, m - 1, d);
  return Math.floor((target - start) / 86400000) + 1;
}
