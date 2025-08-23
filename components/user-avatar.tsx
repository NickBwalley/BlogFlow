"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/client";
import { getAvatarUrl, getUserInitials } from "@/lib/utils/avatar-utils";
import { useProfile } from "@/components/providers/profile-provider";
import type { User } from "@supabase/supabase-js";

interface UserAvatarProps {
  user: User;
  size?: "sm" | "md" | "lg";
  className?: string;
  showName?: boolean;
}

export function UserAvatar({
  user,
  size = "md",
  className = "",
  showName = false,
}: UserAvatarProps) {
  const [localProfileAvatarUrl, setLocalProfileAvatarUrl] = useState<
    string | null
  >(null);
  const [localFirstName, setLocalFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to use profile context first, fallback to local state
  let profileAvatarUrl = localProfileAvatarUrl;
  let firstName = localFirstName;

  try {
    const profileContext = useProfile();
    if (profileContext.profile) {
      profileAvatarUrl = profileContext.avatarUrl;
      firstName = profileContext.profile.first_name;
    }
  } catch (error) {
    // Not inside ProfileProvider, use local state
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("avatar_url, first_name")
          .eq("user_id", user.id)
          .single();

        if (!error && profile) {
          setLocalProfileAvatarUrl(getAvatarUrl(profile.avatar_url));
          setLocalFirstName(profile.first_name);
        }
      } catch (error) {
        // eslint-disable-line @typescript-eslint/no-unused-vars
        console.error("Error fetching user profile");
      } finally {
        setLoading(false);
      }
    };

    // Fetch profile if not available from context
    if (!profileAvatarUrl && !firstName) {
      fetchUserProfile(); // Context not available, fetch locally
    } else {
      setLoading(false); // Context available, no need to fetch
    }
  }, [user?.id, firstName, profileAvatarUrl]);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const displayName = firstName || user.email?.split("@")[0] || "User";
  const initials = getUserInitials(
    user.email || undefined,
    firstName || undefined
  );

  if (loading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full bg-muted animate-pulse`}
        />
        {showName && (
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={profileAvatarUrl || undefined} />
        <AvatarFallback className={textSizeClasses[size]}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className={`font-medium ${textSizeClasses[size]} truncate`}>
          {displayName}
        </span>
      )}
    </div>
  );
}
