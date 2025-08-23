"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAdminUsers } from "@/lib/actions/admin";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getSubscriptionBadgeVariant = (status: string | null) => {
    switch (status) {
      case "active":
        return "default";
      case "canceled":
        return "secondary";
      case "past_due":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "user":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (email: string, firstName?: string | null) => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage and view all platform users.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loading users...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-6 bg-muted rounded animate-pulse w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage and view all platform users.
        </p>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Subscription</div>
                <div className="col-span-2">Tier</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-1">Updated</div>
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* User Info */}
                  <div className="md:col-span-3 flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(user.email, user.first_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.first_name || user.email.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="md:col-span-2 flex items-center">
                    <Badge
                      variant={getRoleBadgeVariant(user.role)}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </div>

                  {/* Subscription Status */}
                  <div className="md:col-span-2 flex items-center">
                    <Badge
                      variant={getSubscriptionBadgeVariant(
                        user.subscription_status
                      )}
                      className="capitalize"
                    >
                      {user.subscription_status || "none"}
                    </Badge>
                  </div>

                  {/* Subscription Tier */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-sm capitalize">
                      {user.subscription_tier || "Free"}
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div className="md:col-span-1 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(user.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="capitalize text-xs"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Subscription:
                      </span>
                      <Badge
                        variant={getSubscriptionBadgeVariant(
                          user.subscription_status
                        )}
                        className="capitalize text-xs"
                      >
                        {user.subscription_status || "none"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tier:</span>
                      <span className="capitalize">
                        {user.subscription_tier || "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>
                        {formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
