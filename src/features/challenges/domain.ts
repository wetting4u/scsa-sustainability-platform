import type { Resource } from "@/features/records/domain";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  resource: Resource;
  target: number;
  rewardPoints: number | null;
  start: string;
  end: string;
  tag: string;
  icon: string;
  minHouseholdSize?: number | null;
  maxHouseholdSize?: number | null;
  duration: string;
};

export type ChallengeInput = Omit<Challenge, "id" | "duration">;
