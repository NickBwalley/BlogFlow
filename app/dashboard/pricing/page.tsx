"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
// Remove server action imports - we'll fetch data directly with client
import { PricingPlans } from "@/components/subscription/pricing-plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CreditCard,
  Settings,
  AlertCircle,
  Crown,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";
import { useSubscriptionRefresh } from "@/components/providers/subscription-refresh-provider";
import type { User } from "@supabase/supabase-js";

// Helper function to get usage data
async function getUsageData(userId: string) {
  const supabase = createClient();

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!subscription) {
    // For free users, check profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_posts_used")
      .eq("user_id", userId)
      .single();

    const aiPostsUsed = profile?.ai_posts_used || 0;
    const aiPostsLimit = 3;
    const remainingPosts = Math.max(0, aiPostsLimit - aiPostsUsed);

    return {
      plan: "free",
      aiPostsUsed,
      aiPostsLimit,
      canGenerateAI: remainingPosts > 0,
      remainingPosts,
    };
  }

  const remainingPosts = Math.max(
    0,
    subscription.ai_posts_limit - subscription.ai_posts_used
  );

  return {
    plan: subscription.plan_type,
    aiPostsUsed: subscription.ai_posts_used,
    aiPostsLimit: subscription.ai_posts_limit,
    canGenerateAI: remainingPosts > 0,
    remainingPosts,
    isTrialActive: subscription.trial_end
      ? new Date(subscription.trial_end) > new Date()
      : false,
    trialEndsAt: subscription.trial_end,
  };
}

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<{
    plan_type: string;
    status: string;
    current_period_end?: string;
  } | null>(null);
  const [usage, setUsage] = useState<{
    plan: string;
    aiPostsUsed: number;
    aiPostsLimit: number;
    remainingPosts: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { triggerRefresh } = useSubscriptionRefresh();

  const handlePaymentSuccess = async () => {
    // Refresh local data
    if (user) {
      try {
        const supabase = createClient();

        // Get subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        // Get usage data
        const usageData = await getUsageData(user.id);

        setSubscription(subscriptionData);
        setUsage(usageData);
      } catch (error) {
        console.error("Error refreshing subscription data:", error);
      }
    }
    // Trigger sidebar refresh
    triggerRefresh();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        setUser(user);

        // Get current subscription
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        // Get usage data
        const usageData = await getUsageData(user.id);

        setSubscription(subscriptionData);
        setUsage(usageData);
      } catch (error) {
        console.error("Error fetching pricing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">
          Loading pricing information...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">
          Please log in to access this page
        </h1>
      </div>
    );
  }

  const hasActiveSubscription =
    subscription && subscription.status === "active";

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Subscription & Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your blogging needs. Start with a free
          trial and unlock the power of AI-generated content.
        </p>
      </div>

      {/* Current Subscription Status */}
      {usage && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold capitalize">
                    {usage.plan} Plan
                  </span>
                  <Badge
                    variant={
                      usage.plan === "free"
                        ? "secondary"
                        : hasActiveSubscription &&
                          subscription?.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {usage.plan === "free"
                      ? "free"
                      : subscription?.status || "active"}
                  </Badge>
                  {hasActiveSubscription &&
                    (usage as { isTrialActive?: boolean }).isTrialActive && (
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-700"
                      >
                        Free Trial
                      </Badge>
                    )}
                </div>
                {usage.plan === "free" ? (
                  <p className="text-muted-foreground">
                    Get started with basic features and limited AI posts
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      {(subscription as { cancel_at_period_end?: boolean })
                        ?.cancel_at_period_end
                        ? "Cancels at the end of billing period"
                        : "Renews automatically"}
                    </p>
                    {hasActiveSubscription &&
                      (usage as { isTrialActive?: boolean }).isTrialActive &&
                      (usage as { trialEndsAt?: string }).trialEndsAt && (
                        <p className="text-sm text-green-600 font-medium">
                          Trial ends:{" "}
                          {new Date(
                            (
                              usage as unknown as { trialEndsAt: string }
                            ).trialEndsAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                  </>
                )}
              </div>

              <div className="text-right space-y-2">
                <div className="text-3xl font-bold">
                  {SUBSCRIPTION_PLANS[
                    usage.plan as keyof typeof SUBSCRIPTION_PLANS
                  ]?.priceFormatted || "$0"}
                  <span className="text-lg font-normal text-muted-foreground">
                    {usage.plan === "free" ? "" : "/month"}
                  </span>
                </div>
                {usage.plan !== "free" && subscription && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      Next billing:{" "}
                      {subscription.current_period_end &&
                        new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid md:grid-cols-2 gap-6 p-6 bg-white rounded-lg border">
              <div>
                <h4 className="font-semibold mb-2">AI Posts Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used this month</span>
                    <span>
                      {usage.aiPostsUsed} of {usage.aiPostsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (usage.aiPostsUsed / usage.aiPostsLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usage.aiPostsLimit - usage.aiPostsUsed} posts remaining
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Plan Benefits</h4>
                <ul className="text-sm space-y-1">
                  {SUBSCRIPTION_PLANS[
                    usage.plan as keyof typeof SUBSCRIPTION_PLANS
                  ]?.features
                    .slice(0, 3)
                    .map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                        {feature}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {usage.plan === "free" ? (
                <Button
                  onClick={() => {
                    // Scroll to pricing plans section
                    const pricingSection = document.querySelector(
                      '[data-section="pricing-plans"]'
                    );
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Paid Plan
                </Button>
              ) : hasActiveSubscription && subscription ? (
                (subscription as { cancel_at_period_end?: boolean })
                  .cancel_at_period_end ? (
                  <Button
                    onClick={async () => {
                      const response = await fetch(
                        "/api/subscription/reactivate",
                        {
                          method: "POST",
                        }
                      );
                      if (response.ok) {
                        window.location.reload();
                      }
                    }}
                    variant="default"
                  >
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      const response = await fetch("/api/subscription/cancel", {
                        method: "POST",
                      });
                      if (response.ok) {
                        window.location.reload();
                      }
                    }}
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )
              ) : null}
            </div>

            {/* Free Plan Call to Action */}
            {usage.plan === "free" && (
              <div className="flex items-start gap-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">
                    Ready to unlock more features?
                  </p>
                  <p className="text-blue-700">
                    Upgrade to a paid plan to get unlimited AI posts, priority
                    support, and advanced features.
                  </p>
                </div>
              </div>
            )}

            {/* Paid Plan Cancellation Notice */}
            {usage.plan !== "free" &&
              hasActiveSubscription &&
              (subscription as { cancel_at_period_end?: boolean })
                ?.cancel_at_period_end && (
                <div className="flex items-start gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800">
                      Subscription Cancelled
                    </p>
                    <p className="text-orange-700">
                      You&apos;ll retain access to your {usage.plan} plan
                      features until{" "}
                      {subscription.current_period_end &&
                        new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      .
                    </p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      {usage && (
        <div data-section="pricing-plans">
          <PricingPlans
            currentPlan={
              usage.plan as "free" | "starter" | "pro" | "enterprise"
            }
            hasActiveSubscription={hasActiveSubscription || false}
            usage={usage}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                How does the free trial work?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All paid plans include a 30-day free trial. You&apos;ll have
                full access to all features during the trial period. No payment
                is required upfront, and you can cancel anytime during the trial
                without being charged.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Can I change my plan anytime?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade your plan at any time and the changes take
                effect immediately. If you downgrade, the change will take
                effect at your next billing cycle, and you&apos;ll keep access
                to your current plan&apos;s features until then.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What happens if I exceed my AI post limit?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you reach your monthly AI post limit, you can still create
                manual blog posts. To generate more AI content, you can upgrade
                your plan or wait until your next billing cycle when your limit
                resets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Is my payment information secure?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely. This is a demo environment using test payment data
                only. In a real implementation, all payment processing would be
                handled securely through Stripe with industry-standard
                encryption and security measures.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
