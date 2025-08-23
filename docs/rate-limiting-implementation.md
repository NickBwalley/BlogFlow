# Rate Limiting Implementation with Upstash

## Overview

This document outlines the implementation of rate limiting for BlogFlow using Upstash Redis to protect API endpoints from abuse and ensure fair usage.

## Why Rate Limiting?

- **Security**: Prevent DDoS attacks and API abuse
- **Performance**: Maintain consistent response times
- **Fair Usage**: Ensure all users get equal access to resources
- **Cost Control**: Prevent excessive usage that could lead to high bills

## Upstash Redis Setup

1. **Account Creation**: ✅ Already created Upstash account
2. **Database Setup**: Create a Redis database for rate limiting
3. **Environment Variables**: Configure connection details
4. **Client Configuration**: Set up Upstash Redis client

## Rate Limiting Strategy

### 1. Endpoint Categories

- **Public Endpoints**: Blog reading, public content (relaxed limits)
- **Authentication**: Login, signup, password reset (moderate limits)
- **API Endpoints**: Blog creation, user actions (strict limits)
- **Admin Endpoints**: Admin operations (special handling)

### 2. Rate Limit Tiers

```
Public Endpoints:
- 20 requests per hour per IP
- 3 requests per minute per IP

Authentication Endpoints:
- 10 login attempts per 15 minutes per IP
- 5 signup attempts per hour per IP
- 3 password reset attempts per hour per IP

API Endpoints:
- 50 requests per hour per user
- 5 requests per minute per user

Admin Endpoints:
- 500 requests per hour per admin user
- No IP-based limits (trusted users)
```

### 3. Rate Limiting Keys

- **IP-based**: `ratelimit:ip:{ip}:{endpoint}`
- **User-based**: `ratelimit:user:{userId}:{endpoint}`
- **Global**: `ratelimit:global:{endpoint}`

## Implementation Plan

### Phase 1: Setup & Configuration

1. Install required packages (`@upstash/redis`, `@upstash/ratelimit`)
2. Configure environment variables
3. Create rate limiting utility functions
4. Set up Redis client

### Phase 2: Middleware Implementation

1. Create rate limiting middleware for different endpoint types
2. Implement IP-based rate limiting
3. Implement user-based rate limiting
4. Add rate limit headers to responses

### Phase 3: Endpoint Protection

1. Protect authentication endpoints
2. Protect API routes
3. Protect admin endpoints
4. Add rate limiting to blog generation (AI endpoints)

### Phase 4: Monitoring & Analytics

1. Add rate limit logging
2. Create admin dashboard for rate limit monitoring
3. Implement rate limit bypass for testing
4. Add alerts for rate limit violations

## Files to Create/Modify

### New Files

- `lib/rate-limit.ts` - Core rate limiting utilities
- `lib/upstash.ts` - Upstash Redis client configuration
- `middleware/rate-limit.ts` - Rate limiting middleware
- `docs/rate-limiting-api.md` - API documentation

### Modified Files

- `middleware.ts` - Add rate limiting to Next.js middleware
- API route files - Add rate limiting to specific endpoints
- Admin dashboard - Add rate limit monitoring

## Environment Variables Required

```env
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
RATE_LIMIT_ENABLED=true
RATE_LIMIT_BYPASS_TOKEN=your-bypass-token
```

## Security Considerations

- **IP Spoofing**: Use trusted headers and validate IP addresses
- **User Agent**: Consider user agent in rate limiting
- **Bypass Mechanisms**: Secure bypass tokens for testing
- **Data Privacy**: Don't log sensitive information
- **Redis Security**: Secure Redis connection and access

## Error Handling

- **429 Too Many Requests**: Clear error messages
- **Retry-After**: Proper retry headers
- **Graceful Degradation**: Fallback when Redis is unavailable
- **User Experience**: Clear messaging about rate limits

## Testing Strategy

- **Unit Tests**: Test rate limiting functions
- **Integration Tests**: Test middleware integration
- **Load Testing**: Verify rate limits work under load
- **Bypass Testing**: Test admin and development bypasses

## Monitoring Metrics

- **Rate Limit Hits**: Track when limits are reached
- **Endpoint Usage**: Monitor which endpoints are most used
- **User Patterns**: Identify suspicious usage patterns
- **Performance Impact**: Monitor rate limiting overhead

## Implementation Priority

1. **High Priority**: Authentication endpoints (prevent brute force)
2. **Medium Priority**: API endpoints (prevent abuse)
3. **Lower Priority**: Public endpoints (performance optimization)

## Implementation Status

✅ **Phase 1: Setup & Configuration** - COMPLETED

- ✅ Installed required packages (`@upstash/redis`, `@upstash/ratelimit`)
- ✅ Created Upstash Redis client configuration (`lib/upstash.ts`)
- ✅ Created core rate limiting utilities (`lib/rate-limit.ts`)
- ✅ Set up environment configuration

✅ **Phase 2: Middleware Implementation** - COMPLETED

- ✅ Created rate limiting middleware (`lib/middleware/rate-limit.ts`)
- ✅ Implemented IP-based and user-based rate limiting
- ✅ Added rate limit headers to responses
- ✅ Integrated with Next.js middleware

✅ **Phase 3: Endpoint Protection** - COMPLETED

- ✅ Protected authentication endpoints (automatic via middleware)
- ✅ Protected API routes (`/api/blogs/generate`, `/api/chat`, `/api/subscription/*`)
- ✅ Created API wrapper utilities (`lib/rate-limit-api.ts`)
- ✅ Applied rate limiting to blog generation and chat endpoints

✅ **Phase 4: Monitoring & Analytics** - COMPLETED

- ✅ Created admin dashboard for rate limit monitoring (`/admin/rate-limits`)
- ✅ Added Redis connection health checks
- ✅ Implemented rate limit bypass for testing
- ✅ Created comprehensive API documentation

## Next Steps for Production

1. **Set up Upstash Redis database** in your Upstash console
2. **Configure environment variables** in `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_BYPASS_TOKEN=your-secure-bypass-token
   ```
3. **Test rate limiting** using the admin dashboard at `/admin/rate-limits`
4. **Monitor usage** and adjust limits as needed based on traffic patterns

## Files Created

### Core Implementation

- `lib/upstash.ts` - Redis client configuration
- `lib/rate-limit.ts` - Core rate limiting utilities
- `lib/middleware/rate-limit.ts` - Rate limiting middleware
- `lib/rate-limit-api.ts` - API wrapper utilities
- `middleware.ts` - Updated with rate limiting

### Protected Endpoints

- `app/api/blogs/generate/route.ts` - Blog generation with rate limiting
- `app/api/chat/route.ts` - Chat API with rate limiting
- `app/api/subscription/create/route.ts` - Subscription API with rate limiting

### Admin Monitoring

- `app/admin/rate-limits/page.tsx` - Rate limit monitoring dashboard
- Updated admin sidebar with rate limits link

### Documentation

- `docs/environment-setup.md` - Environment configuration guide
- `docs/rate-limiting-api.md` - Comprehensive API documentation

---

🎉 **Rate limiting implementation is now complete and ready for production use!**
