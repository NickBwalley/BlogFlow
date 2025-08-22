"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BlogForm } from "@/components/blog/blog-form";
import { getBlog } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import type { Blog } from "@/types/blog";

export default function EditBlogPage() {
  const params = useParams();
  const id = params.id as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const fetchedBlog = await getBlog(id);
        setBlog(fetchedBlog);
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !blog) {
    notFound();
  }

  return <BlogForm blog={blog} mode="edit" />;
}
