import { Redis } from "@upstash/redis";

// Create Redis client for rate limiting
export const redis = Redis.fromEnv();

// Test connection function
export async function testRedisConnection() {
  try {
    const result = await redis.ping();
    console.log("Redis connection test:", result);
    return result === "PONG";
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}

// Redis helper functions
export const redisHelpers = {
  // Set a key with expiration
  async setWithExpiry(
    key: string,
    value: string | number,
    expireInSeconds: number
  ) {
    return redis.setex(key, expireInSeconds, value);
  },

  // Get a key
  async get(key: string) {
    return redis.get(key);
  },

  // Increment a counter
  async increment(key: string) {
    return redis.incr(key);
  },

  // Set expiry on existing key
  async expire(key: string, seconds: number) {
    return redis.expire(key, seconds);
  },

  // Delete a key
  async delete(key: string) {
    return redis.del(key);
  },

  // Check if key exists
  async exists(key: string) {
    return redis.exists(key);
  },
};
