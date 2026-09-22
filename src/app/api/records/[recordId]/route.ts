import {
  deleteRecord,
  updateRecord,
} from "@/features/records/server/service";

type RouteContext = {
  params: Promise<{
    recordId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { recordId } = await context.params;

  return updateRecord(request, recordId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { recordId } = await context.params;

  return deleteRecord(recordId);
}