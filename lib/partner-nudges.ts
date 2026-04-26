import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/plan-data";

export type NudgeType = "cardio" | "workout" | "meals" | "supps";

const NUDGE_TEMPLATES: Record<NudgeType, string> = {
  cardio: "{name} just finished AM cardio 💪",
  workout: "{name} crushed today's workout 🔥",
  meals: "{name} is on track with meals ✓",
  supps: "{name} just took their evening supps",
};

const PARTNER_TOGGLE: Record<NudgeType, keyof PartnerToggles> = {
  cardio: "partner_cardio",
  workout: "partner_workout",
  meals: "partner_meals",
  supps: "partner_supps",
};

type PartnerToggles = {
  partner_cardio: boolean;
  partner_workout: boolean;
  partner_meals: boolean;
  partner_supps: boolean;
};

// Map item_keys that should trigger a nudge to their nudge type.
// meal_2 is the only meal_X that fires (avoids 4x spam per day).
function nudgeTypeFor(itemKey: string): NudgeType | null {
  if (itemKey === "am_cardio") return "cardio";
  if (itemKey === "workout_complete") return "workout";
  if (itemKey === "meal_2") return "meals";
  if (itemKey === "supp_mag") return "supps";
  return null;
}

function partnerOf(person: Person): Person {
  return person === "gabby" ? "jon" : "gabby";
}

function capitalize(p: Person): string {
  return p === "gabby" ? "Gabby" : "Jon";
}

// Fire a partner nudge if the partner has the relevant toggle enabled.
// The unique constraint on (from_person, to_person, nudge_type, day_num)
// prevents duplicate nudges for the same category on the same day.
export async function maybeNudgePartner(
  fromPerson: Person,
  dayNum: number,
  itemKey: string
): Promise<void> {
  const nudgeType = nudgeTypeFor(itemKey);
  if (!nudgeType) return;
  const toPerson = partnerOf(fromPerson);

  // Read partner's notification preferences. Silently no-op on any error
  // (table may not exist yet pre-migration, or row may be missing).
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("partner_cardio, partner_workout, partner_meals, partner_supps")
    .eq("person", toPerson)
    .maybeSingle();

  if (!settings) return;
  const toggleKey = PARTNER_TOGGLE[nudgeType];
  if (!(settings as PartnerToggles)[toggleKey]) return;

  const message = NUDGE_TEMPLATES[nudgeType].replace(
    "{name}",
    capitalize(fromPerson)
  );

  await supabase
    .from("partner_nudges")
    .upsert(
      {
        from_person: fromPerson,
        to_person: toPerson,
        nudge_type: nudgeType,
        day_num: dayNum,
        message,
      },
      {
        onConflict: "from_person,to_person,nudge_type,day_num",
        ignoreDuplicates: true,
      }
    );
}
