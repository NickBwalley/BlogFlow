"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff, Shield, Crown, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import {
  getUserProfile,
  updateUserProfile,
  type ProfileData,
} from "@/lib/actions/profile";
import {
  getAvatarUrl,
  getAvatarPath,
  getUserInitials,
} from "@/lib/utils/avatar-utils";
import { useProfile } from "@/components/providers/profile-provider";
import {
  getUserSubscription,
  getSubscriptionUsage,
} from "@/lib/subscription/actions";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { SubscriptionUpgrade } from "@/components/subscription/subscription-upgrade";
import type { User } from "@supabase/supabase-js";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [subscription, setSubscription] = useState<{
    plan_type: string;
    status: string;
    current_period_end?: string;
  } | null>(null);
  const [subscriptionUsage, setSubscriptionUsage] = useState<{
    plan: string;
    aiPostsUsed: number;
    aiPostsLimit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");

  // Password change
  // const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Load profile data
        const profileData = await getUserProfile(user.id);
        if (profileData) {
          setProfile(profileData);
          setFirstName(profileData.first_name || "");
        }

        // Load subscription data
        const subscriptionData = await getUserSubscription(user.id);
        setSubscription(subscriptionData);

        // Load subscription usage
        const usageData = await getSubscriptionUsage(user.id);
        setSubscriptionUsage(usageData);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Failed to load account data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const result = await updateUserProfile(user.id, {
        first_name: firstName,
      });

      if (result.success) {
        toast.success("Profile updated successfully!");
        // Update local state
        setProfile((prev) =>
          prev ? { ...prev, first_name: firstName } : null
        );
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        // setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    }
  };

  // const handleDeleteAccount = () => {
  //   if (
  //     confirm(
  //       "Are you sure you want to delete your account? This action cannot be undone."
  //     )
  //   ) {
  //     // In a real app, this would delete the account
  //     console.log("Account deletion requested");
  //     toast.info("Account deletion feature coming soon");
  //   }
  // };

  const profileContext = useProfile();

  const handleAvatarUpdate = (newUrl: string | null) => {
    if (profile) {
      // Convert full URL to relative path for storage
      const relativePath = getAvatarPath(newUrl);
      setProfile({ ...profile, avatar_url: relativePath });

      // Also update the global profile context
      profileContext.updateProfileAvatar(relativePath);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "free":
        return <Zap className="h-5 w-5 text-blue-500" />;
      case "starter":
        return <Check className="h-5 w-5 text-green-500" />;
      case "pro":
        return <Crown className="h-5 w-5 text-purple-500" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanBadgeVariant = (planType: string) => {
    switch (planType) {
      case "free":
        return "secondary";
      case "starter":
        return "default";
      case "pro":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8 max-w-4xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Loading your account information...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-6 space-y-8 max-w-4xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Failed to load account information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {getPlanIcon(subscriptionUsage?.plan || "free")}
            <CardTitle>Current Subscription</CardTitle>
          </div>
          <CardDescription>
            Your current plan and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center gap-3">
              {getPlanIcon(subscriptionUsage?.plan || "free")}
              <div>
                <h3 className="font-semibold text-lg capitalize">
                  {subscriptionUsage?.plan || "free"} Plan
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscriptionUsage?.plan === "free"
                    ? "Basic features with limited AI generation"
                    : subscriptionUsage?.plan === "starter"
                    ? "Enhanced features for growing bloggers"
                    : "All premium features unlocked"}
                </p>
              </div>
            </div>
            <Badge
              variant={getPlanBadgeVariant(subscriptionUsage?.plan || "free")}
            >
              {subscription?.status === "active" ? "Active" : "Free"}
            </Badge>
          </div>

          {subscriptionUsage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {subscriptionUsage.aiPostsUsed}
                </div>
                <div className="text-sm text-muted-foreground">
                  AI Posts Used
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {subscriptionUsage.aiPostsLimit}
                </div>
                <div className="text-sm text-muted-foreground">
                  AI Posts Limit
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {subscriptionUsage.aiPostsLimit -
                    subscriptionUsage.aiPostsUsed}
                </div>
                <div className="text-sm text-muted-foreground">
                  Remaining Posts
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <ProfilePhotoUpload
            userId={user.id}
            currentAvatarUrl={getAvatarUrl(profile.avatar_url)}
            userInitials={getUserInitials(
              profile.email,
              profile.first_name || undefined
            )}
            onAvatarUpdate={handleAvatarUpdate}
          />

          <Separator />

          {/* Personal Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="flex-1 bg-muted"
                />
                <Badge variant="secondary" className="self-center">
                  Verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Upgrade */}
      <SubscriptionUpgrade
        currentTier={subscriptionUsage?.plan || "free"}
        hasActiveSubscription={subscription?.status === "active"}
      />

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your account security and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePasswordChange}
                disabled={!newPassword || !confirmPassword}
              >
                Update Password
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
