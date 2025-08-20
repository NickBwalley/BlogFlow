import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BlogPostCard } from "@/components/blog-post-card";

import { Plus, TrendingUp, Users, FileText, Eye } from "lucide-react";
import Link from "next/link";

// Mock data for blog posts
const mockBlogPosts = [
  {
    id: "1",
    title: "Getting Started with Next.js 15: A Complete Guide",
    excerpt:
      "Learn how to build modern web applications with Next.js 15, including the latest features like Server Components, streaming, and more.",
    category: "Technology",
    publishedAt: "2024-01-15",
    readTime: 8,
    views: 1234,
    comments: 23,
    status: "published" as const,
    imageUrl: "/images/hero-background.jpg",
  },
  {
    id: "2",
    title: "The Future of Web Development in 2024",
    excerpt:
      "Exploring the trends and technologies that will shape web development this year, from AI integration to performance optimizations.",
    category: "Web Development",
    publishedAt: "2024-01-12",
    readTime: 12,
    views: 2156,
    comments: 45,
    status: "published" as const,
  },
  {
    id: "3",
    title: "Building Scalable React Applications",
    excerpt:
      "Best practices for structuring large React applications, including component architecture, state management, and performance optimization.",
    category: "React",
    publishedAt: "2024-01-10",
    readTime: 15,
    views: 987,
    comments: 18,
    status: "draft" as const,
    imageUrl: "/images/hero-background.jpg",
  },
  {
    id: "4",
    title: "Understanding TypeScript Generics",
    excerpt:
      "A deep dive into TypeScript generics, how they work, and practical examples to improve your code's type safety and reusability.",
    category: "TypeScript",
    publishedAt: "2024-01-20",
    readTime: 10,
    views: 0,
    comments: 0,
    status: "scheduled" as const,
  },
];

// Mock analytics data
const analyticsData = {
  totalViews: 15678,
  totalPosts: 24,
  totalSubscribers: 1234,
  engagement: 78,
};

export default function DashboardHome() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your blog.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.engagement}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recent Posts
          </h2>
          <Button variant="outline" asChild>
            <Link href="/dashboard/blogs">View All</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockBlogPosts.slice(0, 3).map((post) => (
            <BlogPostCard key={post.id} {...post} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your blog effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col p-4" asChild>
            <Link href="/dashboard/blogs/new">
              <Plus className="mb-2 h-6 w-6" />
              <span className="font-medium">Create Post</span>
              <span className="text-xs text-muted-foreground mt-1">
                Start writing
              </span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto flex-col p-4" asChild>
            <Link href="/dashboard/blogs?filter=draft">
              <FileText className="mb-2 h-6 w-6" />
              <span className="font-medium">Draft Posts</span>
              <span className="text-xs text-muted-foreground mt-1">
                3 pending
              </span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto flex-col p-4" asChild>
            <Link href="/dashboard/settings">
              <TrendingUp className="mb-2 h-6 w-6" />
              <span className="font-medium">Analytics</span>
              <span className="text-xs text-muted-foreground mt-1">
                View insights
              </span>
            </Link>
          </Button>

          <Button variant="outline" className="h-auto flex-col p-4" asChild>
            <Link href="/dashboard/account">
              <Users className="mb-2 h-6 w-6" />
              <span className="font-medium">Profile</span>
              <span className="text-xs text-muted-foreground mt-1">
                Edit details
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
