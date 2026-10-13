/** yyyy-mm-dd in the user's LOCAL time zone (toISOString() would give the UTC date,
 *  which is "yesterday" for users in e.g. India during the early morning). */
export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(new Date(y, m - 1, d + days));
}

/** Monday of the week containing the given date. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (date.getDay() + 6) % 7; // Monday = 0
  return toIso(new Date(y, m - 1, d - offset));
}

export function monthStartIso(): string {
  const now = new Date();
  return toIso(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function weekdayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
