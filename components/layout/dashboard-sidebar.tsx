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
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";

const sidebarNavItems = [
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

interface DashboardSidebarProps {
  user: User | null;
  isLoading: boolean;
  onSignOut: () => void;
  isMobile?: boolean;
  className?: string;
  onCloseMobile?: () => void;
  subscriptionRefreshTrigger?: number;
}

export function DashboardSidebar({
  user,
  isLoading,
  onSignOut,
  isMobile = false,
  className = "",
  onCloseMobile,
  subscriptionRefreshTrigger = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  // Generate display name from email
  const getDisplayName = (email?: string) => {
    if (!email) return "User";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className={cn("bg-background border-r border-border", className)}>
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
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
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
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t p-4 space-y-4">
        {/* Subscription Status */}
        {user && (
          <SubscriptionStatus
            userId={user.id}
            isCollapsed={false}
            refreshTrigger={subscriptionRefreshTrigger}
          />
        )}

        <Separator />

        {/* User Profile */}
        {isLoading ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name || getDisplayName(user.email)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        ) : null}

        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={onSignOut}
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Sign out</span>
        </Button>
      </div>
    </div>
  );
}
