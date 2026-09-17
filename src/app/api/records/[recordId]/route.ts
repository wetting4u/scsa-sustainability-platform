import { recordsNotConfigured } from "@/features/records/server/service";

export function PATCH() {
  return recordsNotConfigured();
}

export function DELETE() {
  return recordsNotConfigured();
}
