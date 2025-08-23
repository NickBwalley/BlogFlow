"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { BlogListItem } from "@/types/blog";
import { deleteBlog } from "@/lib/actions/blog";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import {
  getBlogImageWithDefault,
  hasCustomImage,
} from "@/lib/utils/default-image";

interface BlogListProps {
  blogs: BlogListItem[];
  showUserBlogs?: boolean;
}

export function BlogList({ blogs, showUserBlogs = false }: BlogListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteBlog(id);
        toast.success("Blog post deleted successfully!");
      } catch (error) {
        console.error("Failed to delete blog:", error);
        toast.error("Failed to delete blog post");
      } finally {
        setDeletingId(null);
      }
    });
  };

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {showUserBlogs ? "No blog posts yet" : "No blogs found"}
          </h3>
          <p className="text-gray-600 mb-6">
            {showUserBlogs
              ? "Get started by creating your first blog post."
              : "There are no published blog posts at the moment."}
          </p>
          {showUserBlogs && (
            <Link href="/dashboard/blogs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Blog
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <Card key={blog.id} className="flex flex-col overflow-hidden p-0">
          <div className="aspect-video overflow-hidden relative">
            <Image
              src={getBlogImageWithDefault(blog.image, blog.image_path)}
              alt={blog.title}
              fill
              className="object-cover"
            />
            {/* No Image Indicator */}
            {!hasCustomImage(blog.image, blog.image_path) && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs font-medium text-gray-700">
                    No Image
                  </span>
                </div>
              </div>
            )}
          </div>

          <CardHeader className="flex-1 p-6">
            <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
            {blog.subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {blog.subtitle}
              </p>
            )}
          </CardHeader>

          <CardContent className="px-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>by {blog.author}</span>
              <time dateTime={blog.created_at}>
                {formatDate(blog.created_at)}
              </time>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2 p-6 pt-0">
            <Link href={`/blogs/${blog.slug || blog.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </Link>

            {showUserBlogs && (
              <>
                <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(blog.id)}
                  disabled={isPending || deletingId === blog.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
