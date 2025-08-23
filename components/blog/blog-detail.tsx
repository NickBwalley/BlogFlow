"use client";

import { Blog } from "@/types/blog";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { getBlogImageWithDefault } from "@/lib/utils/default-image";

interface BlogDetailProps {
  blog: Blog;
  showBackButton?: boolean;
  backUrl?: string;
  category?: string;
  readTime?: number;
}

export function BlogDetail({
  blog,
  showBackButton = true,
  backUrl = "/blogs",
  category = "Design",
  readTime = 1,
}: BlogDetailProps) {
  // Function to detect if content is markdown
  const isMarkdownContent = (content: string): boolean => {
    if (!content) return false;

    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s+/m, // Headers (# ## ### etc)
      /\*\*.*?\*\*/, // Bold text
      /\*.*?\*/, // Italic text
      /^\s*[-*+]\s+/m, // Unordered lists
      /^\s*\d+\.\s+/m, // Ordered lists
      /\[.*?\]\(.*?\)/, // Links
      /```[\s\S]*?```/, // Code blocks
      /`.*?`/, // Inline code
    ];

    return markdownPatterns.some((pattern) => pattern.test(content));
  };
  return (
    <article className="max-w-4xl mx-auto">
      {showBackButton && (
        <div className="mb-6">
          <Link href={backUrl}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="aspect-video overflow-hidden rounded-lg mb-6 relative">
          <Image
            src={getBlogImageWithDefault(blog.image, blog.image_path)}
            alt={blog.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Category Badge and Read Time */}
        <div className="flex items-center justify-between mb-6">
          <Badge variant="secondary" className="text-xs font-medium">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {readTime} min read
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>

        {blog.subtitle && (
          <p className="text-xl text-gray-600 mb-6">{blog.subtitle}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-4">
          <span>By {blog.author}</span>
          <span>•</span>
          <time dateTime={blog.created_at}>
            Published {formatDate(blog.created_at)}
          </time>
          {blog.updated_at !== blog.created_at && (
            <>
              <span>•</span>
              <time dateTime={blog.updated_at}>
                Updated {formatDate(blog.updated_at)}
              </time>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <TiptapEditor
          content={blog.content}
          onChange={() => {}} // Read-only
          editable={false}
          isMarkdown={isMarkdownContent(blog.content)}
        />
      </div>
    </article>
  );
}
