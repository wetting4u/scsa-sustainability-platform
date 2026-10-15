import { validateText } from "./index.ts";

// Keep the common validator unchanged; use the agreed wording for these features.
export function validateContentText(
  input: unknown,
  options: Parameters<typeof validateText>[1],
) {
  const result = validateText(input, options);
  return !result.ok && result.code === "SENSITIVE_WORD"
    ? { ...result, message: `${options.field} contains a sensitive term.` }
    : result;
}

// Shared by browser forms and server services. Credentials and search are excluded.
export const validateGoalTitle = (value: unknown) =>
  validateContentText(value, {
    field: "Goal title",
    minLength: 1,
    maxLength: 80,
  });

export function validateChallengeText(values: Record<string, unknown>) {
  const title = validateContentText(values.title, {
    field: "Challenge name",
    minLength: 1,
    maxLength: 100,
  });
  if (!title.ok) return title;
  const description = validateContentText(values.description, {
    field: "Description",
    minLength: 1,
    maxLength: 500,
  });
  if (!description.ok) return description;
  const tag = validateContentText(values.tag, {
    field: "Tag",
    minLength: 1,
    maxLength: 50,
  });
  if (!tag.ok) return tag;
  return {
    ok: true as const,
    value: {
      title: title.value,
      description: description.value,
      tag: tag.value,
    },
  };
}
