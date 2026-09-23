import { getProfile, updateProfile } from "@/features/privacy/server/service";

export function GET() {
  return getProfile();
}

export function PATCH(request: Request) {
  return updateProfile(request);
}
