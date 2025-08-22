# Environment Variables for Rate Limiting

Add these environment variables to your `.env.local` file:

```env
# Rate Limiting with Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_BYPASS_TOKEN=your-secure-bypass-token-for-testing
```

## How to Get Upstash Redis Credentials

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the database details
4. Add them to your `.env.local` file

## Configuration Options

- `RATE_LIMIT_ENABLED`: Set to `false` to disable rate limiting entirely
- `RATE_LIMIT_BYPASS_TOKEN`: A secure token that can be used to bypass rate limits for testing (use the `X-Rate-Limit-Bypass` header)

## Testing Rate Limits

You can test rate limits by making multiple requests to your endpoints. The rate limiting headers will be included in the response:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1234567890
```

When rate limited, you'll get a 429 response with:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```
