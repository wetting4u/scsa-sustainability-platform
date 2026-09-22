import { allRows, handle, json, session } from "@/lib/api";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const rows = await allRows((from, to) =>
      db
        .from("challenge_memberships")
        .select("challenge_id")
        .eq("user_id", userId)
        .order("challenge_id")
        .range(from, to),
    );
    return json(rows.map((row) => row.challenge_id));
  });
}
