import {
  freezeOwnAccount,
  unfreezeOwnAccount,
} from "@/features/account/server/lifecycle";

export function POST() {
  return freezeOwnAccount();
}

export function DELETE() {
  return unfreezeOwnAccount();
}
