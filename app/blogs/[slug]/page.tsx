"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BlogDetail } from "@/components/blog/blog-detail";
import { getBlogBySlug } from "@/lib/actions/blog";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Blog } from "@/types";

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <DashboardSidebar
          user={user}
          isLoading={false}
          onSignOut={handleSignOut}
          subscriptionRefreshTrigger={0}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <Header variant="light" />
        <div className="pt-20">
          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              <BlogDetail blog={blog} showBackButton={true} backUrl="/blogs" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
