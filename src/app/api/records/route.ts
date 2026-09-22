import {
  createRecord,
  listRecords,
} from "@/features/records/server/service";

export async function GET() {
  return listRecords();
}

export async function POST(request: Request) {
  return createRecord(request);
}