/**
 * Utility functions for handling blog images
 */

const SUPABASE_PROJECT_REF = "lzumixprwbtxjchwjelc";
const STORAGE_BASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public`;

/**
 * Generate the full public URL for a blog image stored in Supabase storage
 * @param imagePath - The path to the image in the blog-images bucket
 * @returns Full public URL to the image or null if no path provided
 */
export function getBlogImageUrl(
  imagePath: string | null | undefined
): string | null {
  if (!imagePath) return null;
  return `${STORAGE_BASE_URL}/blog-images/${imagePath}`;
}

/**
 * Generate a unique filename for uploaded images
 * @param originalName - Original filename
 * @param userId - User ID to include in the path
 * @returns Formatted filename with timestamp
 */
export function generateImageFilename(
  originalName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop() || "jpg";
  const baseName = originalName
    .split(".")
    .slice(0, -1)
    .join(".")
    .replace(/[^a-zA-Z0-9]/g, "-");
  return `${userId}/${timestamp}-${baseName}.${extension}`;
}
