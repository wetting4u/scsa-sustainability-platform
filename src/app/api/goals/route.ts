import { allRows, body, databaseError, handle, json, session } from "@/lib/api";
import { goalUsage, parseGoal } from "@/features/goals/domain";
import { goalColumns, goalRow, goalWrite } from "@/features/goals/server";
import type { UsageRecord } from "@/features/records/domain";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const goals = await allRows((from, to) =>
      db
        .from("goals")
        .select(goalColumns)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    );
    const records: UsageRecord[] = [];
    // Read every page: Supabase's default row limit must not truncate usage totals.
    if (goals.length)
      for (let offset = 0; ; offset += 500) {
        const page = await db
          .from("usage_records")
          .select("id,resource,amount,start_date,end_date")
          .eq("user_id", userId)
          .order("id")
          .range(offset, offset + 499);
        databaseError(page.error);
        for (const r of page.data ?? [])
          records.push({
            id: r.id,
            resource: r.resource,
            amount: Number(r.amount),
            start: r.start_date,
            end: r.end_date,
          });
        if ((page.data?.length ?? 0) < 500) break;
      }
    return json(
      goals.map((row) => {
        const goal = goalRow(row);
        return { ...goal, usage: goalUsage(goal, records) };
      }),
    );
  });
}
export function POST(request: Request) {
  return handle(async () => {
    const { db } = await session(request);
    const goal = parseGoal(await body(request));
    const result = await db
      .from("goals")
      .insert(goalWrite(goal))
      .select(goalColumns)
      .single();
    databaseError(result.error);
    return json(goalRow(result.data!), 201);
  });
}
