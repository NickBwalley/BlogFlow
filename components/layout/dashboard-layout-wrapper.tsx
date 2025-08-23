"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { createClient } from "@/lib/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { ProfileProvider } from "@/components/providers/profile-provider";
import {
  SubscriptionRefreshProvider,
  useSubscriptionRefresh,
} from "@/components/providers/subscription-refresh-provider";

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { refreshTrigger: subscriptionRefreshTrigger } =
    useSubscriptionRefresh();

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        router.push("/");
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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

  // Close mobile sidebar when clicking outside or navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <ProtectedRoute>
      <ProfileProvider user={user}>
        <div className="min-h-screen flex flex-col">
          <Header variant="light" />

          {/* Main Layout Container */}
          <div className="flex-1 flex pt-20">
            {/* Desktop Sidebar - Always Visible */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-20 lg:z-40">
              <DashboardSidebar
                user={user}
                isLoading={isLoading}
                onSignOut={handleSignOut}
                className="h-full flex flex-col"
                subscriptionRefreshTrigger={subscriptionRefreshTrigger}
              />
            </aside>

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
                  <DashboardSidebar
                    user={user}
                    isLoading={isLoading}
                    onSignOut={handleSignOut}
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
              {/* Mobile Header with Hamburger */}
              <header className="lg:hidden flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <h2 className="text-lg font-semibold">Dashboard</h2>
              </header>

              {/* Page Content */}
              <main className="flex-1 space-y-4 p-6">{children}</main>
            </div>
          </div>
        </div>
      </ProfileProvider>
    </ProtectedRoute>
  );
}

export function DashboardLayoutWrapper({
  children,
}: DashboardLayoutWrapperProps) {
  return (
    <SubscriptionRefreshProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SubscriptionRefreshProvider>
  );
}
