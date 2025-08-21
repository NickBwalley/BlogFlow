"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Eye, Edit, Trash2 } from "lucide-react";
import { deleteBlog } from "@/lib/actions/blog";
import { toast } from "sonner";
import { useTransition, useState } from "react";
import { getReadTime } from "@/lib/utils/read-time";
import { DEFAULT_BLOG_IMAGE, hasCustomImage } from "@/lib/utils/default-image";

interface BlogPostCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime?: number;
  views: number;
  comments: number;
  status: "published" | "draft" | "scheduled";
  imageUrl?: string;
  authorName?: string;
  authorAvatar?: string;
  slug?: string;
  showDelete?: boolean;
  onDelete?: () => void;
  content?: string; // Add content for dynamic read time calculation
}

export function BlogPostCard({
  id,
  title,
  excerpt,
  category,
  publishedAt,
  readTime,
  views,
  comments,
  status,
  imageUrl,
  authorName = "John Doe",
  authorAvatar,
  slug,
  showDelete = false,
  onDelete,
  content,
}: BlogPostCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate dynamic read time
  const dynamicReadTime = readTime || getReadTime(content, 1);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
        await deleteBlog(id);
        toast.success("Blog post deleted successfully!");
        if (onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error("Failed to delete blog:", error);
        toast.error("Failed to delete blog post");
      } finally {
        setIsDeleting(false);
      }
    });
  };
  const displayImageUrl = imageUrl || DEFAULT_BLOG_IMAGE;
  const isCustomImagePresent = hasCustomImage(imageUrl, null);

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden p-0">
      {/* Hero Image */}
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        <Image
          src={displayImageUrl}
          alt={title}
          width={400}
          height={225}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* No Image Indicator */}
        {!isCustomImagePresent && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-gray-700">
                No Image
              </span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Category Badge and Read Time */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-medium">
            {category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {dynamicReadTime} min read
          </div>
        </div>

        {/* Title and Excerpt */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/blogs/${slug || id}`}>{title}</Link>
          </h3>
          <p className="text-muted-foreground line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        </div>

        {/* Author and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {authorAvatar ? (
                <AvatarImage src={authorAvatar} alt={authorName} />
              ) : (
                <AvatarFallback className="bg-red-500 text-white text-xs">
                  {authorName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "JD"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{authorName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/blogs/${slug || id}`} target="_blank">
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/dashboard/blogs/${id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {showDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleDelete}
                disabled={isPending || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
