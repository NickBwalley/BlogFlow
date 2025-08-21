"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Eye } from "lucide-react";
import { BlogListItem } from "@/types/blog";
import { getBlogImageUrl } from "@/lib/utils/image-utils";
import { getReadTime } from "@/lib/utils/read-time";

interface FeaturedBlogCardProps {
  blog: BlogListItem;
  category?: string;
  readTime?: number;
  views?: number;
}

export function FeaturedBlogCard({
  blog,
  category = "Design",
  readTime,
  views = 0,
}: FeaturedBlogCardProps) {
  const imageUrl = getBlogImageUrl(blog.image_path);

  // Calculate dynamic read time
  const dynamicReadTime = readTime || getReadTime(blog.content, 1);

  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="grid lg:grid-cols-2 gap-0 h-full">
        {/* Image Section */}
        <div className="relative overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={blog.title}
              width={600}
              height={400}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-black/70 text-white border-0 hover:bg-black/80">
              {category}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="space-y-6">
            {/* Meta Information */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{dynamicReadTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{views} views</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
                <Link href={`/blogs/${blog.slug || blog.id}`}>
                  {blog.title}
                </Link>
              </h2>

              {/* Subtitle/Excerpt */}
              {blog.subtitle && (
                <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
                  {blog.subtitle}
                </p>
              )}
            </div>

            {/* Author Info */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-500 text-white">
                    {blog.author
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "JD"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{blog.author}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(blog.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
