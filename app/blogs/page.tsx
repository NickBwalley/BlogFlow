import { getBlogs } from "@/lib/actions/blog";
import { Header } from "@/components/header";
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
import { getBlogImageUrl } from "@/lib/utils/image-utils";

export default async function BlogsPage() {
  const blogs = await getBlogs(); // Get all public blogs

  // Separate featured blog (first one) from the rest
  const featuredBlog = blogs?.[0];
  const otherBlogs = blogs?.slice(1) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <Header variant="light" />

      {/* Main Content */}
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center py-12 sm:py-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Discover Stories
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore insights, tutorials, and thought-provoking articles on
              modern web development, design trends, and emerging technologies.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search articles..."
                className="pl-10 bg-white/80 backdrop-blur-sm border-white/20 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-36 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <Badge variant="default" className="cursor-pointer">
              All
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Design
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Technology
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Development
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Business
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Tutorials
            </Badge>
          </div>

          {/* Featured Blog */}
          {featuredBlog && (
            <section className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold">Featured Article</h2>
              </div>
              <FeaturedBlogCard
                blog={featuredBlog}
                category="Design"
                views={0}
              />
            </section>
          )}

          {/* Blog Grid */}
          {otherBlogs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 bg-primary rounded-full" />
                  <h2 className="text-2xl font-bold">Latest Articles</h2>
                </div>
                <p className="text-muted-foreground">
                  {otherBlogs.length} article
                  {otherBlogs.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {otherBlogs.map((blog) => (
                  <BlogPostCard
                    key={blog.id}
                    id={blog.id}
                    title={blog.title}
                    excerpt={
                      blog.subtitle ||
                      "Learn the fundamentals of modern web development"
                    }
                    category="Design"
                    publishedAt={blog.created_at}
                    views={0}
                    comments={0}
                    status="published"
                    imageUrl={getBlogImageUrl(blog.image_path) || undefined}
                    authorName={blog.author}
                    slug={blog.slug}
                    content={blog.content}
                  />
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-12">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
                >
                  Load More Articles
                </Button>
              </div>
            </section>
          )}

          {/* Empty State */}
          {blogs.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <List className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">No articles yet</h3>
                <p className="text-muted-foreground mb-8">
                  We're working on creating amazing content for you. Check back
                  soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
