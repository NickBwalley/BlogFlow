"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminSubscriptions } from "@/lib/actions/admin";
import { formatDistanceToNow, format } from "date-fns";

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  ai_posts_limit: number;
  ai_posts_used: number;
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const data = await getAdminSubscriptions();
        setSubscriptions(data || []);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "canceled":
        return "secondary";
      case "past_due":
        return "destructive";
      case "trialing":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType.toLowerCase()) {
      case "premium":
        return "default";
      case "basic":
        return "secondary";
      case "pro":
        return "default";
      default:
        return "outline";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  };

  const isTrialActive = (
    trialStart: string | null,
    trialEnd: string | null
  ) => {
    if (!trialStart || !trialEnd) return false;
    const now = new Date();
    return new Date(trialStart) <= now && now <= new Date(trialEnd);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Monitor and manage user subscriptions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loading subscriptions...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
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
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Monitor and manage user subscriptions.
        </p>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subscriptions found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="hidden xl:grid xl:grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-2">User Email</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">AI Usage</div>
                <div className="col-span-2">Period</div>
                <div className="col-span-1">Trial</div>
                <div className="col-span-1">Created</div>
                <div className="col-span-1">Auto-Cancel</div>
              </div>

              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="grid grid-cols-1 xl:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* User Email */}
                  <div className="xl:col-span-2 flex items-center">
                    <div className="text-sm font-medium truncate">
                      {subscription.profiles.email}
                    </div>
                  </div>

                  {/* Plan Type */}
                  <div className="xl:col-span-2 flex items-center">
                    <Badge
                      variant={getPlanBadgeVariant(subscription.plan_type)}
                      className="capitalize"
                    >
                      {subscription.plan_type}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="xl:col-span-1 flex items-center">
                    <Badge
                      variant={getStatusBadgeVariant(subscription.status)}
                      className="capitalize"
                    >
                      {subscription.status}
                    </Badge>
                  </div>

                  {/* AI Usage */}
                  <div className="xl:col-span-2 flex items-center">
                    <div className="space-y-1 w-full">
                      <div className="text-sm">
                        {subscription.ai_posts_used} /{" "}
                        {subscription.ai_posts_limit}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(
                              getUsagePercentage(
                                subscription.ai_posts_used,
                                subscription.ai_posts_limit
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getUsagePercentage(
                          subscription.ai_posts_used,
                          subscription.ai_posts_limit
                        )}
                        % used
                      </div>
                    </div>
                  </div>

                  {/* Current Period */}
                  <div className="xl:col-span-2 flex items-center">
                    <div className="text-sm space-y-1">
                      <div>
                        {format(
                          new Date(subscription.current_period_start),
                          "MMM dd"
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(subscription.current_period_end),
                          "MMM dd, yyyy"
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ends{" "}
                        {formatDistanceToNow(
                          new Date(subscription.current_period_end),
                          {
                            addSuffix: true,
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trial Info */}
                  <div className="xl:col-span-1 flex items-center">
                    {subscription.trial_start && subscription.trial_end ? (
                      <div className="text-center">
                        <Badge
                          variant={
                            isTrialActive(
                              subscription.trial_start,
                              subscription.trial_end
                            )
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {isTrialActive(
                            subscription.trial_start,
                            subscription.trial_end
                          )
                            ? "Active"
                            : "Ended"}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No trial
                      </span>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="xl:col-span-1 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(subscription.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Auto Cancel */}
                  <div className="xl:col-span-1 flex items-center">
                    <Badge
                      variant={
                        subscription.cancel_at_period_end
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {subscription.cancel_at_period_end ? "Yes" : "No"}
                    </Badge>
                  </div>

                  {/* Mobile Layout */}
                  <div className="xl:hidden mt-2 space-y-2">
                    <div className="text-sm font-medium mb-2">
                      {subscription.profiles.email}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <Badge
                          variant={getStatusBadgeVariant(subscription.status)}
                          className="text-xs capitalize"
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Auto-cancel:
                        </span>{" "}
                        <Badge
                          variant={
                            subscription.cancel_at_period_end
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {subscription.cancel_at_period_end ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">AI Usage:</span>{" "}
                      {subscription.ai_posts_used} /{" "}
                      {subscription.ai_posts_limit} (
                      {getUsagePercentage(
                        subscription.ai_posts_used,
                        subscription.ai_posts_limit
                      )}
                      %)
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">
                        Period ends:
                      </span>{" "}
                      {formatDistanceToNow(
                        new Date(subscription.current_period_end),
                        { addSuffix: true }
                      )}
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
