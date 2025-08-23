"use server";

import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

// Helper function to check if current user is admin
async function checkAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

// Get system configuration status (admin only)
export async function getSystemConfig() {
  await checkAdminAccess();

  return {
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
    bypassTokenConfigured: !!process.env.RATE_LIMIT_BYPASS_TOKEN,
    redisConfigured: !!process.env.UPSTASH_REDIS_REST_URL,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    supabaseConfigured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    environment: process.env.NODE_ENV || "development",
  };
}

// Get environment variable validation status
export async function validateEnvironmentConfig() {
  await checkAdminAccess();

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
  ];

  const optionalVars = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_BYPASS_TOKEN",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  const optional = optionalVars.filter((varName) => !process.env[varName]);

  return {
    valid: missing.length === 0,
    missing,
    optional,
    total: requiredVars.length + optionalVars.length,
    configured:
      requiredVars.length +
      optionalVars.length -
      missing.length -
      optional.length,
  };
}
