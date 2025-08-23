"use server";

import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";

import { getAvatarUrl } from "@/lib/utils/avatar-utils";

export interface ProfileData {
  id: string;
  user_id: string;
  first_name: string | null;
  email: string;
  avatar_url: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(
  userId: string
): Promise<ProfileData | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string;
    avatar_url?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/dashboard/account");
    return { success: true };
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();

  try {
    // Import validation function
    const { validateAvatarFile } = await import("@/lib/utils/avatar-utils");

    // Enhanced file validation with magic number checking
    const validation = await validateAvatarFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "File validation failed",
      };
    }

    // Generate secure file name with user ID folder structure
    const fileExt = validation.sanitizedName?.split(".").pop() || "jpg";
    const fileName = `avatar.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to user-avatars storage bucket
    const { error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // Allow overwriting existing avatar
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);

      // Handle specific upload errors
      if (uploadError.message?.includes("Payload too large")) {
        return {
          success: false,
          error: "File is too large. Please choose an image smaller than 2MB.",
        };
      }

      if (uploadError.message?.includes("Invalid file type")) {
        return {
          success: false,
          error:
            "Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.",
        };
      }

      if (uploadError.message?.includes("Bucket not found")) {
        return {
          success: false,
          error:
            "Upload service is temporarily unavailable. Please try again later.",
        };
      }

      // Generic upload error
      return {
        success: false,
        error: `Upload failed: ${uploadError.message || "Please try again."}`,
      };
    }

    // Store relative path in database instead of full URL
    const updateResult = await updateUserProfile(userId, {
      avatar_url: filePath, // Store just the relative path
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Return the full URL for immediate display
    const fullUrl = getAvatarUrl(filePath);
    return { success: true, url: fullUrl || undefined };
  } catch (error) {
    console.error("Error in uploadProfileImage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteProfileImage(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Try to delete the avatar file from storage
    const filePath = `${userId}/avatar.jpg`;
    const { error: _deleteError } = await supabase.storage // eslint-disable-line @typescript-eslint/no-unused-vars
      .from("user-avatars")
      .remove([filePath]);

    // Also try common extensions
    const extensions = ["png", "jpeg", "webp", "gif"];
    for (const ext of extensions) {
      await supabase.storage
        .from("user-avatars")
        .remove([`${userId}/avatar.${ext}`]);
    }

    // Update profile to remove avatar URL regardless of file deletion result
    const updateResult = await updateUserProfile(userId, {
      avatar_url: null,
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteProfileImage:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
