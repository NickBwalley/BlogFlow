"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiWithRateLimit } from "@/hooks/use-api-with-rate-limit";
import { handleApiError } from "@/lib/utils/rate-limit-toast";

/**
 * Demo component showing different ways to handle rate limits with toast notifications
 * This is for development/testing purposes only
 */
export function RateLimitDemo() {
  const [loading, setLoading] = useState(false);
  const { post, get } = useApiWithRateLimit();

  // Method 1: Using the custom hook
  const testWithHook = async () => {
    setLoading(true);
    try {
      await post("/api/blogs/generate", {
        description: "Test blog post for rate limiting",
      });
    } catch (error) {
      console.log("Request failed (handled by hook):", error);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Manual rate limit handling
  const testManual = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
        }),
      });

      if (response.status === 429) {
        await handleApiError(response);
        return;
      }

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();
      console.log("Success:", data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Multiple rapid requests to trigger rate limit
  const testRapidRequests = async () => {
    setLoading(true);
    try {
      // Make 10 rapid requests to trigger rate limit
      const promises = Array.from({ length: 10 }, (_, i) =>
        fetch("/api/subscription/usage").catch(() => null)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Rate Limit Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Test different rate limiting scenarios with toast notifications:
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={testWithHook} disabled={loading} variant="outline">
            Test Blog Generation (Custom Hook)
          </Button>

          <Button onClick={testManual} disabled={loading} variant="outline">
            Test Chat API (Manual Handling)
          </Button>

          <Button
            onClick={testRapidRequests}
            disabled={loading}
            variant="outline"
          >
            Test Rapid Requests (Global Interceptor)
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <strong>Note:</strong> This component is for testing purposes. Rapid
          requests will trigger rate limits and show toast notifications.
        </div>
      </CardContent>
    </Card>
  );
}
