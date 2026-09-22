import {
  deleteAdminUser,
  updateAdminUser,
} from "@/features/admin-users/server/service";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const { userId } = await context.params;

  return updateAdminUser(request, userId);
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { userId } = await context.params;

  return deleteAdminUser(userId);
}