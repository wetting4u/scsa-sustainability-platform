import {
  findSensitiveWord,
  SENSITIVE_WORDS,
  type SensitiveWordMatcher,
} from "./sensitive-words.ts";

export type ValidationErrorCode =
  | "INVALID_TYPE"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_FORMAT"
  | "NOT_FINITE"
  | "NOT_INTEGER"
  | "BELOW_MINIMUM"
  | "ABOVE_MAXIMUM"
  | "NOT_ALLOWED"
  | "SENSITIVE_WORD";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ValidationErrorCode; message: string };

type TextValidationOptions = {
  field: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  formatDescription?: string;
  sensitiveWords?: readonly string[];
  sensitiveWordMatcher?: SensitiveWordMatcher;
};

export function validateText(
  input: unknown,
  options: TextValidationOptions,
): ValidationResult<string> {
  if (typeof input !== "string") {
    return invalid("INVALID_TYPE", `${options.field} must be text.`);
  }

  const value = input.trim();

  if (options.minLength !== undefined && value.length < options.minLength) {
    return invalid(
      "TOO_SHORT",
      `${options.field} must contain at least ${options.minLength} characters.`,
    );
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return invalid(
      "TOO_LONG",
      `${options.field} must contain at most ${options.maxLength} characters.`,
    );
  }

  if (options.pattern) {
    options.pattern.lastIndex = 0;
    const matches = options.pattern.test(value);
    options.pattern.lastIndex = 0;

    if (!matches) {
      return invalid(
        "INVALID_FORMAT",
        options.formatDescription
          ? `${options.field} must ${options.formatDescription}.`
          : `${options.field} has an invalid format.`,
      );
    }
  }

  const matcher = options.sensitiveWordMatcher ?? findSensitiveWord;
  const matchedWord = matcher(value, options.sensitiveWords ?? SENSITIVE_WORDS);

  if (matchedWord) {
    return invalid(
      "SENSITIVE_WORD",
      `${options.field} contains a disallowed term.`,
    );
  }

  return { ok: true, value };
}

type NumberValidationOptions = {
  field: string;
  min?: number;
  max?: number;
  integer?: boolean;
};

export function validateNumberRange(
  input: unknown,
  options: NumberValidationOptions,
): ValidationResult<number> {
  if (typeof input !== "number") {
    return invalid("INVALID_TYPE", `${options.field} must be a number.`);
  }

  if (!Number.isFinite(input)) {
    return invalid("NOT_FINITE", `${options.field} must be a finite number.`);
  }

  if (options.integer && !Number.isInteger(input)) {
    return invalid("NOT_INTEGER", `${options.field} must be an integer.`);
  }

  if (options.min !== undefined && input < options.min) {
    return invalid(
      "BELOW_MINIMUM",
      `${options.field} must be at least ${options.min}.`,
    );
  }

  if (options.max !== undefined && input > options.max) {
    return invalid(
      "ABOVE_MAXIMUM",
      `${options.field} must be at most ${options.max}.`,
    );
  }

  return { ok: true, value: input };
}

export function validateAllowedValue<const T extends string>(
  input: unknown,
  allowedValues: readonly T[],
  field: string,
): ValidationResult<T> {
  if (typeof input !== "string") {
    return invalid("INVALID_TYPE", `${field} must be text.`);
  }

  if (!allowedValues.includes(input as T)) {
    return invalid(
      "NOT_ALLOWED",
      `${field} must be one of: ${allowedValues.join(", ")}.`,
    );
  }

  return { ok: true, value: input as T };
}

function invalid(
  code: ValidationErrorCode,
  message: string,
): ValidationResult<never> {
  return { ok: false, code, message };
}

export { findSensitiveWord, SENSITIVE_WORDS } from "./sensitive-words.ts";
export type { SensitiveWordMatcher } from "./sensitive-words.ts";
