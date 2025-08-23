/**
 * Calculate estimated reading time for blog content
 */

const WORDS_PER_MINUTE = 200; // Average reading speed
const IMAGE_READ_TIME = 0.2; // Additional time per image in minutes

/**
 * Calculate read time based on content
 * @param content - The blog content (HTML or plain text)
 * @returns Estimated read time in minutes
 */
export function calculateReadTime(content: string): number {
  if (!content) return 1;

  // Strip HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, "");

  // Count words
  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const wordCount = words.length;

  // Count images in content
  const imageMatches = content.match(/<img[^>]*>/g) || [];
  const imageCount = imageMatches.length;

  // Calculate base read time from words
  const baseReadTime = wordCount / WORDS_PER_MINUTE;

  // Add extra time for images
  const totalReadTime = baseReadTime + imageCount * IMAGE_READ_TIME;

  // Round to nearest minute, minimum 1 minute
  return Math.max(1, Math.round(totalReadTime));
}

/**
 * Format read time for display
 * @param minutes - Read time in minutes
 * @returns Formatted string like "5 min read"
 */
export function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Calculate read time from blog content with fallback
 * @param content - Blog content
 * @param fallbackMinutes - Fallback time if content is unavailable
 * @returns Read time in minutes
 */
export function getReadTime(
  content?: string,
  fallbackMinutes: number = 1
): number {
  if (!content || content.trim().length === 0) {
    return fallbackMinutes;
  }

  return calculateReadTime(content);
}
