export type AdminAccessFailure = {
  status: 401 | 403 | 500;
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "ROLE_CHECK_FAILED";
  message: string;
};

export function getAdminAccessFailure(input: {
  authenticated: boolean;
  role?: string | null;
  roleCheckFailed?: boolean;
}): AdminAccessFailure | null {
  if (!input.authenticated) {
    return {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "You must sign in before using administrator features.",
    };
  }

  if (input.roleCheckFailed) {
    return {
      status: 500,
      code: "ROLE_CHECK_FAILED",
      message: "Unable to verify administrator access.",
    };
  }

  if (input.role !== "admin") {
    return {
      status: 403,
      code: "FORBIDDEN",
      message: "Administrator access is required.",
    };
  }

  return null;
}
