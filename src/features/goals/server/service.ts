import "server-only";
import { validatePeriod, validatePeriodChange } from "@/lib/periods";

import { requireActiveUser } from "@/features/auth/server/authorization";
import { resources, type Goal, type Resource } from "@/features/records/domain";

type GoalRow = {
  id: string;
  title: string;
  resource: Resource;
  target: number | string;
  start_date: string;
  end_date: string;
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

function apiError(status: number, code: string, message: string) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    resource: row.resource,
    target: Number(row.target),
    start: row.start_date,
    end: row.end_date,
  };
}

export async function listGoals() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const { data, error } = await supabase
    .from("goals")
    .select("id, title, resource, target, start_date, end_date")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(500, "GOALS_QUERY_FAILED", "Unable to load goals.");
  }

  const goals = ((data ?? []) as GoalRow[]).map(mapGoal);

  return Response.json(
    {
      data: goals,
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function createGoal(request: Request) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid goal information.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "INVALID_GOAL", "Enter valid goal information.");
  }

  const values = body as Record<string, unknown>;
  const resourceValue = String(values.resource ?? "");

  if (!Object.prototype.hasOwnProperty.call(resources, resourceValue)) {
    return apiError(400, "VALIDATION_ERROR", "Choose a valid resource.");
  }

  const goal: Omit<Goal, "id"> = {
    title: String(values.title ?? "").trim(),
    resource: resourceValue as Resource,
    target: Number(values.target),
    start: String(values.start ?? ""),
    end: String(values.end ?? ""),
  };

  if (!goal.title || goal.title.length > 80) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Enter a goal name containing no more than 80 characters.",
    );
  }

  if (
    !Number.isFinite(goal.target) ||
    goal.target <= 0 ||
    goal.target > resources[goal.resource].max
  ) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Enter a positive target within the allowed range.",
    );
  }

  if (
    !isValidDate(goal.start) ||
    !isValidDate(goal.end) ||
    goal.end < goal.start
  ) {
    return apiError(400, "VALIDATION_ERROR", "Enter a valid goal date period.");
  }

  const periodError = validatePeriod(goal, "goal");
  if (periodError) return apiError(400, "INVALID_PERIOD", periodError);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title: goal.title,
      resource: goal.resource,
      target: goal.target,
      start_date: goal.start,
      end_date: goal.end,
    })
    .select("id, title, resource, target, start_date, end_date")
    .single();

  if (error) {
    return apiError(500, "GOAL_CREATE_FAILED", "Unable to create the goal.");
  }

  return Response.json(
    {
      data: mapGoal(data as GoalRow),
    },
    {
      status: 201,
      headers: noStoreHeaders,
    },
  );
}
export async function updateGoal(request: Request, goalId: string) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid goal information.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "INVALID_GOAL", "Enter valid goal information.");
  }

  const values = body as Record<string, unknown>;
  const resourceValue = String(values.resource ?? "");

  if (!Object.prototype.hasOwnProperty.call(resources, resourceValue)) {
    return apiError(400, "VALIDATION_ERROR", "Choose a valid resource.");
  }

  const goal: Omit<Goal, "id"> = {
    title: String(values.title ?? "").trim(),
    resource: resourceValue as Resource,
    target: Number(values.target),
    start: String(values.start ?? ""),
    end: String(values.end ?? ""),
  };

  if (!goal.title || goal.title.length > 80) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Enter a goal name containing no more than 80 characters.",
    );
  }

  if (
    !Number.isFinite(goal.target) ||
    goal.target <= 0 ||
    goal.target > resources[goal.resource].max
  ) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Enter a positive target within the allowed range.",
    );
  }

  if (
    !isValidDate(goal.start) ||
    !isValidDate(goal.end) ||
    goal.end < goal.start
  ) {
    return apiError(400, "VALIDATION_ERROR", "Enter a valid goal date period.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("goals")
    .select("start_date, end_date")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError)
    return apiError(
      500,
      "GOAL_QUERY_FAILED",
      "Unable to check the saved goal.",
    );
  if (!existing) return apiError(404, "GOAL_NOT_FOUND", "Goal not found.");
  const periodError = validatePeriodChange(
    goal,
    { start: existing.start_date, end: existing.end_date },
    "goal",
  );
  if (periodError) return apiError(400, "INVALID_PERIOD", periodError);

  const { data, error } = await supabase
    .from("goals")
    .update({
      title: goal.title,
      resource: goal.resource,
      target: goal.target,
      start_date: goal.start,
      end_date: goal.end,
    })
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("id, title, resource, target, start_date, end_date")
    .maybeSingle();

  if (error) {
    return apiError(500, "GOAL_UPDATE_FAILED", "Unable to update the goal.");
  }

  if (!data) {
    return apiError(404, "GOAL_NOT_FOUND", "Goal not found.");
  }

  return Response.json(
    {
      data: mapGoal(data as GoalRow),
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}

export async function deleteGoal(goalId: string) {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { supabase, userId } = authorization;

  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiError(500, "GOAL_DELETE_FAILED", "Unable to delete the goal.");
  }

  if (!data) {
    return apiError(404, "GOAL_NOT_FOUND", "Goal not found.");
  }

  return Response.json(
    {
      data: {
        id: data.id,
      },
    },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
