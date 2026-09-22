import "server-only";
import type { Goal } from "@/features/records/domain";
export const goalColumns = "id,title,resource,target,start_date,end_date";
export function goalRow(row: {
  id: string;
  title: string;
  resource: Goal["resource"];
  target: number;
  start_date: string;
  end_date: string;
}): Goal {
  return {
    id: row.id,
    title: row.title,
    resource: row.resource,
    target: Number(row.target),
    start: row.start_date,
    end: row.end_date,
  };
}
export function goalWrite(goal: Omit<Goal, "id">) {
  return {
    title: goal.title,
    resource: goal.resource,
    target: goal.target,
    start_date: goal.start,
    end_date: goal.end,
  };
}
