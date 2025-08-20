"use client";

import { Blog } from "@/types/blog";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface BlogDetailProps {
  blog: Blog;
  showBackButton?: boolean;
  backUrl?: string;
}

export function BlogDetail({
  blog,
  showBackButton = true,
  backUrl = "/blogs",
}: BlogDetailProps) {
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
        {blog.image && (
          <div className="aspect-video overflow-hidden rounded-lg mb-6 relative">
            <Image
              src={blog.image}
              alt={blog.title}
              fill
              className="object-cover"
            />
          </div>
        )}

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
        />
      </div>
    </article>
  );
}
