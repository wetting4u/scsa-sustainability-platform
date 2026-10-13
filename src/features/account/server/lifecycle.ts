import "server-only";

import { withAccountFrozenMetadata } from "@/features/account/lifecycle";
import {
  requireActiveUser,
  requireAuthenticatedAccount,
} from "@/features/auth/server/authorization";
import { apiError, noStoreHeaders } from "@/lib/api/response";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

function adminClientUnavailable() {
  return apiError(
    503,
    "ACCOUNT_SERVICE_UNAVAILABLE",
    "Account settings are not available right now.",
  );
}

export async function resetOwnAccountProgress() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const { error } = await authorization.supabase.rpc("clear_my_account_data");

  if (error) {
    return apiError(
      500,
      "ACCOUNT_RESET_FAILED",
      "Unable to reset your account progress.",
    );
  }

  return Response.json(
    { data: { reset: true } },
    { status: 200, headers: noStoreHeaders },
  );
}

export async function freezeOwnAccount() {
  const authorization = await requireActiveUser();

  if (!authorization.ok) {
    return authorization.response;
  }

  const adminResult = tryCreateAdminClient();

  if (!adminResult.ok) {
    return adminClientUnavailable();
  }

  const appMetadata = withAccountFrozenMetadata(
    authorization.user.app_metadata,
    true,
  );
  const { error } = await adminResult.client.auth.admin.updateUserById(
    authorization.userId,
    { app_metadata: appMetadata },
  );

  if (error) {
    return apiError(
      500,
      "ACCOUNT_FREEZE_FAILED",
      "Unable to freeze your account.",
    );
  }

  return Response.json(
    { data: { frozen: true } },
    { status: 200, headers: noStoreHeaders },
  );
}

export async function unfreezeOwnAccount() {
  const authorization = await requireAuthenticatedAccount();

  if (!authorization.ok) {
    return authorization.response;
  }

  const adminResult = tryCreateAdminClient();

  if (!adminResult.ok) {
    return adminClientUnavailable();
  }

  const appMetadata = withAccountFrozenMetadata(
    authorization.user.app_metadata,
    false,
  );
  const { error } = await adminResult.client.auth.admin.updateUserById(
    authorization.userId,
    { app_metadata: appMetadata },
  );

  if (error) {
    return apiError(
      500,
      "ACCOUNT_UNFREEZE_FAILED",
      "Unable to unfreeze your account.",
    );
  }

  return Response.json(
    { data: { frozen: false } },
    { status: 200, headers: noStoreHeaders },
  );
}
