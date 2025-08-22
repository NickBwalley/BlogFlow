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

// Rate limit middleware factory
export function createRateLimitMiddleware(type: RateLimitType) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Check if rate limiting should be bypassed
      if (shouldBypassRateLimit(request)) {
        return null; // Continue to next middleware
      }

      let identifier: string;
      let rateLimitType = type;

      // Determine identifier and rate limit type based on endpoint type
      if (type === "api-user" || type === "admin") {
        // For API and admin endpoints, try to get user ID
        const userId = await getUserIdFromRequest(request);

        if (userId) {
          identifier = userId;

          // Check if user is admin for admin endpoints
          if (type === "admin" || (await isAdminUser(userId))) {
            rateLimitType = "admin";
          }
        } else {
          // Fall back to IP-based rate limiting if no user ID
          identifier = getClientIP(request);
          rateLimitType = "public";
        }
      } else {
        // For public and auth endpoints, use IP-based rate limiting
        identifier = getClientIP(request);
      }

      // Check rate limit
      const rateLimitResult = await checkRateLimit(
        rateLimitType,
        identifier,
        request
      );

      // Create response headers
      const headers = createRateLimitHeaders(rateLimitResult);

      if (!rateLimitResult.success) {
        // Rate limit exceeded - return 429 response
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

      // Rate limit passed - add headers and continue
      const response = NextResponse.next();

      // Add rate limit headers to response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error("Rate limit middleware error:", error);

      // Fail open - continue if rate limiting fails
      return null;
    }
  };
}

// Specific middleware instances for different endpoint types
export const publicRateLimit = createRateLimitMiddleware("public");
export const authLoginRateLimit = createRateLimitMiddleware("auth-login");
export const authSignupRateLimit = createRateLimitMiddleware("auth-signup");
export const authPasswordResetRateLimit = createRateLimitMiddleware(
  "auth-password-reset"
);
export const apiUserRateLimit = createRateLimitMiddleware("api-user");
export const chatRateLimit = createRateLimitMiddleware("chat");
export const blogGenerationRateLimit =
  createRateLimitMiddleware("blog-generation");
export const adminRateLimit = createRateLimitMiddleware("admin");

// Helper function to determine which rate limiter to use based on path
export function getRateLimiterForPath(
  pathname: string
): ((request: NextRequest) => Promise<NextResponse | null>) | null {
  // Only apply rate limiting to API routes
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  // Authentication API endpoints
  if (
    pathname.includes("/api/auth/signin") ||
    pathname.includes("/api/auth/login")
  ) {
    return authLoginRateLimit;
  }

  if (
    pathname.includes("/api/auth/signup") ||
    pathname.includes("/api/auth/register")
  ) {
    return authSignupRateLimit;
  }

  if (
    pathname.includes("/api/auth/reset-password") ||
    pathname.includes("/api/auth/forgot-password")
  ) {
    return authPasswordResetRateLimit;
  }

  // Specific API endpoint rate limits
  if (pathname === "/api/chat") {
    return chatRateLimit;
  }

  if (pathname === "/api/blogs/generate") {
    return blogGenerationRateLimit;
  }

  // Admin API endpoints
  if (pathname.startsWith("/api/admin")) {
    return adminRateLimit;
  }

  // All other API endpoints use general API user-based rate limiting
  return apiUserRateLimit;
}

// Main rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Get appropriate rate limiter for this path
  const rateLimiter = getRateLimiterForPath(pathname);

  if (!rateLimiter) {
    return null; // No rate limiting for this path
  }

  // Apply rate limiting
  return await rateLimiter(request);
}
