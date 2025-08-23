# Rate Limiting API Documentation

## Overview

BlogFlow uses Upstash Redis for rate limiting to protect against abuse and ensure fair usage. Rate limits are applied automatically through middleware and can be monitored through the admin dashboard.

## Rate Limit Configuration

### Public Endpoints

- **Limit**: 20 requests per hour per IP + 3 requests per minute per IP
- **Endpoints**: `/blogs/*`, `/`, public pages
- **Identifier**: Client IP address

### Authentication Endpoints

- **Login**: 10 attempts per 15 minutes per IP
- **Signup**: 5 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP
- **Identifier**: Client IP address

### API Endpoints

- **Limit**: 50 requests per hour per user + 5 requests per minute per user
- **Endpoints**: `/api/blogs/generate`, `/api/chat`, `/api/subscription/*`
- **Identifier**: Authenticated user ID (falls back to IP if not authenticated)

### Admin Endpoints

- **Limit**: 500 requests per hour per admin user
- **Endpoints**: `/admin/*`, `/api/admin/*`
- **Identifier**: Admin user ID

## Response Headers

All responses include rate limiting headers:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1234567890
```

When rate limited (HTTP 429):

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

## Error Response Format

When rate limited, endpoints return HTTP 429 with:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

## User Notifications

The application automatically shows toast notifications when users hit rate limits:

- **Error Toast**: Displays when rate limits are exceeded
- **Descriptive Messages**: Clear explanation of what happened and when to retry
- **Retry Timing**: Shows how long to wait before trying again
- **Auto-dismiss**: Toasts automatically disappear after the retry period

### Toast Examples

```typescript
// Rate limit exceeded toast
toast.error("Rate Limit Exceeded", {
  description:
    "You've made too many requests. Please wait 2 minutes before trying again.",
  duration: 5000,
  action: {
    label: "Dismiss",
    onClick: () => {},
  },
});
```

## Bypass for Development

Use the bypass header for testing:

```
X-Rate-Limit-Bypass: your-bypass-token
```

Set the bypass token in your environment:

```env
RATE_LIMIT_BYPASS_TOKEN=your-secure-token
```

## Implementation Examples

### Frontend: Using the Custom Hook

```typescript
import { useApiWithRateLimit } from "@/hooks/use-api-with-rate-limit";

function MyComponent() {
  const { post } = useApiWithRateLimit();

  const handleSubmit = async () => {
    try {
      const response = await post("/api/blogs/generate", {
        description: "My blog post",
      });
      const data = await response.json();
      // Handle success
    } catch (error) {
      // Rate limit errors are automatically handled with toast
      console.error("Request failed:", error);
    }
  };

  return <button onClick={handleSubmit}>Generate Blog</button>;
}
```

### Frontend: Manual Rate Limit Handling

```typescript
import { handleApiError } from "@/lib/utils/rate-limit-toast";

const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// Handle rate limit errors with toast
if (response.status === 429) {
  await handleApiError(response);
  return;
}
```

### Backend: Using in API Routes

```typescript
import { checkAPIRateLimit } from "@/lib/rate-limit-api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitCheck = await checkAPIRateLimit(req, "api-user");
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  // Your API logic here
  return new Response("Success");
}
```

### Backend: Using with Wrapper

```typescript
import { withApiRateLimit } from "@/lib/rate-limit-api";

export const POST = withApiRateLimit(async (req: NextRequest) => {
  // Your API logic here
  return new Response("Success");
});
```

### Backend: Manual Rate Limit Check

```typescript
import { checkAPIRateLimit } from "@/lib/rate-limit-api";

export async function POST(req: NextRequest) {
  const { allowed, headers } = await checkAPIRateLimit(req, "api-user");

  if (!allowed) {
    return new Response("Rate limited", {
      status: 429,
      headers,
    });
  }

  const response = new Response("Success");

  // Add rate limit headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

## Monitoring

### Admin Dashboard

- Visit `/admin/rate-limits` to monitor rate limiting status
- Check Redis connection health
- View current configuration
- Test rate limits for specific IPs

### Environment Variables

Required environment variables:

```env
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
RATE_LIMIT_ENABLED=true
RATE_LIMIT_BYPASS_TOKEN=your-bypass-token
```

### Debugging

Check rate limiting status:

1. Look for rate limit headers in responses
2. Monitor Redis connection in admin dashboard
3. Check console logs for rate limiting errors
4. Use bypass token for testing

## Security Considerations

- Rate limits are applied per IP for public endpoints
- Authenticated endpoints use user ID for more accurate limiting
- Admin users have higher limits but are still rate limited
- Bypass tokens should be kept secure and only used for testing
- Rate limiting fails open (allows requests) if Redis is unavailable

## Performance Impact

- Rate limiting adds ~1-5ms to request processing time
- Uses Redis for storage to minimize memory usage
- Sliding window algorithm provides smooth rate limiting
- Analytics are enabled for monitoring usage patterns
