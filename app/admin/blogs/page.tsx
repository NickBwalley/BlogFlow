"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminBlogs } from "@/lib/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  author: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  image: string | null;
  image_path: string | null;
  content: string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getAdminBlogs();
        setBlogs(data || []);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).length;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground">
            Manage and moderate all blog posts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loading blogs...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
        <p className="text-muted-foreground">
          Manage and moderate all blog posts.
        </p>
      </div>

      {/* Blogs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts ({blogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {blogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No blog posts found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Title</div>
                <div className="col-span-2">Author</div>
                <div className="col-span-2">Created</div>
                <div className="col-span-2">Word Count</div>
                <div className="col-span-2">Actions</div>
              </div>

              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Title and Subtitle */}
                  <div className="lg:col-span-4 space-y-1">
                    <h3 className="font-medium text-sm leading-tight">
                      {truncateText(blog.title, 60)}
                    </h3>
                    {blog.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {truncateText(blog.subtitle, 80)}
                      </p>
                    )}
                    <div className="lg:hidden">
                      <Badge variant="outline" className="text-xs">
                        {blog.author}
                      </Badge>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="hidden lg:flex lg:col-span-2 lg:items-center">
                    <Badge variant="outline" className="text-xs">
                      {blog.author}
                    </Badge>
                  </div>

                  {/* Created Date */}
                  <div className="lg:col-span-2 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(blog.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Word Count */}
                  <div className="lg:col-span-2 flex items-center">
                    <span className="text-sm">
                      {getWordCount(blog.content).toLocaleString()} words
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/blogs/${blog.slug}`} target="_blank">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden mt-2 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Created:</span>
                      <span>
                        {formatDistanceToNow(new Date(blog.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Words:</span>
                      <span>{getWordCount(blog.content).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/blogs/${blog.slug}`} target="_blank">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
