import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIP,
  getUserIdFromRequest,
  isAdminUser,
  shouldBypassRateLimit,
  createRateLimitHeaders,
  type RateLimitType,
} from "@/lib/rate-limit";

// Rate limit wrapper for API routes
export async function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimitType: RateLimitType = "apiUser"
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check if rate limiting should be bypassed
      if (shouldBypassRateLimit(request)) {
        return await handler(request);
      }

      let identifier: string;
      let actualRateLimitType = rateLimitType;

      // Determine identifier based on rate limit type
      if (rateLimitType === "apiUser" || rateLimitType === "admin") {
        const userId = await getUserIdFromRequest(request);

        if (userId) {
          identifier = userId;

          // Check if user is admin
          if (rateLimitType === "admin" || (await isAdminUser(userId))) {
            actualRateLimitType = "admin";
          }
        } else {
          // Fall back to IP-based limiting
          identifier = getClientIP(request);
          actualRateLimitType = "public";
        }
      } else {
        identifier = getClientIP(request);
      }

      // Check rate limit
      const rateLimitResult = await checkRateLimit(
        actualRateLimitType,
        identifier,
        request
      );

      if (!rateLimitResult.success) {
        // Rate limit exceeded
        const headers = createRateLimitHeaders(rateLimitResult);

        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              ...headers,
            },
          }
        );
      }

      // Execute the handler
      const response = await handler(request);

      // Add rate limit headers to successful responses
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error("Rate limit wrapper error:", error);

      // Fail open - execute handler if rate limiting fails
      return await handler(request);
    }
  };
}

// Convenience functions for different rate limit types
export const withPublicRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => withRateLimit(handler, "public");

export const withAuthRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>,
  type: "authLogin" | "authSignup" | "authPasswordReset" = "authLogin"
) => withRateLimit(handler, type);

export const withApiRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => withRateLimit(handler, "apiUser");

export const withAdminRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => withRateLimit(handler, "admin");

export const withChatRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => withRateLimit(handler, "chat");

export const withBlogGenerationRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => withRateLimit(handler, "blogGeneration");

// Manual rate limit check for use within route handlers
export async function checkAPIRateLimit(
  request: NextRequest,
  rateLimitType: RateLimitType = "apiUser"
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}> {
  try {
    if (shouldBypassRateLimit(request)) {
      return { allowed: true, headers: {} };
    }

    let identifier: string;
    let actualRateLimitType = rateLimitType;

    if (rateLimitType === "apiUser" || rateLimitType === "admin") {
      const userId = await getUserIdFromRequest(request);

      if (userId) {
        identifier = userId;

        if (rateLimitType === "admin" || (await isAdminUser(userId))) {
          actualRateLimitType = "admin";
        }
      } else {
        identifier = getClientIP(request);
        actualRateLimitType = "public";
      }
    } else {
      identifier = getClientIP(request);
    }

    const rateLimitResult = await checkRateLimit(
      actualRateLimitType,
      identifier,
      request
    );
    const headers = createRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      const response = new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );

      return { allowed: false, response, headers };
    }

    return { allowed: true, headers };
  } catch (error) {
    console.error("Manual rate limit check error:", error);
    return { allowed: true, headers: {} };
  }
}
