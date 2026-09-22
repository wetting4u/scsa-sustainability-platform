import { createAdminChallenge } from "@/features/challenges/server/admin-service";

export function POST(request: Request) {
  return createAdminChallenge(request);
}