/** English terms approved by Yulong on 2026-10-15. */
export const SENSITIVE_WORDS: readonly string[] = Object.freeze([
  "nigger",
  "niggers",
  "nigga",
  "niggas",
  "chink",
  "chinks",
  "gook",
  "gooks",
  "paki",
  "pakis",
  "kike",
  "kikes",
  "spic",
  "spics",
  "faggot",
  "faggots",
  "tranny",
  "trannies",
  "women are inferior",
  "women belong in the kitchen",
  "women should not vote",
  "men are inferior",
  "white supremacy",
  "inferior race",
  "go back to your country",
  "all muslims are terrorists",
  "gay people are disgusting",
  "trans people are disgusting",
  "fuck",
  "fucking",
  "motherfucker",
  "shit",
  "bullshit",
  "asshole",
  "bitch",
  "bitches",
  "slut",
  "sluts",
  "whore",
  "whores",
]);

export type SensitiveWordMatcher = (
  value: string,
  words?: readonly string[],
) => string | null;

export const findSensitiveWord: SensitiveWordMatcher = (
  value,
  words = SENSITIVE_WORDS,
) => {
  const normalizedValue = value.replace(/\s+/gu, " ");

  for (const word of words) {
    const normalizedWord = word.trim().replace(/\s+/gu, " ");

    if (!normalizedWord) {
      continue;
    }

    const escapedWord = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Unicode-aware boundaries prevent matches inside ordinary words or IDs.
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])${escapedWord}(?![\\p{L}\\p{N}_])`,
      "iu",
    );

    if (pattern.test(normalizedValue)) {
      return word;
    }
  }

  return null;
};
