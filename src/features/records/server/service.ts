import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  validateRecord,
  type Resource,
  type UsageRecord,
} from "../domain";

type UsageRecordRow = {
  id: string;
  resource: Resource;
  start_date: string;
  end_date: string;
  amount: number | string;
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

export async function listRecords() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before viewing usage records.",
    );
  }

  const { data, error } = await supabase
    .from("usage_records")
    .select("id, resource, start_date, end_date, amount")
    .eq("user_id", user.id)
    .order("end_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(
      500,
      "RECORDS_QUERY_FAILED",
      "Unable to load usage records.",
    );
  }

  const rows = (data ?? []) as UsageRecordRow[];

  const records: UsageRecord[] = rows.map((row) => ({
    id: row.id,
    resource: row.resource,
    start: row.start_date,
    end: row.end_date,
    amount: Number(row.amount),
  }));

  return Response.json(
    { data: records },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
export async function createRecord(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before creating usage records.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid record information.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "INVALID_RECORD", "Enter valid record information.");
  }

  const values = body as Record<string, unknown>;

  const record: Omit<UsageRecord, "id"> = {
    resource: String(values.resource ?? "") as Resource,
    start: String(values.start ?? ""),
    end: String(values.end ?? ""),
    amount: Number(values.amount),
  };

  const validationError = validateRecord(record);

  if (validationError) {
    return apiError(400, "VALIDATION_ERROR", validationError);
  }

  const { data: overlappingRecord, error: overlapError } = await supabase
    .from("usage_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("resource", record.resource)
    .lte("start_date", record.end)
    .gte("end_date", record.start)
    .limit(1)
    .maybeSingle();

  if (overlapError) {
    return apiError(
      500,
      "OVERLAP_CHECK_FAILED",
      "Unable to check the record period.",
    );
  }

  if (overlappingRecord) {
    return apiError(
      409,
      "OVERLAPPING_RECORD",
      "This period overlaps an existing record for this resource.",
    );
  }

  const { data, error } = await supabase
    .from("usage_records")
    .insert({
      user_id: user.id,
      resource: record.resource,
      start_date: record.start,
      end_date: record.end,
      amount: record.amount,
    })
    .select("id, resource, start_date, end_date, amount")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return apiError(
        409,
        "OVERLAPPING_RECORD",
        "This period overlaps an existing record for this resource.",
      );
    }

    return apiError(
      500,
      "RECORD_CREATE_FAILED",
      "Unable to create the usage record.",
    );
  }

  const row = data as UsageRecordRow;

  const createdRecord: UsageRecord = {
    id: row.id,
    resource: row.resource,
    start: row.start_date,
    end: row.end_date,
    amount: Number(row.amount),
  };

  return Response.json(
    { data: createdRecord },
    {
      status: 201,
      headers: noStoreHeaders,
    },
  );
}
export async function updateRecord(request: Request, recordId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before updating usage records.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Enter valid record information.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return apiError(400, "INVALID_RECORD", "Enter valid record information.");
  }

  const values = body as Record<string, unknown>;

  const record: Omit<UsageRecord, "id"> = {
    resource: String(values.resource ?? "") as Resource,
    start: String(values.start ?? ""),
    end: String(values.end ?? ""),
    amount: Number(values.amount),
  };

  const validationError = validateRecord(record);

  if (validationError) {
    return apiError(400, "VALIDATION_ERROR", validationError);
  }

  const { data: overlappingRecord, error: overlapError } = await supabase
    .from("usage_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("resource", record.resource)
    .neq("id", recordId)
    .lte("start_date", record.end)
    .gte("end_date", record.start)
    .limit(1)
    .maybeSingle();

  if (overlapError) {
    return apiError(
      500,
      "OVERLAP_CHECK_FAILED",
      "Unable to check the record period.",
    );
  }

  if (overlappingRecord) {
    return apiError(
      409,
      "OVERLAPPING_RECORD",
      "This period overlaps an existing record for this resource.",
    );
  }

  const { data, error } = await supabase
    .from("usage_records")
    .update({
      resource: record.resource,
      start_date: record.start,
      end_date: record.end,
      amount: record.amount,
    })
    .eq("id", recordId)
    .eq("user_id", user.id)
    .select("id, resource, start_date, end_date, amount")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      return apiError(
        409,
        "OVERLAPPING_RECORD",
        "This period overlaps an existing record for this resource.",
      );
    }

    return apiError(
      500,
      "RECORD_UPDATE_FAILED",
      "Unable to update the usage record.",
    );
  }

  if (!data) {
    return apiError(404, "RECORD_NOT_FOUND", "Usage record not found.");
  }

  const row = data as UsageRecordRow;

  const updatedRecord: UsageRecord = {
    id: row.id,
    resource: row.resource,
    start: row.start_date,
    end: row.end_date,
    amount: Number(row.amount),
  };

  return Response.json(
    { data: updatedRecord },
    {
      status: 200,
      headers: noStoreHeaders,
    },
  );
}
export async function deleteRecord(recordId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError(
      401,
      "UNAUTHENTICATED",
      "You must sign in before deleting usage records.",
    );
  }

  const { data, error } = await supabase
    .from("usage_records")
    .delete()
    .eq("id", recordId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiError(
      500,
      "RECORD_DELETE_FAILED",
      "Unable to delete the usage record.",
    );
  }

  if (!data) {
    return apiError(404, "RECORD_NOT_FOUND", "Usage record not found.");
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
export function recordsNotConfigured() {
  return apiError(
    501,
    "NOT_IMPLEMENTED",
    "Creating persistent records is not enabled yet.",
  );
}