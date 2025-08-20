"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlogPostCard } from "@/components/blog-post-card";
import { getUserBlogs } from "@/lib/actions/blog";
import { getBlogImageUrl } from "@/lib/utils/image-utils";
import { BlogListItem } from "@/types/blog";
import { Plus } from "lucide-react";

export default function DashboardHome() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load blogs
  const loadBlogs = async () => {
    try {
      setIsLoading(true);
      const fetchedBlogs = await getUserBlogs();
      setBlogs(fetchedBlogs);
    } catch (error) {
      console.error("Failed to load blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load blogs on component mount
  useEffect(() => {
    loadBlogs();
  }, []);

  // Function to handle blog deletion
  const handleBlogDelete = () => {
    // Refresh the blogs list after deletion
    loadBlogs();
  };

  // Map blog data to BlogPostCard format
  const blogCardData = blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    excerpt:
      blog.subtitle || "Learn the fundamentals of modern web development",
    category: "Design", // Default category for now
    publishedAt: blog.created_at,
    readTime: 1, // Default read time since we don't have content in the list
    views: 0, // Default views
    comments: 0, // Default comments
    status: "published" as const,
    imageUrl: blog.image || getBlogImageUrl(blog.image_path) || undefined,
    authorName: blog.author,
    slug: blog.slug,
    showDelete: true,
    onDelete: handleBlogDelete,
  }));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Blog Posts</h1>
            <p className="text-muted-foreground">
              Manage and organize your blog content.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Blog Posts</h1>
            <p className="text-muted-foreground">
              Manage and organize your blog content.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No blog posts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first blog post.
            </p>
            <Link href="/dashboard/blogs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage and organize your blog content.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogCardData.map((blog) => (
          <BlogPostCard key={blog.id} {...blog} />
        ))}
      </div>
    </div>
  );
}
