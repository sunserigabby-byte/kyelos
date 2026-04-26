export type FoodItem = {
  name: string;
  serving: string;
  macros: string;
  note?: string;
};

export type FoodCategory = {
  title: string;
  subtitle: string;
  items: FoodItem[];
};

export const foodCategories: FoodCategory[] = [
  {
    title: "Lean Proteins",
    subtitle: "Hit your protein target without eating into fat macro",
    items: [
      { name: "Chicken breast (skinless)", serving: "5 oz cooked", macros: "40g protein" },
      { name: "Turkey breast", serving: "5 oz cooked", macros: "40g protein" },
      { name: "99% lean ground turkey", serving: "5 oz cooked", macros: "35g protein" },
      { name: "White fish (cod, tilapia, halibut)", serving: "6 oz cooked", macros: "34g protein" },
      { name: "Shrimp", serving: "6 oz cooked", macros: "36g protein" },
      { name: "Canned tuna in water", serving: "1 can (5 oz)", macros: "30g protein" },
      { name: "Egg whites", serving: "6 whites (~1 cup liquid)", macros: "24g protein" },
      { name: "0% Greek yogurt (plain)", serving: "1 cup", macros: "22g protein" },
      { name: "Low-fat cottage cheese", serving: "1 cup", macros: "24g protein" },
      { name: "Whey isolate", serving: "1 scoop", macros: "25g protein" },
      { name: "Lean bison", serving: "5 oz cooked", macros: "35g protein" },
    ],
  },
  {
    title: "Fatty Proteins",
    subtitle: "Use 1x per day max",
    items: [
      { name: "Whole eggs", serving: "3 eggs", macros: "18g P + 15g F" },
      { name: "Salmon", serving: "4 oz cooked", macros: "25g P + 10g F" },
      { name: "93/7 ground turkey", serving: "5 oz cooked", macros: "32g P + 12g F" },
      { name: "90/10 ground beef", serving: "4 oz cooked", macros: "25g P + 12g F" },
      { name: "Chicken thighs", serving: "4 oz cooked", macros: "25g P + 10g F" },
      { name: "Sardines in water", serving: "1 can", macros: "23g P + 11g F" },
    ],
  },
  {
    title: "Carbs",
    subtitle: "Most carbs around training. 95g/day Gabby, 155g/day Jon",
    items: [
      { name: "Jasmine/basmati rice (cooked)", serving: "½ cup", macros: "22g carbs" },
      { name: "Sweet potato (baked)", serving: "½ medium", macros: "20g carbs" },
      { name: "White potato (baked)", serving: "½ medium", macros: "18g carbs" },
      { name: "Oats (dry, measured)", serving: "⅓ cup", macros: "20g carbs" },
      { name: "Quinoa (cooked)", serving: "½ cup", macros: "20g carbs" },
      { name: "Plain rice cakes (unsalted)", serving: "2 cakes", macros: "14g carbs" },
      { name: "Ezekiel bread", serving: "1 slice", macros: "15g carbs" },
      { name: "Banana (small)", serving: "1 small", macros: "23g carbs" },
      { name: "Berries", serving: "½ cup", macros: "8–10g carbs" },
      { name: "Apple", serving: "1 small", macros: "20g carbs" },
    ],
  },
  {
    title: "Fats (Whole Food)",
    subtitle: "Measure with a spoon, not by eye",
    items: [
      { name: "Olive oil (EVOO)", serving: "1 tbsp", macros: "14g fat" },
      { name: "Avocado", serving: "¼ fruit", macros: "8g fat" },
      { name: "Almonds (raw)", serving: "10–12 nuts", macros: "8g fat" },
      { name: "Almond butter (no sugar)", serving: "1 tbsp", macros: "9g fat" },
      { name: "Chia seeds", serving: "1 tbsp", macros: "4g fat" },
    ],
  },
  {
    title: "Vegetables",
    subtitle: "Essentially unlimited days 1–5. Avoid high-water veg on travel day morning",
    items: [
      { name: "Spinach, arugula, kale, romaine", serving: "2+ cups raw", macros: "" },
      { name: "Broccoli", serving: "1 cup cooked", macros: "" },
      { name: "Asparagus", serving: "1 cup", macros: "" },
      { name: "Zucchini / yellow squash", serving: "1 cup", macros: "" },
      { name: "Cauliflower", serving: "1 cup", macros: "" },
      { name: "Brussels sprouts", serving: "1 cup", macros: "" },
      { name: "Green beans", serving: "1 cup", macros: "" },
      { name: "Bell peppers", serving: "1 cup", macros: "" },
      { name: "Cucumber", serving: "1 cup", macros: "", note: "skip travel day morning" },
      { name: "Cherry tomatoes", serving: "1 cup", macros: "" },
      { name: "Mushrooms", serving: "1 cup", macros: "" },
      { name: "Onion, garlic, shallots", serving: "as desired", macros: "" },
      { name: "Lemon, lime", serving: "unlimited", macros: "" },
      { name: "Fresh herbs", serving: "unlimited", macros: "" },
    ],
  },
];

export const avoidList: string[] = [
  "Alcohol & sugary drinks (all)",
  "Dairy except plain 0% Greek yogurt or cottage cheese",
  "Refined carbs and baked goods (bread except Ezekiel, pasta, crackers, pastries, cereals)",
  "Processed/high-sodium (deli meats, bacon, sausage, canned soups, frozen meals, olives, pickles, jerky)",
  "Sauces (ketchup, BBQ, soy sauce, store-bought dressings, mayo)",
  "All restaurant food and takeout",
  "Sneaky bloat triggers (artificial sweeteners, sugar alcohols, protein bars, sugar-free gum, dried fruit)",
];
