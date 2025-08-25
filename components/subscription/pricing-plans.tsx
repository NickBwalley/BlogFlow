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
import { Badge } from "@/components/ui/badge";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/subscription/config";
import { Check, Crown, Zap } from "lucide-react";
import { PaymentForm } from "./payment-form";

interface PricingPlansProps {
  currentPlan?: SubscriptionPlan;
  hasActiveSubscription?: boolean;
  usage?: {
    aiPostsUsed: number;
    aiPostsLimit: number;
    remainingPosts: number;
  };
  onPaymentSuccess?: () => void;
}

export function PricingPlans({
  currentPlan = "free",
  hasActiveSubscription = false,
  usage,
  onPaymentSuccess,
}: PricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const handlePlanSelect = (planKey: SubscriptionPlan) => {
    if (planKey === "free") {
      // Handle free plan selection if needed
      return;
    }
    setSelectedPlan(planKey);
  };

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case "free":
        return <Zap className="h-6 w-6 text-blue-500" />;
      case "starter":
        return <Check className="h-6 w-6 text-green-500" />;
      case "pro":
        return <Crown className="h-6 w-6 text-purple-500" />;
      case "enterprise":
        return <Crown className="h-6 w-6 text-amber-500" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planKey: string) => currentPlan === planKey;
  const isUpgrade = (planKey: string) => {
    const planOrder = { free: 0, starter: 1, pro: 2, enterprise: 3 };
    return planOrder[planKey as SubscriptionPlan] > planOrder[currentPlan];
  };

  if (selectedPlan) {
    return (
      <PaymentForm
        selectedPlan={selectedPlan}
        onBack={() => setSelectedPlan(null)}
        onSuccess={onPaymentSuccess}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Unlock the power of AI-generated content with our flexible
          subscription options
        </p>
      </div>

      {/* Current Usage Display */}
      {usage && hasActiveSubscription && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Current Usage</h3>
                <p className="text-sm text-muted-foreground">
                  {usage.aiPostsUsed} of {usage.aiPostsLimit} AI posts used this
                  month
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {usage.remainingPosts}
                </div>
                <div className="text-sm text-muted-foreground">remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(usage.aiPostsUsed / usage.aiPostsLimit) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          const planKey = key as SubscriptionPlan;
          const isCurrent = isCurrentPlan(planKey);
          const canUpgrade = isUpgrade(planKey);

          return (
            <Card
              key={key}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                isCurrent
                  ? "ring-2 ring-primary shadow-lg"
                  : plan.popular
                  ? "ring-2 ring-orange-200 shadow-md"
                  : "hover:ring-1 hover:ring-gray-200"
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary/80">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(key)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-lg">
                  {key === "free"
                    ? "Perfect for getting started"
                    : key === "starter"
                    ? "Great for regular bloggers"
                    : "For power users and professionals"}
                </CardDescription>
                <div className="pt-4">
                  <div className="text-4xl font-bold">
                    {plan.priceFormatted}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </div>
                  {key !== "free" && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      30-day free trial included
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button disabled className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  ) : key === "free" ? (
                    <Button disabled className="w-full" variant="outline">
                      Always Free
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePlanSelect(planKey)}
                      className={`w-full ${
                        plan.popular ? "bg-orange-500 hover:bg-orange-600" : ""
                      }`}
                      size="lg"
                    >
                      {canUpgrade
                        ? `Upgrade to ${plan.name}`
                        : `Get ${plan.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center mb-8">
          Compare Features
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-6 py-4 text-left font-semibold">
                  Features
                </th>
                <th className="border border-gray-200 px-6 py-4 text-center font-semibold">
                  Free
                </th>
                <th className="border border-gray-200 px-6 py-4 text-center font-semibold">
                  Starter
                </th>
                <th className="border border-gray-200 px-6 py-4 text-center font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-6 py-4 font-medium">
                  AI Blog Posts / Month
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  3
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  10
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  30
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-6 py-4 font-medium">
                  Manual Blog Creation
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-6 py-4 font-medium">
                  Premium Templates
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  -
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-6 py-4 font-medium">
                  Advanced Analytics
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  -
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  -
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-6 py-4 font-medium">
                  Priority Support
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  -
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  Email
                </td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  Priority
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
