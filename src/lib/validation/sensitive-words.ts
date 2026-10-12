/**
 * The shared word list is intentionally empty until the content-policy owner
 * supplies the approved source. Keep this server-safe module free of secrets.
 */
export const SENSITIVE_WORDS: readonly string[] = [];

export type SensitiveWordMatcher = (
  value: string,
  words?: readonly string[],
) => string | null;

export const findSensitiveWord: SensitiveWordMatcher = (
  value,
  words = SENSITIVE_WORDS,
) => {
  const normalizedValue = value.toLocaleLowerCase();

  for (const word of words) {
    const normalizedWord = word.trim().toLocaleLowerCase();

    if (normalizedWord && normalizedValue.includes(normalizedWord)) {
      return word;
    }
  }

  return null;
};
