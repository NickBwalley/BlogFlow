"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBlogs } from "@/lib/actions/blog";
import { GlobalLayoutWrapper } from "@/components/layout/global-layout-wrapper";
import { FeaturedBlogCard } from "@/components/featured-blog-card";
import { BlogPostCard } from "@/components/blog-post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBlogImageWithDefault } from "@/lib/utils/default-image";
import type { BlogListItem } from "@/types/blog";

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Separate featured blog (first one) from the rest
  const featuredBlog = blogs?.[0];
  const otherBlogs = blogs?.slice(1) || [];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const fetchedBlogs = await getBlogs();
        setBlogs(fetchedBlogs || []);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Filter blogs based on search term
  const filteredBlogs = otherBlogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    // For now, we'll just use search since we don't have categories in the database
    return matchesSearch;
  });

  // Categories are hardcoded since we don't have them in the database yet
  const categories = ["Technology", "Design", "Business"];

  if (isLoading) {
    return (
      <GlobalLayoutWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </GlobalLayoutWrapper>
    );
  }

  return (
    <GlobalLayoutWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Blogs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing content from our community of writers and
              creators.
            </p>
          </div>

          {/* Featured Blog */}
          {featuredBlog && featuredBlog.id && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Featured Post
              </h2>
              <FeaturedBlogCard
                blog={featuredBlog}
                category="Featured"
                readTime={undefined}
              />
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search blogs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredBlogs.length} of {otherBlogs.length} blogs
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory !== "all" && ` in "${selectedCategory}"`}
            </div>
          </div>

          {/* Blog Grid/List */}
          {filteredBlogs.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredBlogs.map((blog) => (
                <BlogPostCard
                  key={blog.id}
                  id={blog.id}
                  title={blog.title}
                  excerpt={blog.subtitle || ""}
                  category="General"
                  publishedAt={blog.created_at}
                  readTime={undefined}
                  views={0}
                  comments={0}
                  status="published"
                  imageUrl={getBlogImageWithDefault(
                    blog.image,
                    blog.image_path
                  )}
                  authorName={blog.author || "Anonymous"}
                  slug={blog.slug}
                  content={blog.content}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== "all"
                  ? "No blogs found matching your criteria."
                  : "No blogs available at the moment."}
              </div>
              {(searchTerm || selectedCategory !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16 text-center bg-white rounded-xl p-8 shadow-sm border">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Share Your Story?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our community of writers and start creating amazing content
              with the help of AI.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard">Start Writing</Link>
            </Button>
          </div>
        </div>
      </div>
    </GlobalLayoutWrapper>
  );
}
