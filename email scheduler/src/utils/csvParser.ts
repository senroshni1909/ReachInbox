const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface CsvParseResult {
  validEmails: string[];
  invalidEntries: string[];
  totalDetected: number;
}

/**
 * Parse CSV or plain text input into validated email list
 */
export function parseEmailList(rawText: string): CsvParseResult {
  if (!rawText.trim()) {
    return { validEmails: [], invalidEntries: [], totalDetected: 0 };
  }

  // Split by newlines, commas, semicolons, or tabs
  const tokens = rawText
    .split(/[\r\n,;]+/)
    .map(token => token.trim())
    .filter(token => token.length > 0);

  const validEmails = new Set<string>();
  const invalidEntries: string[] = [];

  for (const token of tokens) {
    // If CSV row has quotes or commas like "Name,email@domain.com", extract email
    const match = token.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) {
      const email = match[0].toLowerCase();
      if (EMAIL_REGEX.test(email)) {
        validEmails.add(email);
      } else {
        invalidEntries.push(token);
      }
    } else if (token.length > 0 && token.toLowerCase() !== 'email' && token.toLowerCase() !== 'emails') {
      // Ignore header row, track invalid tokens
      invalidEntries.push(token);
    }
  }

  const validList = Array.from(validEmails);
  return {
    validEmails: validList,
    invalidEntries,
    totalDetected: validList.length,
  };
}
