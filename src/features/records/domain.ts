export type Resource = "electricity" | "water" | "waste";
export type UsageRecord = {
  id: string;
  resource: Resource;
  start: string;
  end: string;
  amount: number;
};
export type Goal = {
  id: string;
  title: string;
  resource: Resource;
  target: number;
  start: string;
  end: string;
};
export const resources: Record<
  Resource,
  { label: string; unit: string; max: number }
> = {
  electricity: { label: "Electricity", unit: "kWh", max: 100000 },
  water: { label: "Water", unit: "L", max: 10000000 },
  waste: { label: "Waste", unit: "kg", max: 100000 },
};
export function validateRecord(record: Omit<UsageRecord, "id">): string | null {
  if (!(record.resource in resources)) return "Choose a valid resource.";
  if (
    !record.start ||
    !record.end ||
    !Number.isFinite(Date.parse(record.start)) ||
    !Number.isFinite(Date.parse(record.end))
  )
    return "Enter valid start and end dates.";
  if (record.end < record.start)
    return "The end date must be on or after the start date.";
  if (
    !Number.isFinite(record.amount) ||
    record.amount < 0 ||
    record.amount > resources[record.resource].max
  )
    return `Enter an amount between 0 and ${resources[record.resource].max.toLocaleString()} ${resources[record.resource].unit}.`;
  return null;
}
// Use only complete periods within the selected window. Never add unlike units.
export function totalFor(
  records: UsageRecord[],
  resource: Resource,
  start = "2026-09-01",
  end = "2026-09-30",
) {
  return records
    .filter((r) => r.resource === resource && r.start >= start && r.end <= end)
    .reduce((sum, r) => sum + r.amount, 0);
}
