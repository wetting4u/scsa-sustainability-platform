export type PeriodKind = "weekly" | "monthly";
export type PeriodScope = "goal" | "challenge";
export type DateRange = { start: string; end: string };

// Calendar arithmetic uses UTC only as a date container, not elapsed Adelaide hours.
export function adelaideToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0001-01-01") return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function shift(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekContaining(date: string): DateRange {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const start = shift(date, -((day + 6) % 7));
  return { start, end: shift(start, 6) };
}

export function monthContaining(date: string): DateRange {
  const start = `${date.slice(0, 7)}-01`;
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return { start, end: d.toISOString().slice(0, 10) };
}

export function periodKind(range: DateRange): PeriodKind | null {
  if (!validDate(range.start) || !validDate(range.end)) return null;
  const week = weekContaining(range.start);
  if (week.start === range.start && week.end === range.end) return "weekly";
  const month = monthContaining(range.start);
  return month.start === range.start && month.end === range.end
    ? "monthly"
    : null;
}

export function validatePeriod(
  range: DateRange,
  scope: PeriodScope,
  today = adelaideToday(),
): string | null {
  const kind = periodKind(range);
  if (!kind)
    return "Choose a complete Monday–Sunday week or a full calendar month.";
  if (range.end < today)
    return "Choose the current period or a future period, not a completed period.";
  if (scope === "goal") {
    const currentMonth = monthContaining(today);
    if (kind === "monthly" && range.start !== currentMonth.start)
      return "Monthly goals must use the current Adelaide calendar month.";
    if (
      kind === "weekly" &&
      (range.start < weekContaining(today).start ||
        range.start > currentMonth.end)
    )
      return "Choose the current week or a week starting later this month.";
  }
  return null;
}

export function validatePeriodChange(
  range: DateRange,
  existing: DateRange | undefined,
  scope: PeriodScope,
  today = adelaideToday(),
): string | null {
  // Only an unchanged period read from the database is grandfathered in.
  if (existing && range.start === existing.start && range.end === existing.end)
    return null;
  return validatePeriod(range, scope, today);
}

export function periodOptions(
  kind: PeriodKind,
  month: string,
  scope: PeriodScope,
  today = adelaideToday(),
): DateRange[] {
  const first = `${month}-01`;
  if (!validDate(first)) return [];
  const currentMonth = monthContaining(first);
  if (kind === "monthly")
    return validatePeriod(currentMonth, scope, today) ? [] : [currentMonth];
  const result: DateRange[] = [];
  let week = weekContaining(first);
  // Include the current cross-month week even when its Monday was last month.
  if (week.start < first && week.end < today)
    week = weekContaining(shift(week.start, 7));
  while (week.start <= currentMonth.end) {
    if (!validatePeriod(week, scope, today)) result.push(week);
    week = weekContaining(shift(week.start, 7));
  }
  return result;
}

export function periodLabel(range: DateRange): string {
  const format = (date: string) =>
    `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
  return `${format(range.start)} – ${format(range.end)}`;
}
