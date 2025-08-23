"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  CreditCard,
  LogOut,
  X,
  Shield,
  Settings,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const adminSidebarNavItems = [
  {
    title: "Home",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Blogs",
    href: "/admin/blogs",
    icon: FileText,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Debug",
    href: "/admin/debug",
    icon: Shield,
  },
  {
    title: "Setup",
    href: "/admin/setup",
    icon: Settings,
  },
  {
    title: "Rate Limits",
    href: "/admin/rate-limits",
    icon: Shield,
  },
];

interface AdminSidebarProps {
  user: User | null;
  isLoading: boolean;
  onSignOut: () => void;
  isMobile?: boolean;
  className?: string;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  user,
  isLoading,
  onSignOut,
  isMobile = false,
  className = "",
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Generate display name from email
  const getDisplayName = (email?: string) => {
    if (!email) return "Admin";
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
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">BlogFlow</h1>
          <Shield className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
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
          {adminSidebarNavItems.map((item) => {
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
                Admin • {user.email}
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
