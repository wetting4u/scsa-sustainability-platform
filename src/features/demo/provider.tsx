"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { initialGoals, initialRecords } from "@/mocks/data";
import type { Goal, UsageRecord } from "@/features/records/domain";
type DemoState = {
  records: UsageRecord[];
  setRecords: React.Dispatch<React.SetStateAction<UsageRecord[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  joined: string[];
  setJoined: React.Dispatch<React.SetStateAction<string[]>>;
  analytics: boolean;
  setAnalytics: (v: boolean) => void;
  leaderboard: boolean;
  setLeaderboard: (v: boolean) => void;
  household: string;
  setHousehold: (v: string) => void;
  reset: () => void;
};
const DemoContext = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState(initialRecords);
  const [goals, setGoals] = useState(initialGoals);
  const [joined, setJoined] = useState<string[]>(["c1"]);
  const [analytics, setAnalytics] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false);
  const [household, setHousehold] = useState("Green Gum Household");
  function reset() {
    setRecords(initialRecords);
    setGoals(initialGoals);
    setJoined(["c1"]);
    setAnalytics(false);
    setLeaderboard(false);
    setHousehold("Green Gum Household");
  }
  return (
    <DemoContext.Provider
      value={{
        records,
        setRecords,
        goals,
        setGoals,
        joined,
        setJoined,
        analytics,
        setAnalytics,
        leaderboard,
        setLeaderboard,
        household,
        setHousehold,
        reset,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider missing");
  return value;
}
