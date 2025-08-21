"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogs } from "@/lib/actions/blog";
import { Header } from "@/components/header";
import { FeaturedBlogCard } from "@/components/featured-blog-card";
import { BlogPostCard } from "@/components/blog-post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Search,
  Filter,
  Grid,
  List,
  FileText,
  Settings,
  User as UserIcon,
  LogOut,
  Star,
  MessageCircle,
  Home,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBlogImageWithDefault } from "@/lib/utils/default-image";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { BlogListItem } from "@/types/blog";

const sidebarNavItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Featured Blogs",
    href: "/blogs",
    icon: Star,
  },
  {
    title: "My Blogs",
    href: "/dashboard",
    icon: FileText,
    authRequired: true,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageCircle,
    authRequired: true,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    authRequired: true,
  },
  {
    title: "Account",
    href: "/dashboard/account",
    icon: UserIcon,
    authRequired: true,
  },
];

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsAuthenticated(!!user);
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setIsAuthenticated(false);
      } else if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Generate user initials for avatar fallback
  const getUserInitials = (email?: string) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  // Generate display name from email
  const getDisplayName = (email?: string) => {
    if (!email) return "User";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Filter navigation items based on auth status
  const filteredNavItems = sidebarNavItems.filter(
    (item) => !item.authRequired || isAuthenticated
  );

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header variant="light" />
        <div className="pt-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header variant="light" />
      <div className="pt-20">
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="relative h-8 w-8">
                  <Image
                    src="/images/favicon.png"
                    alt="BlogFlow Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-md"
                  />
                </div>
                <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
                  BlogFlow
                </h1>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.href === "/blogs";
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link href={item.href}>
                              <Icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <div className="p-2">
                <Separator className="mb-2" />

                {/* User Profile */}
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {getUserInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-medium truncate">
                          {user.user_metadata?.full_name ||
                            getDisplayName(user.email)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden ml-2">
                        Sign out
                      </span>
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button asChild className="w-full">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/sign-up">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset>
            {/* Header with Sidebar Toggle */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex-1" />
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="text-center py-12 sm:py-16">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                    Discover Stories
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                    Explore insights, tutorials, and thought-provoking articles
                    on modern web development, design trends, and emerging
                    technologies.
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
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                  >
                    Design
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                  >
                    Technology
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                  >
                    Development
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                  >
                    Business
                  </Badge>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                  >
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
                          imageUrl={getBlogImageWithDefault(
                            blog.image,
                            blog.image_path
                          )}
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
                      <h3 className="text-2xl font-semibold mb-4">
                        No articles yet
                      </h3>
                      <p className="text-muted-foreground mb-8">
                        We&apos;re working on creating amazing content for you.
                        Check back soon!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
