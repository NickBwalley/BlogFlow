// Utility functions for handling avatar URLs consistently across the app

/**
 * Get full avatar URL from relative path stored in database
 */
export function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;

  // If it's already a full URL, return as is (for backward compatibility)
  if (avatarPath.startsWith("http")) return avatarPath;

  // Construct the full URL from the relative path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/user-avatars/${avatarPath}`;
}

/**
 * Extract relative path from full avatar URL for database storage
 */
export function getAvatarPath(fullUrl: string | null): string | null {
  if (!fullUrl) return null;

  // If it's already a relative path, return as is
  if (!fullUrl.startsWith("http")) return fullUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return fullUrl;

  const prefix = `${supabaseUrl}/storage/v1/object/public/user-avatars/`;
  if (fullUrl.startsWith(prefix)) {
    return fullUrl.replace(prefix, "");
  }

  return fullUrl; // Fallback
}

/**
 * Generate user initials from name and/or email
 */
export function getUserInitials(
  email?: string,
  firstName?: string,
  lastName?: string
): string {
  // If we have both first and last name
  if (firstName && lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  // If we have first name with 2+ characters
  if (firstName && firstName.length >= 2) {
    return firstName.slice(0, 2).toUpperCase();
  }

  // If we have first name with 1 character, combine with email initial
  if (firstName && firstName.length === 1) {
    const emailInitial = email ? email.charAt(0).toUpperCase() : "U";
    return (firstName.charAt(0) + emailInitial).toUpperCase();
  }

  // Fall back to email username
  if (email) {
    const username = email.split("@")[0];
    if (username.length >= 2) {
      return username.slice(0, 2).toUpperCase();
    }
    return (username + "U").toUpperCase();
  }

  return "UU"; // Ultimate fallback
}

/**
 * Validate avatar file before upload
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Please select a valid image file (JPG, PNG, WebP, or GIF)",
    };
  }

  // Check file size (2MB limit)
  const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSizeInBytes) {
    const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileSizeInMB}MB) exceeds the 2MB limit. Please choose a smaller image.`,
    };
  }

  // Check for minimum file size (likely corrupted if too small)
  if (file.size < 1024) {
    // Less than 1KB
    return {
      valid: false,
      error:
        "File appears to be corrupted or too small. Please select a valid image.",
    };
  }

  // Check file name length
  if (file.name.length > 100) {
    return {
      valid: false,
      error: "File name is too long. Please rename the file and try again.",
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
