"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // In a real app, you would check authentication status here
    // For demo purposes, we'll assume the user is authenticated
    // You could check for tokens, call an API, etc.

    const checkAuth = () => {
      // Mock authentication check
      // In a real app, this might check localStorage, cookies, or call an API
      const isLoggedIn = true; // Change this to test protection

      if (!isLoggedIn) {
        router.push("/auth/login");
        return;
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}
