"use server";

import { createClient } from "@/lib/server";
import {
  SUBSCRIPTION_PLANS,
  type Subscription,
  type SubscriptionPlan,
} from "./config";
import { revalidatePath } from "next/cache";

export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return subscription;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return !!subscription && subscription.status === "active";
}

export async function getSubscriptionUsage(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    // For free users, check if they have a profile with usage tracking
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_posts_used")
      .eq("user_id", userId)
      .single();

    const aiPostsUsed = profile?.ai_posts_used || 0;
    const aiPostsLimit = 3;
    const remainingPosts = Math.max(0, aiPostsLimit - aiPostsUsed);

    return {
      plan: "free" as SubscriptionPlan,
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

export async function incrementAIPostUsage(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (subscription) {
    // Handle subscribed users
    if (subscription.ai_posts_used >= subscription.ai_posts_limit) {
      return false;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        ai_posts_used: subscription.ai_posts_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error incrementing AI post usage:", error);
      return false;
    }

    return true;
  } else {
    // Handle free users - update their profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_posts_used")
      .eq("user_id", userId)
      .single();

    const currentUsage = profile?.ai_posts_used || 0;
    const freeLimit = 3;

    if (currentUsage >= freeLimit) {
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        ai_posts_used: currentUsage + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error incrementing AI post usage for free user:", error);
      return false;
    }

    return true;
  }
}

export async function createSubscription(
  userId: string,
  planType: SubscriptionPlan,
  paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvc: string;
    holderName: string;
  }
): Promise<{ success: boolean; subscription?: Subscription; error?: string }> {
  const supabase = await createClient();

  try {
    // Validate payment data (mockup validation)
    if (paymentData.cardNumber !== "4242424242424242") {
      return {
        success: false,
        error: "Invalid card number. Use test card: 4242 4242 4242 4242",
      };
    }

    if (paymentData.expiryDate !== "01/27") {
      return { success: false, error: "Invalid expiry date. Use: 01/27" };
    }

    if (paymentData.cvc !== "123") {
      return { success: false, error: "Invalid CVC. Use: 123" };
    }

    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription(userId);

    const planConfig = SUBSCRIPTION_PLANS[planType];
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const subscriptionData = {
      user_id: userId,
      plan_type: planType,
      status: "active" as const,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      ai_posts_used: 0,
      ai_posts_limit: planConfig.aiPostsLimit,
      cancel_at_period_end: false,
      // Add trial period for paid plans
      ...(planType !== "free"
        ? {
            trial_start: now.toISOString(),
            trial_end: new Date(
              now.getTime() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }
        : {}),
    };

    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSubscription, error } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating subscription:", error);
        return { success: false, error: "Failed to update subscription" };
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_tier: planType,
        })
        .eq("id", userId);

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/pricing");

      return { success: true, subscription: updatedSubscription };
    } else {
      // Create new subscription
      const { data: newSubscription, error } = await supabase
        .from("subscriptions")
        .insert(subscriptionData)
        .select()
        .single();

      if (error) {
        console.error("Error creating subscription:", error);
        return { success: false, error: "Failed to create subscription" };
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_tier: planType,
        })
        .eq("id", userId);

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/pricing");

      return { success: true, subscription: newSubscription };
    }
  } catch (error) {
    console.error("Error in createSubscription:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function cancelSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error canceling subscription:", error);
      return { success: false, error: "Failed to cancel subscription" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pricing");

    return { success: true };
  } catch (error) {
    console.error("Error in cancelSubscription:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function reactivateSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error reactivating subscription:", error);
      return { success: false, error: "Failed to reactivate subscription" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/pricing");

    return { success: true };
  } catch (error) {
    console.error("Error in reactivateSubscription:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
