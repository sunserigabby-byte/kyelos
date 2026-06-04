// Local-time date helpers.
// `new Date().toISOString()` uses UTC, which silently rolls to tomorrow
// after ~8pm Eastern. These helpers stay in the user's local zone.

export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocalYYYYMM(): string {
  return todayLocalISO().slice(0, 7);
}

// Inclusive: same day → 1, next day → 2.
export function daysSince(startISO: string, now: Date = new Date()): number {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = today.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAYS  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS  = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "Wed, Jun 3" from a YYYY-MM-DD string. Interpreted in local time.
export function displayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${SHORT_DAYS[dt.getDay()]}, ${SHORT_MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

// "Wednesday, June 3, 2026"
export function displayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${LONG_DAYS[dt.getDay()]}, ${LONG_MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

// "Jun 3, 2026" — terse, with year.
export function displayWithYear(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${SHORT_MONTHS[m - 1]} ${d}, ${y}`;
}

// "Jun" from YYYY-MM
export function monthLabel(yyyyMm: string): string {
  const m = Number(yyyyMm.split("-")[1]);
  return SHORT_MONTHS[m - 1] ?? "";
}

// "June 2026" from YYYY-MM
export function monthLongLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return `${LONG_MONTHS[m - 1]} ${y}`;
}
