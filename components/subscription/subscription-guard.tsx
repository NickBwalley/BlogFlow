import { ReactNode } from "react";
import { createClient } from "@/lib/server";
import { getSubscriptionUsage } from "@/lib/subscription/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Lock } from "lucide-react";
import Link from "next/link";

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredPlan?: "starter" | "pro";
  feature?: string;
  fallback?: ReactNode;
}

export async function SubscriptionGuard({
  children,
  requiredPlan = "starter",
  feature = "AI blog generation",
  fallback,
}: SubscriptionGuardProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to access {feature}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usage = await getSubscriptionUsage(user.id);

  // Check if user has sufficient plan
  const planOrder = { free: 0, starter: 1, pro: 2, enterprise: 3 };
  const hasRequiredPlan = planOrder[usage.plan] >= planOrder[requiredPlan];

  // Check if user can generate AI content (has remaining posts)
  const canGenerateAI = usage.canGenerateAI;

  if (hasRequiredPlan && canGenerateAI) {
    return <>{children}</>;
  }

  // Custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback based on the restriction type
  if (!hasRequiredPlan) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Zap className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>
            {feature} requires a {requiredPlan} plan or higher
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Current plan:{" "}
              <span className="font-medium capitalize">{usage.plan}</span>
            </p>
            <p>
              Required:{" "}
              <span className="font-medium capitalize">{requiredPlan}</span> or
              higher
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/dashboard/pricing">Upgrade Now</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User has the right plan but no remaining AI posts
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Zap className="h-12 w-12 text-blue-500" />
        </div>
        <CardTitle>AI Posts Limit Reached</CardTitle>
        <CardDescription>
          You&apos;ve used all {usage.aiPostsLimit} AI posts for this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Posts used: {usage.aiPostsUsed} of {usage.aiPostsLimit}
          </p>
          <p>Your limit will reset at the start of next month</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button asChild>
            <Link href="/dashboard/pricing">Upgrade Plan</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go Back</Link>
          </Button>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            You can still create manual blog posts without AI assistance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
