"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
import { Crown, Zap, Check } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";
import type { SubscriptionPlan } from "@/lib/subscription/config";

interface SubscriptionStatusProps {
  userId: string;
  isCollapsed?: boolean;
  refreshTrigger?: number;
}

interface SubscriptionData {
  plan: SubscriptionPlan;
  aiPostsUsed: number;
  aiPostsLimit: number;
  remainingPosts: number;
  isTrialActive?: boolean;
}

export function SubscriptionStatus({
  userId,
  isCollapsed = false,
  refreshTrigger = 0,
}: SubscriptionStatusProps) {
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        // This would normally be an API call to get subscription data
        // For now, we'll use a mock implementation
        const response = await fetch(
          `/api/subscription/usage?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
        // Fallback to free plan
        setSubscriptionData({
          plan: "free",
          aiPostsUsed: 0,
          aiPostsLimit: 3,
          remainingPosts: 3,
          isTrialActive: false,
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSubscriptionData();
    }
  }, [userId, refreshTrigger]);

  const handleUpgradeClick = () => {
    router.push("/dashboard/pricing");
  };

  if (loading) {
    return (
      <div className={`${isCollapsed ? "p-2 flex justify-center" : "p-2"}`}>
        <div
          className={`bg-muted rounded-lg animate-pulse ${
            isCollapsed ? "w-8 h-8" : "w-full h-16"
          }`}
        />
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[subscriptionData.plan];
  const planIcon =
    subscriptionData.plan === "free"
      ? Zap
      : subscriptionData.plan === "starter"
      ? Check
      : Crown;
  const PlanIcon = planIcon;

  if (isCollapsed) {
    return (
      <div className="p-2 flex flex-col items-center gap-2">
        <div
          className={`p-2 rounded-full ${
            subscriptionData.plan === "free"
              ? "bg-blue-100 text-blue-600"
              : subscriptionData.plan === "starter"
              ? "bg-green-100 text-green-600"
              : "bg-purple-100 text-purple-600"
          }`}
        >
          <PlanIcon className="h-4 w-4" />
        </div>
        {subscriptionData.plan !== "free" && subscriptionData.isTrialActive && (
          <Badge variant="outline" className="text-xs px-1 py-0">
            Trial
          </Badge>
        )}
      </div>
    );
  }

  const isFreePlan = subscriptionData.plan === "free";
  const canUpgrade = isFreePlan || subscriptionData.remainingPosts === 0;

  return (
    <div
      className={`bg-muted/50 rounded-lg p-2 text-xs transition-all duration-200 ${
        canUpgrade ? "cursor-pointer hover:bg-muted/70 hover:shadow-sm" : ""
      }`}
      onClick={canUpgrade ? handleUpgradeClick : undefined}
      role={canUpgrade ? "button" : undefined}
      tabIndex={canUpgrade ? 0 : undefined}
      onKeyDown={
        canUpgrade
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleUpgradeClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <PlanIcon
          className={`h-3 w-3 ${
            subscriptionData.plan === "free"
              ? "text-blue-500"
              : subscriptionData.plan === "starter"
              ? "text-green-500"
              : "text-purple-500"
          }`}
        />
        <span className="font-medium capitalize">{plan.name}</span>
        {subscriptionData.plan !== "free" && (
          <Badge className="text-[10px] px-1 py-0 h-4" variant="secondary">
            {plan.priceFormatted}/mo
          </Badge>
        )}
        {subscriptionData.plan !== "free" && subscriptionData.isTrialActive && (
          <Badge
            variant="outline"
            className="text-[10px] px-1 py-0 h-4 border-green-500 text-green-700"
          >
            Trial
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>AI Posts</span>
          <span>
            {subscriptionData.aiPostsUsed}/{subscriptionData.aiPostsLimit}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all ${
              subscriptionData.plan === "free"
                ? "bg-blue-500"
                : subscriptionData.plan === "starter"
                ? "bg-green-500"
                : "bg-purple-500"
            }`}
            style={{
              width: `${Math.min(
                (subscriptionData.aiPostsUsed / subscriptionData.aiPostsLimit) *
                  100,
                100
              )}%`,
            }}
          />
        </div>
        {subscriptionData.remainingPosts > 0 ? (
          <div className="text-[10px] text-muted-foreground">
            {subscriptionData.remainingPosts} remaining
          </div>
        ) : (
          <div className="text-[10px] text-orange-600 font-medium">
            Limit reached
          </div>
        )}
      </div>

      {isFreePlan && (
        <div className="mt-2 pt-1 border-t border-muted">
          <p className="text-[10px] text-center text-primary font-medium hover:underline">
            Click to upgrade for more AI posts
          </p>
        </div>
      )}

      {!isFreePlan && subscriptionData.remainingPosts === 0 && (
        <div className="mt-2 pt-1 border-t border-muted">
          <p className="text-[10px] text-center text-primary font-medium hover:underline">
            Click to upgrade your plan
          </p>
        </div>
      )}
    </div>
  );
}
