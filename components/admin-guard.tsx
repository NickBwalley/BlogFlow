"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import type { User } from "@supabase/supabase-js";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUser(user);

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", {
            error: profileError,
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            userId: user.id,
            userEmail: user.email,
          });

          // If profile doesn't exist, create it with user role
          if (profileError.code === "PGRST116") {
            // No rows returned
            console.log("Profile not found, creating default profile...");
            const { error: createError } = await supabase
              .from("profiles")
              .insert({
                user_id: user.id,
                email: user.email || "",
                role: "user",
              });

            if (createError) {
              console.error("Error creating profile:", createError);
            }
          }

          router.push("/dashboard");
          return;
        }

        if (!profile || profile.role !== "admin") {
          console.warn(
            "User attempted to access admin area without admin role",
            {
              profile,
              userRole: profile?.role,
              userId: user.id,
              userEmail: user.email,
            }
          );
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin access:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
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

  if (!user || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
