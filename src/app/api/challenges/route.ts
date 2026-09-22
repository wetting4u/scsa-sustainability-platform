import { allRows, handle, json, session } from "@/lib/api";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return handle(async () => {
    const { db, userId } = await session(request);
    const challenges = await allRows((from, to) =>
      db
        .from("challenges")
        .select(
          "id,title,description,resource,target,start_date,end_date,tag,icon",
        )
        .eq("is_active", true)
        .order("start_date")
        .order("id")
        .range(from, to),
    );
    const memberships = await allRows((from, to) =>
      db
        .from("challenge_memberships")
        .select("challenge_id,joined_at")
        .eq("user_id", userId)
        .order("challenge_id")
        .range(from, to),
    );
    const joined = new Map(
      memberships.map((m) => [m.challenge_id, m.joined_at]),
    );
    return json(
      challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        resource: c.resource,
        target: Number(c.target),
        start: c.start_date,
        end: c.end_date,
        tag: c.tag,
        icon: c.icon,
        duration: `${Math.round((Date.parse(c.end_date) - Date.parse(c.start_date)) / 86400000) + 1} days`,
        joined: joined.has(c.id),
        joinedAt: joined.get(c.id) ?? null,
      })),
    );
  });
}
