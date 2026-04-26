// Food swap database with macro density values.
// For a target macro grams (e.g. 40g protein), the calculator produces
// a sensible serving size for any food in the matching category.

export type SwapUnit = "oz" | "cup" | "tbsp" | "piece" | "scoop";

export type SwapOption = {
  name: string;
  unit: SwapUnit;
  // Macro grams per unit, where the macro is whichever the category targets
  // (protein for proteins, carbs for carbs, fat for fats).
  gramsPerOz?: number;
  gramsPerCup?: number;
  gramsPerTbsp?: number;
  gramsPerPiece?: number;
  gramsPerScoop?: number;
  pieceLabel?: string;     // e.g. "small", "medium", "can"
  fattyProtein?: boolean;  // protein that also carries notable fat — flag for UI
  note?: string;
};

export type SwapCategory = "protein" | "carb" | "fat" | "veggie";

// ============================================
// PROTEINS — gramsPer* refers to grams of protein
// ============================================
export const proteinSwaps: SwapOption[] = [
  // Lean
  { name: "Chicken breast", unit: "oz", gramsPerOz: 8 },
  { name: "Turkey breast", unit: "oz", gramsPerOz: 8 },
  { name: "99% lean ground turkey", unit: "oz", gramsPerOz: 7 },
  { name: "White fish (cod, tilapia, halibut)", unit: "oz", gramsPerOz: 5.7 },
  { name: "Shrimp", unit: "oz", gramsPerOz: 6 },
  { name: "Canned tuna in water", unit: "piece", gramsPerPiece: 30, pieceLabel: "can (5 oz)" },
  { name: "Egg whites", unit: "piece", gramsPerPiece: 4, pieceLabel: "white" },
  { name: "0% Greek yogurt (plain)", unit: "cup", gramsPerCup: 22 },
  { name: "Low-fat cottage cheese", unit: "cup", gramsPerCup: 24 },
  { name: "Whey isolate", unit: "scoop", gramsPerScoop: 25 },
  { name: "Lean bison", unit: "oz", gramsPerOz: 7 },
  // Fatty
  { name: "Whole eggs", unit: "piece", gramsPerPiece: 6, pieceLabel: "egg", fattyProtein: true, note: "+5g fat per egg" },
  { name: "Salmon", unit: "oz", gramsPerOz: 6.25, fattyProtein: true, note: "+2.5g fat per oz" },
  { name: "93/7 ground turkey", unit: "oz", gramsPerOz: 6.4, fattyProtein: true, note: "+2.4g fat per oz" },
  { name: "90/10 ground beef", unit: "oz", gramsPerOz: 6.25, fattyProtein: true, note: "+3g fat per oz" },
  { name: "Chicken thighs", unit: "oz", gramsPerOz: 6.25, fattyProtein: true, note: "+2.5g fat per oz" },
  { name: "Sardines in water", unit: "piece", gramsPerPiece: 23, pieceLabel: "can", fattyProtein: true, note: "+11g fat per can" },
];

// ============================================
// CARBS — gramsPer* refers to grams of carbohydrate
// ============================================
export const carbSwaps: SwapOption[] = [
  { name: "Jasmine/basmati rice (cooked)", unit: "cup", gramsPerCup: 44 },
  { name: "Sweet potato (baked)", unit: "piece", gramsPerPiece: 40, pieceLabel: "medium" },
  { name: "White potato (baked)", unit: "piece", gramsPerPiece: 36, pieceLabel: "medium" },
  { name: "Oats (dry)", unit: "cup", gramsPerCup: 60 },
  { name: "Quinoa (cooked)", unit: "cup", gramsPerCup: 40 },
  { name: "Plain rice cakes", unit: "piece", gramsPerPiece: 7, pieceLabel: "cake" },
  { name: "Ezekiel bread", unit: "piece", gramsPerPiece: 15, pieceLabel: "slice" },
  { name: "Banana", unit: "piece", gramsPerPiece: 23, pieceLabel: "small" },
  { name: "Berries", unit: "cup", gramsPerCup: 18 },
  { name: "Apple", unit: "piece", gramsPerPiece: 20, pieceLabel: "small" },
];

// ============================================
// FATS — gramsPer* refers to grams of fat
// ============================================
export const fatSwaps: SwapOption[] = [
  { name: "Olive oil (EVOO)", unit: "tbsp", gramsPerTbsp: 14 },
  { name: "Avocado", unit: "piece", gramsPerPiece: 32, pieceLabel: "fruit" },
  { name: "Almonds (raw)", unit: "piece", gramsPerPiece: 0.7, pieceLabel: "nut" },
  { name: "Almond butter (no sugar)", unit: "tbsp", gramsPerTbsp: 9 },
  { name: "Chia seeds", unit: "tbsp", gramsPerTbsp: 4 },
];

// ============================================
// VEGGIES — descriptive only, no macro target
// ============================================
export const veggieSwaps: SwapOption[] = [
  { name: "Spinach, arugula, kale, romaine", unit: "cup", note: "2+ cups raw" },
  { name: "Broccoli", unit: "cup", note: "1 cup cooked" },
  { name: "Asparagus", unit: "cup", note: "1 cup" },
  { name: "Zucchini / yellow squash", unit: "cup", note: "1 cup" },
  { name: "Cauliflower", unit: "cup", note: "1 cup" },
  { name: "Brussels sprouts", unit: "cup", note: "1 cup" },
  { name: "Green beans", unit: "cup", note: "1 cup" },
  { name: "Bell peppers", unit: "cup", note: "1 cup" },
  { name: "Cucumber", unit: "cup", note: "1 cup — skip travel day morning" },
  { name: "Cherry tomatoes", unit: "cup", note: "1 cup" },
  { name: "Mushrooms", unit: "cup", note: "1 cup" },
];

export function swapsForCategory(category: SwapCategory): SwapOption[] {
  switch (category) {
    case "protein":
      return proteinSwaps;
    case "carb":
      return carbSwaps;
    case "fat":
      return fatSwaps;
    case "veggie":
      return veggieSwaps;
  }
}

// ============================================
// PORTION CALCULATOR
// ============================================

function densityFor(option: SwapOption): number {
  switch (option.unit) {
    case "oz":
      return option.gramsPerOz ?? 0;
    case "cup":
      return option.gramsPerCup ?? 0;
    case "tbsp":
      return option.gramsPerTbsp ?? 0;
    case "piece":
      return option.gramsPerPiece ?? 0;
    case "scoop":
      return option.gramsPerScoop ?? 0;
  }
}

const FRACTION_MAP: { [key: string]: string } = {
  "0.25": "¼",
  "0.5": "½",
  "0.75": "¾",
  "0.33": "⅓",
  "0.67": "⅔",
};

export function formatFraction(num: number): string {
  if (num === 0) return "0";
  const whole = Math.floor(num);
  const frac = num - whole;
  // Round fraction to nearest quarter or third
  const candidates = [0, 0.25, 0.33, 0.5, 0.67, 0.75, 1];
  let best = 0;
  let bestDiff = 1;
  for (const c of candidates) {
    const diff = Math.abs(frac - c);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  if (best === 1) return String(whole + 1);
  if (best === 0) return whole === 0 ? "0" : String(whole);
  const fracStr = FRACTION_MAP[String(best)] ?? best.toFixed(2);
  return whole === 0 ? fracStr : `${whole}${fracStr}`;
}

export type CalculatedPortion = {
  displayServing: string;  // e.g. "7 oz cooked", "1 medium", "1¼ cup"
  actualGrams: number;     // grams of the targeted macro this serving provides
};

// Calculate a sensible serving size for `option` to hit `targetGrams` of the
// targeted macro. For veggies (no density) returns the option's note string.
export function calculatePortion(
  option: SwapOption,
  targetGrams: number
): CalculatedPortion {
  const d = densityFor(option);
  if (d === 0) {
    return { displayServing: option.note ?? "1 serving", actualGrams: 0 };
  }
  const rawAmount = targetGrams / d;

  switch (option.unit) {
    case "oz": {
      const n = Math.max(1, Math.round(rawAmount));
      return {
        displayServing: `${n} oz cooked`,
        actualGrams: Math.round(n * d * 10) / 10,
      };
    }
    case "cup": {
      const n = Math.max(0.25, Math.round(rawAmount * 4) / 4);
      return {
        displayServing: `${formatFraction(n)} cup`,
        actualGrams: Math.round(n * d * 10) / 10,
      };
    }
    case "tbsp": {
      const n = Math.max(0.5, Math.round(rawAmount * 2) / 2);
      return {
        displayServing: `${formatFraction(n)} tbsp`,
        actualGrams: Math.round(n * d * 10) / 10,
      };
    }
    case "piece": {
      // Allow ¼, ½, ¾, 1, 2, 3...
      let n: number;
      if (rawAmount < 1) {
        n = Math.max(0.25, Math.round(rawAmount * 4) / 4);
      } else {
        n = Math.max(1, Math.round(rawAmount));
      }
      const label = option.pieceLabel ?? "piece";
      const plural = n === 1 ? label : pluralize(label);
      return {
        displayServing: `${formatFraction(n)} ${plural}`,
        actualGrams: Math.round(n * d * 10) / 10,
      };
    }
    case "scoop": {
      const n = Math.max(0.5, Math.round(rawAmount * 2) / 2);
      return {
        displayServing: `${formatFraction(n)} scoop${n === 1 ? "" : "s"}`,
        actualGrams: Math.round(n * d * 10) / 10,
      };
    }
  }
}

function pluralize(label: string): string {
  if (label.endsWith("s") || label.endsWith("ch") || label.endsWith("sh")) {
    return label + "es";
  }
  if (label.endsWith("y")) return label.slice(0, -1) + "ies";
  return label + "s";
}
