"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { addFirstAdmin, checkAdminStatus } from "@/lib/actions/admin";
import { useEffect } from "react";

export default function AdminSetupPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkAdminStatus();
        setAdminStatus(status);
        setEmail(status.user.email);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to check status"
        );
      } finally {
        setStatusLoading(false);
      }
    };

    checkStatus();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await addFirstAdmin(email);
      setMessage(result.message || "Admin added successfully!");

      // Refresh admin status
      const status = await checkAdminStatus();
      setAdminStatus(status);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add admin");
    } finally {
      setIsLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Setup</h1>
          <p className="text-muted-foreground">Loading admin status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Setup</h1>
        <p className="text-muted-foreground">
          Set up admin access for your account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Admin Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Email:</strong> {adminStatus?.user?.email}
            </div>
            <div>
              <strong>Admin by Email:</strong>{" "}
              <Badge
                variant={adminStatus?.isAdminByEmail ? "default" : "secondary"}
              >
                {adminStatus?.isAdminByEmail ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <strong>Admin by Role:</strong>{" "}
              <Badge
                variant={adminStatus?.isAdminByRole ? "default" : "secondary"}
              >
                {adminStatus?.isAdminByRole ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <strong>Can Access Admin:</strong>{" "}
              <Badge
                variant={
                  adminStatus?.canAccessAdmin ? "default" : "destructive"
                }
              >
                {adminStatus?.canAccessAdmin ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Add Admin */}
        <Card>
          <CardHeader>
            <CardTitle>Add Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            {adminStatus?.canAccessAdmin ? (
              <div className="text-center py-4">
                <Badge variant="default" className="text-base px-4 py-2">
                  ✓ You already have admin access!
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  You can now access all admin features.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This must match your logged-in email
                  </p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Adding Admin..." : "Add Yourself as Admin"}
                </Button>
              </form>
            )}

            {message && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Admin Access Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            <strong>Email-based Admin:</strong> Your email is added to the
            admin_users table, giving you full access through RLS policies.
          </p>
          <p className="text-sm">
            <strong>Role-based Admin:</strong> Your profile role is set to
            'admin' in the profiles table.
          </p>
          <p className="text-sm">
            <strong>Both methods work:</strong> You only need one of them to
            access admin features. The email-based method is more secure and
            doesn't cause recursion issues.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Next steps:</strong> Once you have admin access, try
              visiting the other admin pages: Users, Blogs, and Subscriptions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
