import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";
import { NextRequest } from "next/server";
import { rateLimitConfigs, type RateLimitType } from "@/lib/rate-limit-config";

// Re-export for backward compatibility
export { rateLimitConfigs, type RateLimitType };

// Create rate limiters for different scenarios
export const rateLimiters = {
  // IP-based rate limiters
  publicByIP: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.public.requests,
      rateLimitConfigs.public.window
    ),
    analytics: true,
    prefix: "ratelimit:public:ip",
  }),

  publicByIPMinute: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.publicMinute.requests,
      rateLimitConfigs.publicMinute.window
    ),
    analytics: true,
    prefix: "ratelimit:public:ip:minute",
  }),

  // Authentication rate limiters (IP-based)
  authLoginByIP: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.authLogin.requests,
      rateLimitConfigs.authLogin.window
    ),
    analytics: true,
    prefix: "ratelimit:auth:login:ip",
  }),

  authSignupByIP: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.authSignup.requests,
      rateLimitConfigs.authSignup.window
    ),
    analytics: true,
    prefix: "ratelimit:auth:signup:ip",
  }),

  authPasswordResetByIP: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.authPasswordReset.requests,
      rateLimitConfigs.authPasswordReset.window
    ),
    analytics: true,
    prefix: "ratelimit:auth:password:ip",
  }),

  // User-based rate limiters (for authenticated API endpoints)
  apiByUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.apiUser.requests,
      rateLimitConfigs.apiUser.window
    ),
    analytics: true,
    prefix: "ratelimit:api:user",
  }),

  apiByUserMinute: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.apiUserMinute.requests,
      rateLimitConfigs.apiUserMinute.window
    ),
    analytics: true,
    prefix: "ratelimit:api:user:minute",
  }),

  // Chat specific rate limiters
  chatByUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.chat.requests,
      rateLimitConfigs.chat.window
    ),
    analytics: true,
    prefix: "ratelimit:chat:user",
  }),

  chatByUserHourly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.chatHourly.requests,
      rateLimitConfigs.chatHourly.window
    ),
    analytics: true,
    prefix: "ratelimit:chat:user:hourly",
  }),

  // Blog generation specific rate limiters
  blogGenerationByUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.blogGeneration.requests,
      rateLimitConfigs.blogGeneration.window
    ),
    analytics: true,
    prefix: "ratelimit:blog:user",
  }),

  blogGenerationByUserHourly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.blogGenerationHourly.requests,
      rateLimitConfigs.blogGenerationHourly.window
    ),
    analytics: true,
    prefix: "ratelimit:blog:user:hourly",
  }),

  // Admin rate limiters (user-based)
  adminByUser: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      rateLimitConfigs.admin.requests,
      rateLimitConfigs.admin.window
    ),
    analytics: true,
    prefix: "ratelimit:admin:user",
  }),
};

// Helper function to get client IP address
export function getClientIP(request: NextRequest): string {
  // Check for various IP headers in order of priority
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  // Fallback to default when all headers are unavailable
  return "127.0.0.1";
}

// Helper function to get user ID from request
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  try {
    // For API routes, we'll handle user authentication within each route
    // This function should remain lightweight for middleware use

    // Check for a simple user ID in headers (if you want to implement this)
    const userId = request.headers.get("x-user-id");
    if (userId) return userId;

    // For now, return null to use IP-based rate limiting
    // This is actually fine for most use cases
    return null;
  } catch (error) {
    console.error("Error extracting user ID:", error);
    return null;
  }
}

// Check if user is admin (for admin rate limiting)
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import("@/lib/server");
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Main rate limiting function
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
  _request?: NextRequest // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  try {
    let result;

    switch (type) {
      case "public":
        // Apply both hourly and minute-based limits for public endpoints
        const [hourlyResult, minuteResult] = await Promise.all([
          rateLimiters.publicByIP.limit(identifier),
          rateLimiters.publicByIPMinute.limit(identifier),
        ]);

        // Use the most restrictive limit
        result =
          hourlyResult.success && minuteResult.success
            ? hourlyResult
            : !hourlyResult.success
            ? hourlyResult
            : minuteResult;
        break;

      case "authLogin":
        result = await rateLimiters.authLoginByIP.limit(identifier);
        break;

      case "authSignup":
        result = await rateLimiters.authSignupByIP.limit(identifier);
        break;

      case "authPasswordReset":
        result = await rateLimiters.authPasswordResetByIP.limit(identifier);
        break;

      case "apiUser":
        // Apply both hourly and minute-based limits for API endpoints
        const [apiHourlyResult, apiMinuteResult] = await Promise.all([
          rateLimiters.apiByUser.limit(identifier),
          rateLimiters.apiByUserMinute.limit(identifier),
        ]);

        result =
          apiHourlyResult.success && apiMinuteResult.success
            ? apiHourlyResult
            : !apiHourlyResult.success
            ? apiHourlyResult
            : apiMinuteResult;
        break;

      case "chat":
        // Apply both hourly and minute-based limits for chat
        const [chatHourlyResult, chatMinuteResult] = await Promise.all([
          rateLimiters.chatByUserHourly.limit(identifier),
          rateLimiters.chatByUser.limit(identifier),
        ]);

        result =
          chatHourlyResult.success && chatMinuteResult.success
            ? chatHourlyResult
            : !chatHourlyResult.success
            ? chatHourlyResult
            : chatMinuteResult;
        break;

      case "blogGeneration":
        // Apply both hourly and minute-based limits for blog generation
        const [blogHourlyResult, blogMinuteResult] = await Promise.all([
          rateLimiters.blogGenerationByUserHourly.limit(identifier),
          rateLimiters.blogGenerationByUser.limit(identifier),
        ]);

        result =
          blogHourlyResult.success && blogMinuteResult.success
            ? blogHourlyResult
            : !blogHourlyResult.success
            ? blogHourlyResult
            : blogMinuteResult;
        break;

      case "admin":
        result = await rateLimiters.adminByUser.limit(identifier);
        break;

      default:
        throw new Error(`Unknown rate limit type: ${type}`);
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success
        ? undefined
        : Math.round((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);

    // Fail open - allow the request if rate limiting fails
    // In production, you might want to fail closed for security
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}

// Bypass function for development/testing
export function shouldBypassRateLimit(request: NextRequest): boolean {
  const bypassToken = process.env.RATE_LIMIT_BYPASS_TOKEN;
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== "false";

  if (!rateLimitEnabled) return true;
  if (!bypassToken) return false;

  const authHeader = request.headers.get("x-rate-limit-bypass");
  return authHeader === bypassToken;
}

// Create response headers for rate limiting
export function createRateLimitHeaders(rateLimitResult: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": rateLimitResult.limit.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
    "X-RateLimit-Reset": rateLimitResult.reset.toString(),
  };

  if (rateLimitResult.retryAfter) {
    headers["Retry-After"] = rateLimitResult.retryAfter.toString();
  }

  return headers;
}
