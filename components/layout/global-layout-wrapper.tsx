"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/client";
import { GlobalSidebar } from "./global-sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { SubscriptionRefreshProvider } from "@/components/providers/subscription-refresh-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface GlobalLayoutWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function GlobalLayoutWrapper({
  children,
  requireAuth = false,
}: GlobalLayoutWrapperProps) {
  return (
    <SubscriptionRefreshProvider>
      <GlobalLayoutContent requireAuth={requireAuth}>
        {children}
      </GlobalLayoutContent>
    </SubscriptionRefreshProvider>
  );
}

function GlobalLayoutContent({
  children,
  requireAuth,
}: GlobalLayoutWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [subscriptionRefreshTrigger, setSubscriptionRefreshTrigger] =
    useState(0);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole("");
    router.push("/");
  };

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setUserRole(profile?.role || "");
      }

      setIsLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setUserRole(profile?.role || "");
      } else {
        setUserRole("");
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const content = (
    <div className="min-h-screen flex flex-col">
      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar - Always Visible */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-40">
          <GlobalSidebar
            user={user}
            isLoading={isLoading}
            onSignOut={handleSignOut}
            userRole={userRole}
            className="h-full flex flex-col"
            subscriptionRefreshTrigger={subscriptionRefreshTrigger}
          />
        </aside>

        {/* Mobile Header with Hamburger Menu */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">BlogFlow</h1>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50" />
            <div
              className={cn(
                "fixed left-0 top-0 h-full w-64 transform transition-transform duration-300 ease-in-out z-50",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <GlobalSidebar
                user={user}
                isLoading={isLoading}
                onSignOut={handleSignOut}
                userRole={userRole}
                isMobile
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                subscriptionRefreshTrigger={subscriptionRefreshTrigger}
                className="h-full flex flex-col"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64">
          <div className="lg:pt-8 pt-20">{children}</div>
        </div>
      </div>
    </div>
  );

  if (requireAuth) {
    return (
      <ProtectedRoute>
        <ProfileProvider user={user}>{content}</ProfileProvider>
      </ProtectedRoute>
    );
  }

  return user ? (
    <ProfileProvider user={user}>{content}</ProfileProvider>
  ) : (
    content
  );
}
