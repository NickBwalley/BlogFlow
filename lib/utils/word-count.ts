/**
 * Utility functions for word counting and content validation
 */

/**
 * Count words in a text string, excluding markdown formatting
 * @param text - The text to count words in
 * @returns Number of words
 */
export function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;

  // Remove markdown formatting patterns
  const cleanText = text
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code (`...`)
    .replace(/`[^`]*`/g, "")
    // Remove markdown headers (# ## ###)
    .replace(/^#+\s*/gm, "")
    // Remove markdown bold/italic (**text** *text*)
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    // Remove markdown links ([text](url))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown images (![alt](url))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Remove bullet points (- * +)
    .replace(/^[\s]*[-*+]\s*/gm, "")
    // Remove numbered lists (1. 2. etc.)
    .replace(/^\s*\d+\.\s*/gm, "")
    // Remove extra whitespace and newlines
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return 0;

  // Split by whitespace and filter out empty strings
  return cleanText.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Validate if content is within word limit
 * @param content - The content to validate
 * @param maxWords - Maximum allowed words (default: 300)
 * @returns Object with validation result and word count
 */
export function validateWordLimit(
  content: string,
  maxWords: number = 300
): {
  isValid: boolean;
  wordCount: number;
  maxWords: number;
  isExceeded: boolean;
} {
  const wordCount = countWords(content);
  const isExceeded = wordCount > maxWords;

  return {
    isValid: !isExceeded,
    wordCount,
    maxWords,
    isExceeded,
  };
}

/**
 * Truncate content to fit within word limit while preserving markdown structure
 * @param content - The content to truncate
 * @param maxWords - Maximum allowed words (default: 300)
 * @returns Truncated content
 */
export function truncateToWordLimit(
  content: string,
  maxWords: number = 300
): string {
  if (!content) return "";

  const validation = validateWordLimit(content, maxWords);
  if (validation.isValid) return content;

  // Split content into lines to preserve structure
  const lines = content.split("\n");
  const truncatedLines: string[] = [];
  let currentWordCount = 0;

  for (const line of lines) {
    const lineWordCount = countWords(line);

    if (currentWordCount + lineWordCount <= maxWords) {
      truncatedLines.push(line);
      currentWordCount += lineWordCount;
    } else {
      // If this line would exceed the limit, try to include partial line
      const remainingWords = maxWords - currentWordCount;
      if (remainingWords > 0) {
        const words = line.split(/\s+/);
        const partialLine = words.slice(0, remainingWords).join(" ");
        if (partialLine.trim()) {
          truncatedLines.push(partialLine + "...");
        }
      }
      break;
    }
  }

  return truncatedLines.join("\n");
}

/**
 * Format word count for display
 * @param wordCount - Current word count
 * @param maxWords - Maximum allowed words
 * @returns Formatted string for display
 */
export function formatWordCount(
  wordCount: number,
  maxWords: number = 300
): string {
  const remaining = maxWords - wordCount;

  if (remaining < 0) {
    return `${wordCount}/${maxWords} words (${Math.abs(remaining)} over limit)`;
  } else if (remaining === 0) {
    return `${wordCount}/${maxWords} words (at limit)`;
  } else {
    return `${wordCount}/${maxWords} words (${remaining} remaining)`;
  }
}
