import "server-only";
import { requireActiveUser } from "@/features/auth/server/authorization";
import { apiError, noStoreHeaders } from "@/lib/api/response";
import { adelaideToday } from "@/lib/periods";
import { evaluateGoal } from "../domain";
import type { Goal, Resource, UsageRecord } from "@/features/records/domain";

type GoalRow = {
  id: string;
  title: string;
  resource: Resource;
  target: number | string;
  start_date: string;
  end_date: string;
};
type RecordRow = {
  id: string;
  resource: Resource;
  amount: number | string;
  start_date: string;
  end_date: string;
};

export async function listGoalBadges() {
  const auth = await requireActiveUser();
  if (!auth.ok) return auth.response;
  const { supabase, userId } = auth;
  // Fetch every page: a truncated history could incorrectly turn an exceeded goal into a badge.
  async function readRows(table: "goals" | "usage_records", columns: string) {
    const rows: unknown[] = [];
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .eq("user_id", userId)
        .order("id")
        .range(rows.length, rows.length + 999);
      if (error) throw error;
      if (!data?.length) return rows;
      rows.push(...data);
    }
  }
  try {
    const [goalRows, recordRows] = await Promise.all([
      readRows("goals", "id,title,resource,target,start_date,end_date"),
      readRows("usage_records", "id,resource,amount,start_date,end_date"),
    ]);
    const records: UsageRecord[] = (recordRows as RecordRow[]).map((r) => ({
      id: r.id,
      resource: r.resource,
      amount: Number(r.amount),
      start: r.start_date,
      end: r.end_date,
    }));
    const today = adelaideToday();
    const data = (goalRows as GoalRow[])
      .map((r) => {
        const goal: Goal = {
          id: r.id,
          title: r.title,
          resource: r.resource,
          target: Number(r.target),
          start: r.start_date,
          end: r.end_date,
        };
        return evaluateGoal(goal, records, today);
      })
      .sort((a, b) => b.end.localeCompare(a.end) || a.id.localeCompare(b.id));
    return Response.json({ data, asOf: today }, { headers: noStoreHeaders });
  } catch {
    return apiError(
      500,
      "BADGES_QUERY_FAILED",
      "Unable to load your goal badges. Please try again.",
    );
  }
}
