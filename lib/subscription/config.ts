export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceFormatted: "$0",
    interval: "month",
    features: [
      "Create blog posts from scratch",
      "3 AI-generated blog posts per month",
      "Basic templates",
      "Community support",
    ],
    aiPostsLimit: 3,
    popular: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 499, // in cents
    priceFormatted: "$4.99",
    interval: "month",
    features: [
      "Everything in Free",
      "10 AI-generated blog posts per month",
      "Premium templates",
      "Email support",
      "30-day free trial",
    ],
    aiPostsLimit: 10,
    popular: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 1099, // in cents
    priceFormatted: "$10.99",
    interval: "month",
    features: [
      "Everything in Starter",
      "30 AI-generated blog posts per month",
      "Advanced analytics",
      "Priority support",
      "Custom templates",
      "API access",
    ],
    aiPostsLimit: 30,
    popular: false,
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type SubscriptionStatus = "active" | "canceled" | "expired";

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  ai_posts_used: number;
  ai_posts_limit: number;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Test card details for mockup
export const TEST_CARD_DETAILS = {
  number: "4242 4242 4242 4242",
  expiry: "01/27",
  cvc: "123",
} as const;
