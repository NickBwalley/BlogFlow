import {
  countWords,
  validateWordLimit,
  truncateToWordLimit,
  formatWordCount,
} from "../word-count";

describe("Word Count Utilities", () => {
  describe("countWords", () => {
    it("should count simple text correctly", () => {
      expect(countWords("Hello world")).toBe(2);
      expect(countWords("This is a test sentence")).toBe(5);
    });

    it("should ignore markdown formatting", () => {
      expect(countWords("**Bold text** and *italic text*")).toBe(4);
      expect(countWords("# Header\n\nSome content")).toBe(3);
      expect(countWords("`code` and ```\ncode block\n```")).toBe(2);
    });

    it("should handle empty or invalid input", () => {
      expect(countWords("")).toBe(0);
      expect(countWords("   ")).toBe(0);
      expect(countWords(null as unknown as string)).toBe(0);
      expect(countWords(undefined as unknown as string)).toBe(0);
    });
  });

  describe("validateWordLimit", () => {
    it("should validate within limit", () => {
      const result = validateWordLimit("Hello world test", 5);
      expect(result.isValid).toBe(true);
      expect(result.wordCount).toBe(3);
      expect(result.isExceeded).toBe(false);
    });

    it("should detect exceeded limit", () => {
      const result = validateWordLimit("Hello world test extra words here", 3);
      expect(result.isValid).toBe(false);
      expect(result.wordCount).toBe(6);
      expect(result.isExceeded).toBe(true);
    });
  });

  describe("formatWordCount", () => {
    it("should format correctly when under limit", () => {
      expect(formatWordCount(250, 300)).toBe("250/300 words (50 remaining)");
    });

    it("should format correctly when at limit", () => {
      expect(formatWordCount(300, 300)).toBe("300/300 words (at limit)");
    });

    it("should format correctly when over limit", () => {
      expect(formatWordCount(350, 300)).toBe("350/300 words (50 over limit)");
    });
  });

  describe("truncateToWordLimit", () => {
    it("should not truncate if within limit", () => {
      const content = "Hello world test";
      expect(truncateToWordLimit(content, 5)).toBe(content);
    });

    it("should truncate if over limit", () => {
      const content = "Hello world test extra words";
      const result = truncateToWordLimit(content, 3);
      expect(countWords(result)).toBeLessThanOrEqual(3);
    });
  });
});
