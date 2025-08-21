"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BlogDetail } from "@/components/blog/blog-detail";
import { getBlogBySlug } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
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
  FileText,
  Settings,
  User as UserIcon,
  LogOut,
  Star,
  MessageCircle,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Blog } from "@/types";

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

export default function BlogSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const fetchedBlog = await getBlogBySlug(slug);
        setBlog(fetchedBlog);
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

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

  if (!blog) {
    notFound();
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
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild>
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
              <div className="max-w-4xl mx-auto">
                <BlogDetail
                  blog={blog}
                  showBackButton={true}
                  backUrl="/blogs"
                />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
