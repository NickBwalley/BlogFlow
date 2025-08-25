"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/actions/blog";
import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";
import { BlogDetail } from "@/components/blog/blog-detail";
import type { Blog } from "@/types";

export default function BlogSlugPage() {
  const params = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (typeof params.slug === "string") {
          const fetchedBlog = await getBlogBySlug(params.slug);
          setBlog(fetchedBlog);
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [params.slug]);

  if (isLoading) {
    return (
      <GlobalLayoutWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </GlobalLayoutWrapper>
    );
  }

  if (!blog) {
    notFound();
  }

  return (
    <GlobalLayoutWrapper>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <BlogDetail blog={blog} showBackButton={true} backUrl="/blogs" />
        </div>
      </main>
    </GlobalLayoutWrapper>
  );
}
