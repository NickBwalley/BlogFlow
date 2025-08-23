"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/client";
import { getAvatarUrl } from "@/lib/utils/avatar-utils";
import type { User } from "@supabase/supabase-js";

interface ProfileData {
  avatar_url: string | null;
  first_name: string | null;
  email: string;
}

interface ProfileContextType {
  profile: ProfileData | null;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  updateProfileAvatar: (newAvatarPath: string | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
  user: User | null;
}

export function ProfileProvider({ children, user }: ProfileProviderProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, first_name, email")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const updateProfileAvatar = (newAvatarPath: string | null) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: newAvatarPath });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id, fetchProfile]);

  const contextValue: ProfileContextType = {
    profile,
    avatarUrl: getAvatarUrl(profile?.avatar_url || null),
    refreshProfile: fetchProfile,
    updateProfileAvatar,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
