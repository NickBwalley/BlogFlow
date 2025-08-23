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
import { Crown, Zap, Check, ArrowRight, Sparkles } from "lucide-react";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/subscription/config";
import { PaymentForm } from "./payment-form";

interface SubscriptionUpgradeProps {
  currentTier: string;
  hasActiveSubscription: boolean;
}

export function SubscriptionUpgrade({
  currentTier,
  hasActiveSubscription,
}: SubscriptionUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case "free":
        return <Zap className="h-6 w-6 text-blue-500" />;
      case "starter":
        return <Check className="h-6 w-6 text-green-500" />;
      case "pro":
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getNextTier = (): SubscriptionPlan | null => {
    if (currentTier === "free") return "starter";
    if (currentTier === "starter") return "pro";
    return null; // Already on pro
  };

  const nextTier = getNextTier();

  if (selectedPlan) {
    return (
      <PaymentForm
        selectedPlan={selectedPlan}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  if (currentTier === "pro") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-500" />
            <CardTitle>Subscription Plan</CardTitle>
          </div>
          <CardDescription>
            You&apos;re on our highest tier. Enjoy all premium features!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-lg">Pro Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Unlimited AI blog generation
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
              Current Plan
            </Badge>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Your Pro Features:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Unlimited AI blog posts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Advanced AI models
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Custom templates
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextTier) {
    return null;
  }

  const nextPlan = SUBSCRIPTION_PLANS[nextTier];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <CardTitle>Upgrade Your Plan</CardTitle>
        </div>
        <CardDescription>
          Unlock more features and get the most out of BlogFlow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Plan</h4>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              {getPlanIcon(currentTier)}
              <div>
                <h5 className="font-medium capitalize">{currentTier} Plan</h5>
                <p className="text-sm text-muted-foreground">
                  {
                    SUBSCRIPTION_PLANS[currentTier as SubscriptionPlan]
                      ?.description
                  }
                </p>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Upgrade Option */}
        <div className="space-y-4">
          <h4 className="font-medium">Upgrade to {nextPlan.name}</h4>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getPlanIcon(nextTier)}
                <div>
                  <h5 className="font-semibold text-lg">{nextPlan.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {nextPlan.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {nextPlan.priceFormatted}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <h6 className="font-medium text-sm">What you&apos;ll get:</h6>
              <ul className="space-y-1">
                {nextPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setSelectedPlan(nextTier)}
              className="w-full"
              size="lg"
            >
              Upgrade to {nextPlan.name} - {nextPlan.priceFormatted}/month
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="pt-4 border-t">
          <h5 className="font-medium mb-3">Why upgrade?</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h6 className="font-medium text-muted-foreground mb-2">
                Current ({currentTier})
              </h6>
              <ul className="space-y-1">
                {SUBSCRIPTION_PLANS[
                  currentTier as SubscriptionPlan
                ]?.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="font-medium text-blue-600 mb-2">
                After upgrade ({nextTier})
              </h6>
              <ul className="space-y-1">
                {nextPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
