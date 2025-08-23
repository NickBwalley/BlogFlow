# Stripe Subscription Implementation Guide

## Overview

This document outlines the implementation of a recurring subscription system using Stripe and Next.js for the Serif blogging platform. Users will have access to two subscription tiers (Starter and Pro) that enable AI blog generation features.

## Architecture Overview

### Subscription Flow

1. User selects a subscription plan (Starter or Pro)
2. Redirected to Stripe Checkout for payment
3. Webhook processes successful payment and updates database
4. User gains access to AI blog features
5. Subscription management handled via Stripe Customer Portal

### Database Schema Changes

#### New Tables Required

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, unpaid, incomplete
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Update profiles table to include subscription status
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT NULL;
```

## Implementation Steps

### Step 1: Environment Variables

Add to `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Plan IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
```

### Step 2: Stripe Utilities Setup

#### `lib/stripe/config.ts`

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    features: ["AI Blog Generation", "Basic Templates", "Email Support"],
  },
  pro: {
    name: "Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    features: [
      "AI Blog Generation",
      "Premium Templates",
      "Priority Support",
      "Advanced Analytics",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;
```

#### `lib/stripe/client.ts`

```typescript
import { loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<any>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export default getStripe;
```

### Step 3: Database Functions

#### `lib/actions/subscription.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";

export async function getUserSubscription(userId: string) {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return subscription;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId);
    return !!subscription && subscription.status === "active";
  } catch {
    return false;
  }
}

export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const supabase = await createClient();

  // Check if user already has a subscription record with customer ID
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (existingSubscription?.stripe_customer_id) {
    return existingSubscription.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer.id;
}
```

### Step 4: API Routes

#### `app/api/create-checkout-session/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import { getOrCreateStripeCustomer } from "@/lib/actions/subscription";

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, profile.email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard/settings`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### `app/api/create-portal-session/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { getUserSubscription } from "@/lib/actions/subscription";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's subscription to find customer ID
    const subscription = await getUserSubscription(user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/dashboard/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### `app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await handleSubscriptionCreated(
            supabase,
            subscription,
            session.metadata?.supabase_user_id
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionUpdated(supabase, subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionUpdated(supabase, subscription);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  supabase: any,
  subscription: Stripe.Subscription,
  supabaseUserId?: string
) {
  if (!supabaseUserId) {
    // Get user ID from customer metadata
    const customer = await stripe.customers.retrieve(
      subscription.customer as string
    );
    supabaseUserId = (customer as Stripe.Customer).metadata?.supabase_user_id;
  }

  if (!supabaseUserId) {
    console.error("No Supabase user ID found for subscription");
    return;
  }

  const subscriptionData = {
    user_id: supabaseUserId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  // Insert subscription
  await supabase.from("subscriptions").insert(subscriptionData);

  // Update profile subscription status
  await updateProfileSubscriptionStatus(supabase, supabaseUserId, subscription);
}

async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const updates = {
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (existingSubscription) {
    await supabase
      .from("subscriptions")
      .update(updates)
      .eq("stripe_subscription_id", subscription.id);

    await updateProfileSubscriptionStatus(
      supabase,
      existingSubscription.user_id,
      subscription
    );
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (existingSubscription) {
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    // Update profile to remove subscription access
    await supabase
      .from("profiles")
      .update({
        subscription_status: "none",
        subscription_tier: null,
      })
      .eq("id", existingSubscription.user_id);
  }
}

async function updateProfileSubscriptionStatus(
  supabase: any,
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0].price.id;
  let tier = null;

  // Determine tier based on price ID
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) {
    tier = "starter";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    tier = "pro";
  }

  await supabase
    .from("profiles")
    .update({
      subscription_status: subscription.status,
      subscription_tier: tier,
    })
    .eq("id", userId);
}
```

### Step 5: UI Components

#### `components/subscription/subscription-plans.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config";
import getStripe from "@/lib/stripe/client";
import { toast } from "sonner";

interface SubscriptionPlansProps {
  currentTier?: string | null;
  hasActiveSubscription: boolean;
}

export function SubscriptionPlans({
  currentTier,
  hasActiveSubscription,
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(planName);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        toast.error(error);
        return;
      }

      const stripe = await getStripe();
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("manage");

    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
      });

      const { url, error } = await response.json();

      if (error) {
        toast.error(error);
        return;
      }

      window.location.href = url;
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Unlock AI-powered blog generation with our subscription plans
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          const isCurrentPlan = currentTier === key;
          const isUpgrade =
            !hasActiveSubscription ||
            (currentTier === "starter" && key === "pro");

          return (
            <Card
              key={key}
              className={`relative ${
                isCurrentPlan ? "ring-2 ring-primary" : ""
              }`}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  Perfect for{" "}
                  {key === "starter" ? "individuals" : "professionals"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading === "manage"}
                    className="w-full"
                    variant="outline"
                  >
                    {loading === "manage"
                      ? "Loading..."
                      : "Manage Subscription"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={loading === plan.name}
                    className="w-full"
                  >
                    {loading === plan.name
                      ? "Loading..."
                      : isUpgrade
                      ? `Upgrade to ${plan.name}`
                      : `Subscribe to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

#### `components/subscription/subscription-guard.tsx`

```typescript
import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/actions/subscription";
import { SubscriptionPlans } from "./subscription-plans";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export async function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to access this feature.</div>;
  }

  const hasSubscription = await hasActiveSubscription(user.id);

  if (!hasSubscription) {
    return (
      fallback || (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Subscription Required</h1>
            <p className="text-muted-foreground">
              You need an active subscription to access AI blog generation
              features.
            </p>
          </div>
          <SubscriptionPlans currentTier={null} hasActiveSubscription={false} />
        </div>
      )
    );
  }

  return <>{children}</>;
}
```

### Step 6: Dashboard Pricing Page

#### `app/dashboard/pricing/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/actions/subscription";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CreditCard, Settings } from "lucide-react";

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  // Get current subscription
  const subscription = await getUserSubscription(user.id);

  // Get profile with subscription info
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier")
    .eq("id", user.id)
    .single();

  const hasActiveSubscription =
    subscription && subscription.status === "active";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription & Pricing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and choose the plan that works best for you.
        </p>
      </div>

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">
                    {profile?.subscription_tier || "Unknown"} Plan
                  </span>
                  <Badge
                    variant={
                      subscription.status === "active" ? "default" : "secondary"
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.cancel_at_period_end
                    ? "Cancels at the end of billing period"
                    : "Renews automatically"}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Next billing:{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={async () => {
                  const response = await fetch("/api/create-portal-session", {
                    method: "POST",
                  });
                  const { url } = await response.json();
                  window.location.href = url;
                }}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <SubscriptionPlans
        currentTier={profile?.subscription_tier}
        hasActiveSubscription={hasActiveSubscription}
      />

      {/* Benefits Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Why Subscribe?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🤖 AI-Powered Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate high-quality blog posts with advanced AI assistance,
                saving hours of writing time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track performance, engagement metrics, and optimize your content
                strategy with detailed insights.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Premium Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access exclusive, professionally designed templates to make your
                blogs stand out.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Can I cancel my subscription anytime?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access to premium features until the end of
                your current billing period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Can I upgrade or downgrade my plan?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Absolutely! You can change your plan at any time. Upgrades take
                effect immediately, while downgrades take effect at the next
                billing cycle.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                What happens to my content if I cancel?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your existing blog posts remain yours forever. You just won't be
                able to generate new AI-powered content without an active
                subscription.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### Update `components/dashboard/app-sidebar.tsx`

Add the pricing page to the sidebar navigation:

```typescript
// Add to the sidebar items array
{
  title: "Pricing",
  url: "/dashboard/pricing",
  icon: CreditCard,
},
```

#### `components/ui/badge.tsx` (if not exists)

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### Step 7: Integration Points

#### Update Blog Creation Flow

1. Wrap AI blog generation features with `<SubscriptionGuard>`
2. Add subscription check in blog creation API routes
3. Update blog form to show subscription upgrade prompts

#### Update Dashboard Settings

1. Add subscription management section
2. Display current plan and billing information
3. Include upgrade/downgrade options

#### Add Pricing Page to Dashboard

1. Create dedicated pricing page at `/dashboard/pricing`
2. Display subscription plans with current user's status
3. Show upgrade/downgrade options based on current tier
4. Include billing management links

#### Database Migration Order

1. Create subscription table migration
2. Add subscription columns to profiles table
3. Create necessary indexes and RLS policies

## Deployment Checklist

### Pre-deployment

- [ ] Create Starter and Pro products in Stripe Dashboard
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Add all environment variables to Vercel
- [ ] Test webhook locally with Stripe CLI
- [ ] Run database migrations

### Post-deployment

- [ ] Update webhook endpoint URL in Stripe Dashboard
- [ ] Test complete subscription flow
- [ ] Verify webhook processing
- [ ] Test subscription upgrades/downgrades
- [ ] Test subscription cancellation flow

## Security Considerations

1. **Webhook Security**: Always verify webhook signatures
2. **User Authorization**: Validate user permissions before subscription operations
3. **Environment Variables**: Keep Stripe keys secure and never expose secret keys to client
4. **Database Security**: Use RLS policies to protect subscription data
5. **Error Handling**: Don't expose sensitive error information to client

## Testing Strategy

1. **Local Testing**: Use Stripe CLI for webhook testing
2. **Test Cards**: Use Stripe test card numbers for different scenarios
3. **Edge Cases**: Test failed payments, subscription changes, webhooks failures
4. **User Flow**: Test complete user journey from signup to subscription management

This implementation provides a robust, secure subscription system that integrates seamlessly with your existing Serif blogging platform while maintaining best practices for Stripe integration and database security.
