// Rate limit configurations - reasonable limits for production use
// This file contains only configuration data and can be safely imported in client components
export const rateLimitConfigs = {
  // Public endpoints - more reasonable limits
  public: {
    requests: 100,
    window: "1 h", // 100 requests per hour per IP
  },
  publicMinute: {
    requests: 20,
    window: "1 m", // 20 requests per minute per IP
  },

  // Authentication endpoints - prevent brute force
  authLogin: {
    requests: 10,
    window: "15 m", // 10 login attempts per 15 minutes per IP
  },
  authSignup: {
    requests: 5,
    window: "1 h", // 5 signup attempts per hour per IP
  },
  authPasswordReset: {
    requests: 3,
    window: "1 h", // 3 password reset attempts per hour per IP
  },

  // API endpoints - per authenticated user
  apiUser: {
    requests: 200,
    window: "1 h", // 200 requests per hour per user
  },
  apiUserMinute: {
    requests: 50,
    window: "1 m", // 50 requests per minute per user
  },

  // AI-powered features - stricter limits
  chat: {
    requests: 10,
    window: "1 m", // 10 chat messages per minute per user (STRICT)
  },
  chatHourly: {
    requests: 100,
    window: "1 h", // 100 chat messages per hour per user
  },
  blogGeneration: {
    requests: 3,
    window: "1 m", // 3 blog generations per minute per user (STRICT)
  },
  blogGenerationHourly: {
    requests: 20,
    window: "1 h", // 20 blog generations per hour per user
  },

  // Admin operations - higher limits
  admin: {
    requests: 1000,
    window: "1 h", // 1000 requests per hour for admin users
  },
} as const;

// Rate limit types for type safety
export type RateLimitType = keyof typeof rateLimitConfigs;
