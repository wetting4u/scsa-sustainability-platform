import {
  createAdminUser,
  listAdminUsers,
} from "@/features/admin-users/server/service";

export function GET() {
  return listAdminUsers();
}

export function POST(request: Request) {
  return createAdminUser(request);
}