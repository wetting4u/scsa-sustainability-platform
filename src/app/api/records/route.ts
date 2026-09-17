import { recordsNotConfigured } from "@/features/records/server/service";

export function GET() {
  return recordsNotConfigured();
}

export function POST() {
  return recordsNotConfigured();
}
