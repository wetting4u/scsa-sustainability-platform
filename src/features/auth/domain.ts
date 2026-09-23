export type PasswordRequirement = {
  label: string;
  valid: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "At least one lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "At least one number",
      valid: /\d/.test(password),
    },
    {
      label: "At least one special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isStrongPassword(password: string): boolean {
  return passwordRequirements(password).every(
    (requirement) => requirement.valid,
  );
}

type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const messagesByCode: Record<string, string> = {
  email_not_confirmed: "Confirm your email before signing in.",
  email_exists: "This email is already registered. Try signing in instead.",
  invalid_credentials: "Email or password is incorrect.",
  otp_expired: "The verification code is invalid or expired.",
  over_email_send_rate_limit: "Please wait before requesting another email.",
  over_request_rate_limit: "Too many attempts. Please wait and try again.",
  same_password: "Choose a password you have not used for this account.",
  user_already_exists:
    "This email is already registered. Try signing in instead.",
  weak_password:
    "Use at least 8 characters with uppercase, lowercase, number, and special character.",
};

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const value = error as AuthErrorLike;
  const code = typeof value.code === "string" ? value.code : "";

  if (code && messagesByCode[code]) {
    return messagesByCode[code];
  }

  if (value.status === 429) {
    return "Too many attempts. Please wait and try again.";
  }

  return fallback;
}
