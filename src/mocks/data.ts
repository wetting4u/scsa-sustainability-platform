import type { Goal, UsageRecord } from "@/features/records/domain";
export const initialRecords: UsageRecord[] = [
  {
    id: "e1",
    resource: "electricity",
    start: "2026-09-01",
    end: "2026-09-07",
    amount: 64,
  },
  {
    id: "e2",
    resource: "electricity",
    start: "2026-09-08",
    end: "2026-09-14",
    amount: 58,
  },
  {
    id: "w1",
    resource: "water",
    start: "2026-09-01",
    end: "2026-09-07",
    amount: 1900,
  },
  {
    id: "w2",
    resource: "water",
    start: "2026-09-08",
    end: "2026-09-14",
    amount: 1750,
  },
  {
    id: "r1",
    resource: "waste",
    start: "2026-09-01",
    end: "2026-09-07",
    amount: 7.5,
  },
  {
    id: "r2",
    resource: "waste",
    start: "2026-09-08",
    end: "2026-09-14",
    amount: 6,
  },
];
export const initialGoals: Goal[] = [
  {
    id: "g1",
    title: "A little less electricity",
    resource: "electricity",
    target: 280,
    start: "2026-09-01",
    end: "2026-09-30",
  },
  {
    id: "g2",
    title: "Make every drop count",
    resource: "water",
    target: 8000,
    start: "2026-09-01",
    end: "2026-09-30",
  },
];
export const challenges = [
  {
    id: "c1",
    title: "The lighter bin challenge",
    resource: "waste" as const,
    tag: "WASTE LESS",
    description:
      "Notice what goes into your bin. Keep your household waste below 15 kg over a fortnight.",
    target: 15,
    start: "2026-09-01",
    end: "2026-09-14",
    duration: "14 days",
    icon: "sprout",
  },
  {
    id: "c2",
    title: "Switch off, save a little",
    resource: "electricity" as const,
    tag: "ENERGY SAVER",
    description:
      "Build a habit of switching off unused appliances. Aim for no more than 65 kWh in a week.",
    target: 65,
    start: "2026-09-15",
    end: "2026-09-21",
    duration: "7 days",
    icon: "bolt",
  },
  {
    id: "c3",
    title: "Small drops, big difference",
    resource: "water" as const,
    tag: "WATER WISE",
    description:
      "Try shorter showers and mindful watering. Keep your weekly household water use below 2,000 L.",
    target: 2000,
    start: "2026-09-15",
    end: "2026-09-21",
    duration: "7 days",
    icon: "drop",
  },
];
