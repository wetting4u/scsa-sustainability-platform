import { validateContentText } from "./content.ts";

/** Validate in visual order and show the browser bubble beside the first invalid field. */
export function reportSensitiveFields(
  form: HTMLFormElement,
  fields: Record<string, string>,
): boolean {
  for (const [name, label] of Object.entries(fields)) {
    const input = form.elements.namedItem(name);
    if (!(
      input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement
    ))
      continue;
    const result = validateContentText(input.value, { field: label });
    input.setCustomValidity(result.ok ? "" : result.message);
    if (!result.ok) {
      input.reportValidity();
      return false;
    }
  }
  return true;
}

export function clearFieldValidity(event: { target: EventTarget | null }) {
  const input = event.target;
  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
  ) {
    input.setCustomValidity("");
  }
}
