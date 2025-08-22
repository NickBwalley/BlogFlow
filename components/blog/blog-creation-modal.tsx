"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionRefresh } from "@/components/providers/subscription-refresh-provider";

interface BlogCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFromScratch?: () => void;
}

export function BlogCreationModal({
  open,
  onOpenChange,
  onCreateFromScratch,
}: BlogCreationModalProps) {
  const router = useRouter();
  const { triggerRefresh } = useSubscriptionRefresh();
  const [step, setStep] = useState<"choose" | "ai-form">("choose");
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [subscriptionUsage, setSubscriptionUsage] = useState<{
    plan: string;
    aiPostsUsed: number;
    aiPostsLimit: number;
    canGenerateAI: boolean;
    remainingPosts: number;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Load subscription usage when modal opens
  useEffect(() => {
    const loadUsage = async () => {
      if (!open) return;

      try {
        setLoadingUsage(true);
        const response = await fetch("/api/subscription/usage");
        if (response.ok) {
          const usage = await response.json();
          setSubscriptionUsage(usage);
        } else {
          // Fallback to default values if API fails
          setSubscriptionUsage({
            plan: "free",
            aiPostsUsed: 0,
            aiPostsLimit: 3,
            remainingPosts: 3,
            canGenerateAI: true,
          });
        }
      } catch (error) {
        console.error("Failed to load subscription usage:", error);
        // Fallback to default values if API fails
        setSubscriptionUsage({
          plan: "free",
          aiPostsUsed: 0,
          aiPostsLimit: 3,
          remainingPosts: 3,
          canGenerateAI: true,
        });
      } finally {
        setLoadingUsage(false);
      }
    };

    loadUsage();
  }, [open]);

  const handleCreateFromScratch = () => {
    if (onCreateFromScratch) {
      onCreateFromScratch();
    } else {
      onOpenChange(false);
      router.push("/dashboard/blogs/new");
    }
  };

  const handleChooseAI = () => {
    setStep("ai-form");
  };

  const handleBackToChoose = () => {
    setStep("choose");
    setAiDescription("");
  };

  const handleGenerateWithAI = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe what your blog post should be about");
      return;
    }

    // Check if user can generate AI posts
    if (!subscriptionUsage?.canGenerateAI) {
      toast.error(
        `You've reached your AI post limit (${
          subscriptionUsage?.aiPostsLimit || 0
        }). Upgrade your plan to generate more AI posts.`
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/blogs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: aiDescription.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.data) {
        // Update local usage state with response data
        if (result.usage) {
          setSubscriptionUsage(result.usage);
        }

        // Trigger subscription refresh in sidebar
        triggerRefresh();

        // Show success toast with usage information
        const remainingAfterGeneration = result.usage?.remainingPosts ?? 0;
        toast.success(
          `✅ AI successfully generated your blog post! ${
            remainingAfterGeneration > 0
              ? `${remainingAfterGeneration} AI posts remaining.`
              : `You've used all your AI posts for your ${result.usage?.plan} plan.`
          }`
        );

        onOpenChange(false);
        // Reset state
        setStep("choose");
        setAiDescription("");
        // Redirect to edit page with the generated blog
        router.push(`/dashboard/blogs/${result.data.id}/edit`);
      } else {
        // Handle specific error cases
        if (result.limitReached) {
          toast.error(result.error || "You've reached your AI post limit.");
          // Update usage state if provided
          if (result.usage) {
            setSubscriptionUsage(result.usage);
          }
        } else {
          throw new Error(result.error || "Failed to generate blog post");
        }
      }
    } catch (error) {
      console.error("Error generating blog post:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate blog post"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("choose");
    setAiDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Create New Blog Post</DialogTitle>
              <DialogDescription>
                Choose how you&apos;d like to create your blog post
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Card
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={handleCreateFromScratch}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <FileText className="h-5 w-5" />
                    Create from Scratch
                  </CardTitle>
                  <CardDescription>
                    Start with a blank canvas and write your blog post manually
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className={`transition-colors ${
                  loadingUsage
                    ? "opacity-50"
                    : subscriptionUsage?.canGenerateAI
                    ? "cursor-pointer hover:bg-accent"
                    : "opacity-60 cursor-not-allowed bg-muted"
                }`}
                onClick={
                  !loadingUsage && subscriptionUsage?.canGenerateAI
                    ? handleChooseAI
                    : undefined
                }
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Sparkles
                      className={`h-5 w-5 ${
                        subscriptionUsage?.canGenerateAI
                          ? "text-purple-600"
                          : "text-muted-foreground"
                      }`}
                    />
                    Create with AI
                    {loadingUsage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      subscriptionUsage && (
                        <div className="flex items-center gap-2 ml-auto">
                          {subscriptionUsage.canGenerateAI ? (
                            <Badge variant="secondary" className="text-xs">
                              {subscriptionUsage.remainingPosts} remaining
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="text-xs flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Limit reached
                            </Badge>
                          )}
                        </div>
                      )
                    )}
                  </CardTitle>
                  <CardDescription>
                    {loadingUsage ? (
                      "Loading usage information..."
                    ) : !subscriptionUsage?.canGenerateAI ? (
                      <>
                        You&apos;ve used all{" "}
                        {subscriptionUsage?.aiPostsLimit || 0} AI posts for your{" "}
                        {subscriptionUsage?.plan} plan.{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChange(false);
                            router.push("/dashboard/pricing");
                          }}
                        >
                          Upgrade now
                        </Button>
                      </>
                    ) : (
                      <>
                        Describe your topic and let AI generate a blog post for
                        you. Mention word count if you have a preference.{" "}
                        <span className="text-muted-foreground">
                          ({subscriptionUsage.aiPostsUsed}/
                          {subscriptionUsage.aiPostsLimit} used)
                        </span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </>
        )}

        {step === "ai-form" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Generate Blog with AI
                {subscriptionUsage && (
                  <Badge
                    variant={
                      subscriptionUsage.canGenerateAI
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {subscriptionUsage.aiPostsUsed}/
                    {subscriptionUsage.aiPostsLimit} used
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {subscriptionUsage?.canGenerateAI ? (
                  <>
                    Describe what you want your blog post to be about, and AI
                    will create it for you. Specify word count if desired
                    (default: ~300 words).
                    {subscriptionUsage.remainingPosts === 1 && (
                      <span className="text-orange-600 font-medium">
                        {" "}
                        This is your last AI post for your{" "}
                        {subscriptionUsage.plan} plan.
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-destructive">
                    You&apos;ve reached your AI post limit for your{" "}
                    {subscriptionUsage?.plan} plan.
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary underline ml-1"
                      onClick={() => {
                        onOpenChange(false);
                        router.push("/dashboard/pricing");
                      }}
                    >
                      Upgrade now
                    </Button>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ai-description">Blog Post Description</Label>
                <Textarea
                  id="ai-description"
                  placeholder="Example: Write a comprehensive guide about sustainable living practices, including tips for reducing waste, energy conservation, and eco-friendly lifestyle changes. Target audience should be beginners who want to make a positive environmental impact. Make it around 500 words."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the topic, target audience, and any key
                  points you want covered. You can also specify word count
                  (e.g., "500 words") - defaults to ~300 words.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleBackToChoose}
                disabled={isGenerating}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateWithAI}
                  disabled={
                    isGenerating ||
                    !aiDescription.trim() ||
                    !subscriptionUsage?.canGenerateAI
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : !subscriptionUsage?.canGenerateAI ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Limit Reached
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Blog
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
