"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import type { User } from "@supabase/supabase-js";

interface AdminGuardProps {
  children: React.ReactNode;
}

interface AdminCheckResult {
  isAdmin: boolean;
  user: User | null;
  error: string | null;
  profileExists: boolean;
}

export function AdminGuardImproved({ children }: AdminGuardProps) {
  const router = useRouter();
  const [checkResult, setCheckResult] = useState<AdminCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async (): Promise<AdminCheckResult> => {
      try {
        const supabase = createClient();

        // First, get the authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          return {
            isAdmin: false,
            user: null,
            error: `Authentication error: ${userError.message}`,
            profileExists: false,
          };
        }

        if (!user) {
          return {
            isAdmin: false,
            user: null,
            error: "No authenticated user found",
            profileExists: false,
          };
        }

        // Check if profile exists and get role
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("user_id", user.id);

        if (profileError) {
          return {
            isAdmin: false,
            user,
            error: `Database error: ${profileError.message} (Code: ${profileError.code})`,
            profileExists: false,
          };
        }

        // Check if profile exists
        if (!profiles || profiles.length === 0) {
          // Try to create profile
          console.log("No profile found, attempting to create one...");
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              email: user.email || "",
              role: "user",
              subscription_status: "free",
              subscription_tier: "free",
            });

          if (createError) {
            return {
              isAdmin: false,
              user,
              error: `Failed to create profile: ${createError.message}`,
              profileExists: false,
            };
          }

          // Profile created with user role, so not admin
          return {
            isAdmin: false,
            user,
            error: "Profile created but user role assigned",
            profileExists: true,
          };
        }

        const profile = profiles[0];
        const isAdmin = profile.role === "admin";

        return {
          isAdmin,
          user,
          error: isAdmin ? null : "User does not have admin role",
          profileExists: true,
        };
      } catch (error) {
        console.error("Unexpected error in admin check:", error);
        return {
          isAdmin: false,
          user: null,
          error: `Unexpected error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          profileExists: false,
        };
      }
    };

    const performCheck = async () => {
      const result = await checkAdminAccess();
      setCheckResult(result);
      setIsLoading(false);

      // Handle redirects based on result
      if (!result.user) {
        console.log("Redirecting to login:", result.error);
        router.push("/auth/login");
      } else if (!result.isAdmin) {
        console.log("Redirecting to dashboard:", result.error);
        router.push("/dashboard");
      }
    };

    performCheck();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!checkResult || !checkResult.user || !checkResult.isAdmin) {
    // Show error state briefly before redirect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">Access denied</p>
          {checkResult?.error && (
            <p className="text-sm text-muted-foreground">{checkResult.error}</p>
          )}
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
