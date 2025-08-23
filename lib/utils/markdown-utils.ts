import MarkdownIt from "markdown-it";

// Initialize markdown-it with HTML enabled and line breaks converted to <br>
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

/**
 * Convert markdown string to HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  return md.render(markdown);
}

/**
 * Convert HTML to markdown (basic conversion)
 * This is a simple implementation - for more complex needs, consider using turndown
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  // Basic HTML to markdown conversion
  return (
    html
      // Headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n")
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n")

      // Bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")

      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")

      // Lists
      .replace(/<ul[^>]*>/gi, "")
      .replace(/<\/ul>/gi, "\n")
      .replace(/<ol[^>]*>/gi, "")
      .replace(/<\/ol>/gi, "\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")

      // Paragraphs
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")

      // Line breaks
      .replace(/<br[^>]*>/gi, "\n")

      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, "")

      // Clean up extra whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
