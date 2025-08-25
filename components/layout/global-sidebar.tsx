"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  FileText,
  Settings,
  User as UserIcon,
  LogOut,
  Star,
  MessageCircle,
  CreditCard,
  X,
  Home,
  ShieldCheck,
  Users,
  BarChart3,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";
import { createClient } from "@/lib/client";
import { toast } from "sonner";

// Navigation items for authenticated users
const authenticatedNavItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "My Blogs",
    href: "/dashboard",
    icon: FileText,
  },
  {
    title: "Featured Blogs",
    href: "/blogs",
    icon: Star,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Pricing",
    href: "/dashboard/pricing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Account",
    href: "/dashboard/account",
    icon: UserIcon,
  },
];

// Navigation items for unauthenticated users
const unauthenticatedNavItems = [
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
];

// Admin navigation items
const adminNavItems = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: ShieldCheck,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "All Blogs",
    href: "/admin/blogs",
    icon: FileText,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: BarChart3,
  },
  {
    title: "Debug",
    href: "/admin/debug",
    icon: Settings,
  },
];

interface GlobalSidebarProps {
  user: User | null;
  isLoading: boolean;
  onSignOut: () => void;
  isMobile?: boolean;
  className?: string;
  onCloseMobile?: () => void;
  subscriptionRefreshTrigger?: number;
  userRole?: string;
}

export function GlobalSidebar({
  user,
  isLoading,
  onSignOut,
  isMobile = false,
  className = "",
  onCloseMobile,
  subscriptionRefreshTrigger = 0,
  userRole,
}: GlobalSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      onSignOut();
      if (onCloseMobile) onCloseMobile();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Generate display name from email
  const getDisplayName = (email?: string) => {
    if (!email) return "User";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Determine which navigation items to show
  const isAdmin = userRole === "admin";
  const navItems = user ? authenticatedNavItems : unauthenticatedNavItems;

  return (
    <div
      className={cn(
        "bg-background border-r border-border h-full flex flex-col",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <div className="relative h-8 w-8">
          <Image
            src="/images/favicon.png"
            alt="BlogFlow Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md"
          />
        </div>
        <h1 className="text-xl font-semibold">BlogFlow</h1>
        {isMobile && onCloseMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto p-1.5 h-8 w-8"
            onClick={onCloseMobile}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={onCloseMobile}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}

          {/* Admin Section */}
          {user && isAdmin && (
            <>
              <Separator className="my-4" />
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </h3>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={onCloseMobile}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t p-4 space-y-4">
        {user ? (
          <>
            {/* Subscription Status */}
            <div className="text-xs">
              <SubscriptionStatus
                userId={user.id}
                key={subscriptionRefreshTrigger}
                refreshTrigger={subscriptionRefreshTrigger}
              />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {getDisplayName(user.email)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          /* Authentication Buttons for Unauthenticated Users */
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login" onClick={onCloseMobile}>
                Sign In
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/auth/sign-up" onClick={onCloseMobile}>
                Sign Up
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
