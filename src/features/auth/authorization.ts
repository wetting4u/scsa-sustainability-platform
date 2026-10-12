export type AccountAccessFailure = {
  status: 401 | 403 | 503;
  code: "UNAUTHENTICATED" | "ACCOUNT_DISABLED" | "ACCOUNT_STATUS_UNAVAILABLE";
  message: string;
};

export function isAccountBanned(
  bannedUntil: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!bannedUntil) {
    return false;
  }

  const timestamp = Date.parse(bannedUntil);

  return Number.isFinite(timestamp) && timestamp > now;
}

export function getAccountAccessFailure(input: {
  authenticated: boolean;
  bannedUntil?: string | null;
  providerRejectedAsBanned?: boolean;
  statusCheckFailed?: boolean;
  now?: number;
}): AccountAccessFailure | null {
  if (input.statusCheckFailed) {
    return {
      status: 503,
      code: "ACCOUNT_STATUS_UNAVAILABLE",
      message: "Account access cannot be verified right now.",
    };
  }

  if (input.providerRejectedAsBanned) {
    return {
      status: 403,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled by an administrator.",
    };
  }

  if (!input.authenticated) {
    return {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "You must sign in before using this feature.",
    };
  }

  if (isAccountBanned(input.bannedUntil, input.now)) {
    return {
      status: 403,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled by an administrator.",
    };
  }

  return null;
}
