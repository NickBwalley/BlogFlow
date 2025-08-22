"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUserProfile } from "@/lib/actions/admin";
import { createClient } from "@/lib/client";

interface DebugInfo {
  authUser: any;
  profile: any;
  error: string | null;
  timestamp: string;
}

export default function AdminDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientDebug, setClientDebug] = useState<any>(null);

  useEffect(() => {
    const runDebug = async () => {
      try {
        // Test server action
        const serverResult = await getCurrentUserProfile();

        // Test client-side access
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        const { data: clientProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        setDebugInfo({
          authUser: serverResult.user,
          profile: serverResult.profile,
          error: null,
          timestamp: new Date().toISOString(),
        });

        setClientDebug({
          user,
          userError,
          clientProfile,
          profileError: profileError
            ? {
                message: profileError.message,
                code: profileError.code,
                details: profileError.details,
              }
            : null,
        });
      } catch (error) {
        setDebugInfo({
          authUser: null,
          profile: null,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    runDebug();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Debug</h1>
        <p>Loading debug information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Debug Page</h1>
        <p className="text-muted-foreground">
          Debug information for admin access issues
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Server-side Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Server Action Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debugInfo?.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {debugInfo.error}
              </div>
            ) : (
              <>
                <div>
                  <strong>User ID:</strong> {debugInfo?.authUser?.id}
                </div>
                <div>
                  <strong>Email:</strong> {debugInfo?.authUser?.email}
                </div>
                <div>
                  <strong>Profile Role:</strong>
                  <Badge
                    variant={
                      debugInfo?.profile?.role === "admin"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-2"
                  >
                    {debugInfo?.profile?.role || "Not found"}
                  </Badge>
                </div>
                <div>
                  <strong>Profile Email:</strong> {debugInfo?.profile?.email}
                </div>
                <div>
                  <strong>Subscription Status:</strong>{" "}
                  {debugInfo?.profile?.subscription_status}
                </div>
                <div>
                  <strong>Created At:</strong> {debugInfo?.profile?.created_at}
                </div>
              </>
            )}
            <div className="text-xs text-muted-foreground">
              Timestamp: {debugInfo?.timestamp}
            </div>
          </CardContent>
        </Card>

        {/* Client-side Debug */}
        <Card>
          <CardHeader>
            <CardTitle>Client-side Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientDebug?.userError ? (
              <div className="text-red-600">
                <strong>Auth Error:</strong> {clientDebug.userError.message}
              </div>
            ) : (
              <>
                <div>
                  <strong>Client User ID:</strong> {clientDebug?.user?.id}
                </div>
                <div>
                  <strong>Client Email:</strong> {clientDebug?.user?.email}
                </div>
              </>
            )}

            {clientDebug?.profileError ? (
              <div className="text-red-600">
                <strong>Profile Error:</strong>{" "}
                {clientDebug.profileError.message}
                <br />
                <strong>Code:</strong> {clientDebug.profileError.code}
              </div>
            ) : (
              <>
                <div>
                  <strong>Client Profile Role:</strong>
                  <Badge
                    variant={
                      clientDebug?.clientProfile?.role === "admin"
                        ? "destructive"
                        : "secondary"
                    }
                    className="ml-2"
                  >
                    {clientDebug?.clientProfile?.role || "Not found"}
                  </Badge>
                </div>
                <div>
                  <strong>Client Profile Email:</strong>{" "}
                  {clientDebug?.clientProfile?.email}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Debug Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            <strong>Server Result:</strong>
            {JSON.stringify(debugInfo, null, 2)}

            <strong>Client Result:</strong>
            {JSON.stringify(clientDebug, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
