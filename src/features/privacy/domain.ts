import { findSensitiveWord } from "../../lib/validation/sensitive-words.ts";

export type HouseholdProfile = {
  displayName: string;
  householdSize: number;
  shareAnalytics: boolean;
  displayLeaderboard: boolean;
  communityAreaId: string | null;
};

export type HouseholdProfilePatch = Partial<HouseholdProfile>;

type ProfilePatchResult =
  | { data: HouseholdProfilePatch; error: null }
  | { data: null; error: string; code?: "SENSITIVE_WORD" };

const allowedProfileFields = new Set<keyof HouseholdProfile>([
  "displayName",
  "householdSize",
  "shareAnalytics",
  "displayLeaderboard",
  "communityAreaId",
]);

export function validateProfilePatch(input: unknown): ProfilePatchResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { data: null, error: "Enter valid household profile changes." };
  }

  const values = input as Record<string, unknown>;
  const fields = Object.keys(values);

  if (fields.some((field) => !allowedProfileFields.has(field as never))) {
    return {
      data: null,
      error: "The request contains a profile field that cannot be changed.",
    };
  }

  if (fields.length === 0) {
    return { data: null, error: "Provide at least one profile change." };
  }

  const patch: HouseholdProfilePatch = {};

  if (Object.hasOwn(values, "displayName")) {
    if (typeof values.displayName !== "string") {
      return { data: null, error: "Enter a valid household name." };
    }

    const displayName = values.displayName.trim();

    if (!displayName || displayName.length > 60) {
      return {
        data: null,
        error: "Household name must contain between 1 and 60 characters.",
      };
    }

    if (findSensitiveWord(displayName)) {
      return {
        data: null,
        code: "SENSITIVE_WORD",
        error: "Household name contains a disallowed term.",
      };
    }

    patch.displayName = displayName;
  }

  if (Object.hasOwn(values, "householdSize")) {
    if (
      typeof values.householdSize !== "number" ||
      !Number.isInteger(values.householdSize) ||
      values.householdSize < 1 ||
      values.householdSize > 20
    ) {
      return {
        data: null,
        error: "Household size must be a whole number between 1 and 20.",
      };
    }

    patch.householdSize = values.householdSize;
  }

  for (const field of ["shareAnalytics", "displayLeaderboard"] as const) {
    if (!Object.hasOwn(values, field)) {
      continue;
    }

    if (typeof values[field] !== "boolean") {
      return {
        data: null,
        error: "Privacy preferences must be true or false.",
      };
    }

    patch[field] = values[field];
  }
  if (Object.hasOwn(values, "communityAreaId")) {
    const areaId = values.communityAreaId;

    if (areaId === null) {
      patch.communityAreaId = null;
    } else if (typeof areaId === "string") {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(areaId)) {
        return {
          data: null,
          error: "Please select a valid Community Area.",
        };
      }

      patch.communityAreaId = areaId;
    } else {
      return {
        data: null,
        error: "Please select a valid Community Area.",
      };
    }
  }

  return { data: patch, error: null };
}
