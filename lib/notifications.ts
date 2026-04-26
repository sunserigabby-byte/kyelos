// Lightweight notification helpers — uses the browser Notification API only.
// No backend push server. Reminders fire via setTimeout while the app is open;
// when the app re-opens we surface any reminders whose times have passed in
// the last 30 min as a banner.

export type NotifKey =
  | "wake_supps"
  | "am_cardio"
  | "tea_2pm"
  | "pm_workout"
  | "wind_down";

export type NotifSettings = Record<NotifKey, boolean> & {
  partner_cardio: boolean;
  partner_workout: boolean;
  partner_meals: boolean;
  partner_supps: boolean;
};

export type ReminderDef = {
  key: NotifKey;
  hour: number;       // 0-23 local
  minute: number;
  title: string;
  body: string;
};

export const REMINDERS: ReminderDef[] = [
  { key: "wake_supps", hour: 5, minute: 30, title: "Wake up ☀️", body: "Coffee + electrolytes time" },
  { key: "am_cardio",  hour: 6, minute: 0,  title: "Cardio time 🚶", body: "30 min incline walk, fasted" },
  { key: "tea_2pm",    hour: 14, minute: 0, title: "Tea break 🍵", body: "Dandelion tea — cup 1" },
  { key: "pm_workout", hour: 16, minute: 0, title: "Workout in 30 min 💪", body: "Fuel up with Meal 3" },
  { key: "wind_down",  hour: 21, minute: 30, title: "Wind down 🌙", body: "Magnesium + dandelion tea" },
];

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notificationPermissionState():
  | "default"
  | "granted"
  | "denied"
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      ...options,
    });
  } catch {
    // Some browsers (Safari iOS) require a service-worker registration to
    // show notifications. Ignore — the in-app banner falls back.
  }
}

// Schedule a single reminder via setTimeout for the next occurrence within today.
// Returns the timeout id (or 0 if the time has already passed).
export function scheduleLocalReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): number {
  if (typeof window === "undefined") return 0;
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return window.setTimeout(() => {
    showNotification(title, body);
  }, diff);
}

// Returns reminders whose scheduled time was within the last `windowMin` minutes.
// Used to show "you missed this" banners when the user opens the app late.
export function recentlyDueReminders(
  enabled: NotifSettings,
  windowMin = 30
): ReminderDef[] {
  const now = new Date();
  const result: ReminderDef[] = [];
  for (const r of REMINDERS) {
    if (!enabled[r.key]) continue;
    const target = new Date();
    target.setHours(r.hour, r.minute, 0, 0);
    const diffMin = (now.getTime() - target.getTime()) / (60 * 1000);
    if (diffMin >= 0 && diffMin <= windowMin) {
      result.push(r);
    }
  }
  return result;
}
