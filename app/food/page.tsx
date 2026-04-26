import { avoidList, foodCategories, type FoodItem } from "@/lib/food-lists";

export default function FoodPage() {
  return (
    <div>
      {/* Callout banner */}
      <div className="bg-gold-light border-l-4 border-gold rounded-r-md p-4 mb-6">
        <p className="text-sm text-navy leading-relaxed">
          Swap any protein for another lean protein at the same portion. Same
          for carbs, fats, veggies. Stay within your macros.
        </p>
      </div>

      {foodCategories.map((cat) => (
        <section key={cat.title} className="mb-6">
          <div className="border-b-2 border-gold/60 pb-1 mb-3">
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              {cat.title}
            </h2>
            <p className="text-xs text-gray-500 italic mt-0.5">
              {cat.subtitle}
            </p>
          </div>
          <ul className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {cat.items.map((item) => (
              <FoodRow key={item.name} item={item} />
            ))}
          </ul>
        </section>
      ))}

      {/* AVOID section */}
      <section className="mb-2">
        <div className="border-b-2 border-red-500/60 pb-1 mb-3">
          <h2 className="text-red-700 font-bold text-sm uppercase tracking-wider">
            Avoid — All 7 Days
          </h2>
          <p className="text-xs text-red-700/70 italic mt-0.5">
            Stick to this and the cut works. Slip and you stall.
          </p>
        </div>
        <ul className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          {avoidList.map((line) => (
            <li
              key={line}
              className="text-sm text-red-900 leading-relaxed flex gap-2"
            >
              <span className="text-red-600 font-bold flex-shrink-0">✕</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FoodRow({ item }: { item: FoodItem }) {
  return (
    <li className="p-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-semibold text-navy text-sm">{item.name}</div>
        <div className="text-xs text-gray-600 flex-shrink-0 text-right">
          {item.serving}
        </div>
      </div>
      {(item.macros || item.note) && (
        <div className="text-xs text-gray-500 mt-0.5">
          {item.macros}
          {item.macros && item.note ? " · " : ""}
          {item.note && <span className="italic">{item.note}</span>}
        </div>
      )}
    </li>
  );
}
