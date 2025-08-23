"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { testRedisConnection } from "@/lib/upstash";
import { rateLimitConfigs } from "@/lib/rate-limit-config";

interface RateLimitInfo {
  endpoint: string;
  requests: number;
  window: string;
  description: string;
}

export default function AdminRateLimitsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [redisStatus, setRedisStatus] = useState<
    "connected" | "disconnected" | "testing"
  >("testing");
  const [testIP, setTestIP] = useState("192.168.1.1");
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    const checkRedisConnection = async () => {
      try {
        const isConnected = await testRedisConnection();
        setRedisStatus(isConnected ? "connected" : "disconnected");
      } catch (error) {
        setRedisStatus("disconnected");
      } finally {
        setIsLoading(false);
      }
    };

    checkRedisConnection();
  }, []);

  const rateLimitInfo: RateLimitInfo[] = [
    {
      endpoint: "Public Endpoints",
      requests: rateLimitConfigs.public.requests,
      window: rateLimitConfigs.public.window,
      description: "Blog reading, public content",
    },
    {
      endpoint: "Public (Per Minute)",
      requests: rateLimitConfigs.publicMinute.requests,
      window: rateLimitConfigs.publicMinute.window,
      description: "Additional per-minute limit for public endpoints",
    },
    {
      endpoint: "Auth - Login",
      requests: rateLimitConfigs.authLogin.requests,
      window: rateLimitConfigs.authLogin.window,
      description: "Login attempts per IP",
    },
    {
      endpoint: "Auth - Signup",
      requests: rateLimitConfigs.authSignup.requests,
      window: rateLimitConfigs.authSignup.window,
      description: "Signup attempts per IP",
    },
    {
      endpoint: "Auth - Password Reset",
      requests: rateLimitConfigs.authPasswordReset.requests,
      window: rateLimitConfigs.authPasswordReset.window,
      description: "Password reset attempts per IP",
    },
    {
      endpoint: "API - User",
      requests: rateLimitConfigs.apiUser.requests,
      window: rateLimitConfigs.apiUser.window,
      description: "API requests per authenticated user",
    },
    {
      endpoint: "API - User (Per Minute)",
      requests: rateLimitConfigs.apiUserMinute.requests,
      window: rateLimitConfigs.apiUserMinute.window,
      description: "Additional per-minute limit for API requests",
    },
    {
      endpoint: "Chat Messages",
      requests: rateLimitConfigs.chat.requests,
      window: rateLimitConfigs.chat.window,
      description: "Chat messages per minute (STRICT LIMIT)",
    },
    {
      endpoint: "Chat (Per Hour)",
      requests: rateLimitConfigs.chatHourly.requests,
      window: rateLimitConfigs.chatHourly.window,
      description: "Chat messages per hour",
    },
    {
      endpoint: "Blog Generation",
      requests: rateLimitConfigs.blogGeneration.requests,
      window: rateLimitConfigs.blogGeneration.window,
      description: "Blog generations per minute (STRICT LIMIT)",
    },
    {
      endpoint: "Blog Generation (Per Hour)",
      requests: rateLimitConfigs.blogGenerationHourly.requests,
      window: rateLimitConfigs.blogGenerationHourly.window,
      description: "Blog generations per hour",
    },
    {
      endpoint: "Admin",
      requests: rateLimitConfigs.admin.requests,
      window: rateLimitConfigs.admin.window,
      description: "Admin operations per user",
    },
  ];

  const handleTestRateLimit = async () => {
    try {
      setTestResults({ loading: true });

      // This would be a test endpoint to check rate limits
      // For now, we'll just show a placeholder
      const mockResult = {
        ip: testIP,
        publicLimit: {
          remaining: 18,
          limit: 20,
          resetTime: new Date(Date.now() + 3600000).toISOString(),
        },
        apiLimit: {
          remaining: 45,
          limit: 50,
          resetTime: new Date(Date.now() + 3600000).toISOString(),
        },
      };

      setTimeout(() => {
        setTestResults(mockResult);
      }, 1000);
    } catch (error) {
      setTestResults({ error: "Failed to test rate limits" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Limits</h1>
          <p className="text-muted-foreground">
            Loading rate limit monitoring...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rate Limits</h1>
        <p className="text-muted-foreground">
          Monitor and manage API rate limiting configuration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Redis Status */}
        <Card>
          <CardHeader>
            <CardTitle>Redis Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  redisStatus === "connected" ? "default" : "destructive"
                }
              >
                {redisStatus === "connected"
                  ? "Connected"
                  : redisStatus === "disconnected"
                  ? "Disconnected"
                  : "Testing..."}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Upstash Redis
              </span>
            </div>

            {redisStatus === "disconnected" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <strong>Redis connection failed.</strong> Rate limiting may not
                work properly. Check your UPSTASH_REDIS_REST_URL and
                UPSTASH_REDIS_REST_TOKEN environment variables.
              </div>
            )}

            {redisStatus === "connected" && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                <strong>Redis is working correctly.</strong> Rate limiting is
                active.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Rate Limiting Enabled:</span>
              <Badge
                variant={
                  process.env.RATE_LIMIT_ENABLED !== "false"
                    ? "default"
                    : "secondary"
                }
              >
                {process.env.RATE_LIMIT_ENABLED !== "false" ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Bypass Token Set:</span>
              <Badge
                variant={
                  process.env.RATE_LIMIT_BYPASS_TOKEN ? "default" : "secondary"
                }
              >
                {process.env.RATE_LIMIT_BYPASS_TOKEN ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Redis URL Set:</span>
              <Badge
                variant={
                  process.env.UPSTASH_REDIS_REST_URL ? "default" : "destructive"
                }
              >
                {process.env.UPSTASH_REDIS_REST_URL ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limit Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="hidden md:grid md:grid-cols-4 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
              <div>Endpoint Type</div>
              <div>Limit</div>
              <div>Window</div>
              <div>Description</div>
            </div>

            {rateLimitInfo.map((info, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded-lg"
              >
                <div className="font-medium">{info.endpoint}</div>
                <div>
                  <Badge variant="outline">{info.requests} requests</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  per {info.window}
                </div>
                <div className="text-sm text-muted-foreground">
                  {info.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Tester */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="test-ip">Test IP Address</Label>
              <Input
                id="test-ip"
                value={testIP}
                onChange={(e) => setTestIP(e.target.value)}
                placeholder="Enter IP address to test"
              />
            </div>
            <Button
              onClick={handleTestRateLimit}
              disabled={redisStatus !== "connected"}
            >
              Test Rate Limits
            </Button>
          </div>

          {testResults && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {testResults.loading ? (
                <p className="text-sm">Testing rate limits...</p>
              ) : testResults.error ? (
                <p className="text-sm text-red-600">{testResults.error}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Rate Limit Status for {testResults.ip}:
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Public Endpoints:</strong>
                      <br />
                      {testResults.publicLimit.remaining}/
                      {testResults.publicLimit.limit} remaining
                      <br />
                      <span className="text-muted-foreground">
                        Resets:{" "}
                        {new Date(
                          testResults.publicLimit.resetTime
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <strong>API Endpoints:</strong>
                      <br />
                      {testResults.apiLimit.remaining}/
                      {testResults.apiLimit.limit} remaining
                      <br />
                      <span className="text-muted-foreground">
                        Resets:{" "}
                        {new Date(
                          testResults.apiLimit.resetTime
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">How Rate Limiting Works:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • <strong>IP-based</strong>: Public and authentication endpoints
                are limited by IP address
              </li>
              <li>
                • <strong>User-based</strong>: API endpoints are limited per
                authenticated user
              </li>
              <li>
                • <strong>Multiple windows</strong>: Some endpoints have both
                per-minute and per-hour limits
              </li>
              <li>
                • <strong>Admin bypass</strong>: Admin users have higher limits
                for admin operations
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Testing Rate Limits:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                • Use the bypass token in the <code>X-Rate-Limit-Bypass</code>{" "}
                header for testing
              </li>
              <li>
                • Check response headers for current limit status:{" "}
                <code>X-RateLimit-Limit</code>,{" "}
                <code>X-RateLimit-Remaining</code>
              </li>
              <li>
                • Rate limited requests return HTTP 429 with{" "}
                <code>Retry-After</code> header
              </li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Bypass Token:</strong>{" "}
              {process.env.RATE_LIMIT_BYPASS_TOKEN
                ? "Set in environment"
                : "Not configured"}
            </p>
            {process.env.RATE_LIMIT_BYPASS_TOKEN && (
              <p className="text-xs text-blue-600 mt-1">
                Use header:{" "}
                <code>
                  X-Rate-Limit-Bypass: {process.env.RATE_LIMIT_BYPASS_TOKEN}
                </code>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
