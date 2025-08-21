"use client";

import { useState } from "react";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [step, setStep] = useState<"choose" | "ai-form">("choose");
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

      if (!response.ok) {
        throw new Error("Failed to generate blog post");
      }

      const result = await response.json();

      if (result.success && result.data) {
        toast.success("Blog post generated successfully!");
        onOpenChange(false);
        // Reset state
        setStep("choose");
        setAiDescription("");
        // Redirect to edit page with the generated blog
        router.push(`/dashboard/blogs/${result.data.id}/edit`);
      } else {
        throw new Error(result.error || "Failed to generate blog post");
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
                Choose how you'd like to create your blog post
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
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={handleChooseAI}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Create with AI
                  </CardTitle>
                  <CardDescription>
                    Describe your topic and let AI generate a complete blog post
                    for you
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
              </DialogTitle>
              <DialogDescription>
                Describe what you want your blog post to be about, and AI will
                create it for you
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ai-description">Blog Post Description</Label>
                <Textarea
                  id="ai-description"
                  placeholder="Example: Write a comprehensive guide about sustainable living practices, including tips for reducing waste, energy conservation, and eco-friendly lifestyle changes. Target audience should be beginners who want to make a positive environmental impact."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about the topic, target audience, and any key
                  points you want covered.
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
                  disabled={isGenerating || !aiDescription.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
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
