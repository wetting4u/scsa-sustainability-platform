import { isStrongPassword } from "../auth/domain.ts";

export type AccountRole = "household" | "admin";

export type AdminManagedUser = {
  id: string;
  email: string;
  householdName: string;
  householdSize: number;
  role: AccountRole;
  status: "active" | "disabled";
  createdAt: string;
};

export type CreateAdminUserInput = {
  email: string;
  password: string;
  householdName: string;
  householdSize: number;
};

export type UpdateAdminUserInput = {
  email?: string;
  householdName?: string;
  householdSize?: number;
  disabled?: boolean;
};

export type AdminUserInputError = {
  code: string;
  message: string;
};

type ValidationResult<T> =
  { data: T; error: null } | { data: null; error: AdminUserInputError };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function invalid(code: string, message: string): ValidationResult<never> {
  return {
    data: null,
    error: { code, message },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyFields(
  value: Record<string, unknown>,
  allowedFields: readonly string[],
) {
  return Object.keys(value).every((field) => allowedFields.includes(field));
}

export function validateCreateAdminUser(
  value: unknown,
): ValidationResult<CreateAdminUserInput> {
  if (!isObject(value)) {
    return invalid("INVALID_USER", "Enter valid user information.");
  }

  const allowedFields = [
    "email",
    "password",
    "householdName",
    "householdSize",
  ] as const;

  if (!hasOnlyFields(value, allowedFields)) {
    return invalid(
      "UNSUPPORTED_FIELD",
      "Only email, password, household name, and household size can be provided.",
    );
  }

  if (
    typeof value.email !== "string" ||
    typeof value.password !== "string" ||
    typeof value.householdName !== "string" ||
    typeof value.householdSize !== "number"
  ) {
    return invalid("INVALID_USER", "Enter valid user information.");
  }

  const input: CreateAdminUserInput = {
    email: value.email.trim().toLowerCase(),
    password: value.password,
    householdName: value.householdName.trim(),
    householdSize: value.householdSize,
  };

  if (!emailPattern.test(input.email)) {
    return invalid("INVALID_EMAIL", "Enter a valid email address.");
  }

  if (!isStrongPassword(input.password)) {
    return invalid(
      "INVALID_PASSWORD",
      "Password must contain at least 8 characters, uppercase and lowercase letters, a number, and a special character.",
    );
  }

  if (!input.householdName || input.householdName.length > 60) {
    return invalid(
      "INVALID_HOUSEHOLD_NAME",
      "Enter a household name of no more than 60 characters.",
    );
  }

  if (
    !Number.isInteger(input.householdSize) ||
    input.householdSize < 1 ||
    input.householdSize > 20
  ) {
    return invalid(
      "INVALID_HOUSEHOLD_SIZE",
      "Household size must be between 1 and 20.",
    );
  }

  return { data: input, error: null };
}

export function validateUpdateAdminUser(
  value: unknown,
): ValidationResult<UpdateAdminUserInput> {
  if (!isObject(value)) {
    return invalid("INVALID_USER_UPDATE", "Enter valid user information.");
  }

  const allowedFields = [
    "email",
    "householdName",
    "householdSize",
    "disabled",
  ] as const;

  if (!hasOnlyFields(value, allowedFields)) {
    return invalid(
      "UNSUPPORTED_FIELD",
      "Only email, household name, household size, and account status can be changed.",
    );
  }

  if (Object.keys(value).length === 0) {
    return invalid("NO_CHANGES", "No user changes were provided.");
  }

  const input: UpdateAdminUserInput = {};

  if (value.email !== undefined) {
    if (typeof value.email !== "string") {
      return invalid("INVALID_EMAIL", "Enter a valid email address.");
    }

    input.email = value.email.trim().toLowerCase();

    if (!emailPattern.test(input.email)) {
      return invalid("INVALID_EMAIL", "Enter a valid email address.");
    }
  }

  if (value.householdName !== undefined) {
    if (typeof value.householdName !== "string") {
      return invalid(
        "INVALID_HOUSEHOLD_NAME",
        "Enter a household name of no more than 60 characters.",
      );
    }

    input.householdName = value.householdName.trim();

    if (!input.householdName || input.householdName.length > 60) {
      return invalid(
        "INVALID_HOUSEHOLD_NAME",
        "Enter a household name of no more than 60 characters.",
      );
    }
  }

  if (value.householdSize !== undefined) {
    if (
      typeof value.householdSize !== "number" ||
      !Number.isInteger(value.householdSize) ||
      value.householdSize < 1 ||
      value.householdSize > 20
    ) {
      return invalid(
        "INVALID_HOUSEHOLD_SIZE",
        "Household size must be between 1 and 20.",
      );
    }

    input.householdSize = value.householdSize;
  }

  if (value.disabled !== undefined) {
    if (typeof value.disabled !== "boolean") {
      return invalid("INVALID_STATUS", "Enter a valid user status.");
    }

    input.disabled = value.disabled;
  }

  return { data: input, error: null };
}
