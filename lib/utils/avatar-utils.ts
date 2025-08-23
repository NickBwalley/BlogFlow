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

// Magic number signatures for image files
const IMAGE_SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header, need to check WEBP at offset 8
  bmp: [0x42, 0x4d],
} as const;

/**
 * Validate file content by checking magic numbers
 */
async function validateFileContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve(false);
        return;
      }

      const bytes = new Uint8Array(arrayBuffer.slice(0, 12)); // Read first 12 bytes

      // Check JPEG
      if (
        bytes.length >= 3 &&
        bytes[0] === IMAGE_SIGNATURES.jpeg[0] &&
        bytes[1] === IMAGE_SIGNATURES.jpeg[1] &&
        bytes[2] === IMAGE_SIGNATURES.jpeg[2]
      ) {
        resolve(true);
        return;
      }

      // Check PNG
      if (
        bytes.length >= 4 &&
        bytes[0] === IMAGE_SIGNATURES.png[0] &&
        bytes[1] === IMAGE_SIGNATURES.png[1] &&
        bytes[2] === IMAGE_SIGNATURES.png[2] &&
        bytes[3] === IMAGE_SIGNATURES.png[3]
      ) {
        resolve(true);
        return;
      }

      // Check GIF
      if (
        bytes.length >= 3 &&
        bytes[0] === IMAGE_SIGNATURES.gif[0] &&
        bytes[1] === IMAGE_SIGNATURES.gif[1] &&
        bytes[2] === IMAGE_SIGNATURES.gif[2]
      ) {
        resolve(true);
        return;
      }

      // Check WebP (RIFF header + WEBP signature at offset 8)
      if (
        bytes.length >= 12 &&
        bytes[0] === IMAGE_SIGNATURES.webp[0] &&
        bytes[1] === IMAGE_SIGNATURES.webp[1] &&
        bytes[2] === IMAGE_SIGNATURES.webp[2] &&
        bytes[3] === IMAGE_SIGNATURES.webp[3] &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        resolve(true);
        return;
      }

      // Check BMP
      if (
        bytes.length >= 2 &&
        bytes[0] === IMAGE_SIGNATURES.bmp[0] &&
        bytes[1] === IMAGE_SIGNATURES.bmp[1]
      ) {
        resolve(true);
        return;
      }

      resolve(false);
    };

    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

/**
 * Sanitize filename to prevent path traversal and injection attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, "");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // Prevent reserved Windows names
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  const nameWithoutExt = sanitized.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }

  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.split(".").pop();
    const nameLength = 100 - (ext ? ext.length + 1 : 0);
    sanitized = sanitized.substring(0, nameLength) + (ext ? `.${ext}` : "");
  }

  // Fallback if empty
  if (!sanitized) {
    sanitized = "file";
  }

  return sanitized;
}

/**
 * Validate avatar file before upload with enhanced security
 */
export async function validateAvatarFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}> {
  // Check file type (MIME type check)
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

  // Validate file content using magic numbers
  const isValidContent = await validateFileContent(file);
  if (!isValidContent) {
    return {
      valid: false,
      error:
        "File content does not match a valid image format. The file may be corrupted or not a real image.",
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);

  return {
    valid: true,
    sanitizedName,
  };
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
