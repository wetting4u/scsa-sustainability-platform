import "server-only";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/features/goals/domain";
export { ApiError };
export const json = (data: unknown, status = 200) =>
  Response.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
export async function session(request: Request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== new URL(request.url).origin)
    )
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Cross-origin writes are not allowed.",
      );
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new ApiError(
      503,
      "NOT_CONFIGURED",
      "Database connection is not configured.",
    );
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return { db, userId: data.user.id };
}
export async function body(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "Invalid JSON body.");
  }
}
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new ApiError(409, "CONFLICT", "This membership already exists.");
  if (["23514", "22P02", "22007", "22008", "22003"].includes(error.code ?? ""))
    throw new ApiError(400, "INVALID_INPUT", "Invalid field value.");
  if (error.code === "23503")
    throw new ApiError(
      409,
      "CONFLICT",
      "The referenced record is no longer available.",
    );
  if (error.code === "42501")
    throw new ApiError(403, "FORBIDDEN", "Operation is not permitted.");
  throw new ApiError(500, "DATABASE_ERROR", "The database operation failed.");
}
export async function handle(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    const e =
      error instanceof ApiError
        ? error
        : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
    return Response.json(
      { error: { code: e.code, message: e.message } },
      { status: e.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export async function allRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await fetchPage(offset, offset + 499);
    databaseError(page.error);
    rows.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < 500) return rows;
  }
}
