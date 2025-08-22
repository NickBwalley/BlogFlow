import { cn } from "@/lib/utils";
import { formatWordCount } from "@/lib/utils/word-count";

interface WordCountDisplayProps {
  wordCount: number;
  maxWords?: number;
  className?: string;
  showLimit?: boolean;
}

export function WordCountDisplay({
  wordCount,
  maxWords = 300,
  className,
  showLimit = true,
}: WordCountDisplayProps) {
  const isOverLimit = wordCount > maxWords;
  const isNearLimit = wordCount > maxWords * 0.9; // 90% of limit

  const displayText = showLimit
    ? formatWordCount(wordCount, maxWords)
    : `${wordCount} words`;

  return (
    <div
      className={cn(
        "text-xs font-medium",
        isOverLimit
          ? "text-destructive"
          : isNearLimit
          ? "text-orange-600"
          : "text-muted-foreground",
        className
      )}
    >
      {displayText}
    </div>
  );
}
