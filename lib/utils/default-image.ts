// Default blog image as a data URI (a simple gradient placeholder)
export const DEFAULT_BLOG_IMAGE = `data:image/svg+xml;base64,${btoa(`
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <text x="50%" y="45%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="600">
    BlogFlow
  </text>
  <text x="50%" y="65%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" opacity="0.9">
    No Image Available
  </text>
</svg>
`)}`;

/**
 * Get the appropriate image URL for a blog post
 * Returns the provided image, or a default image if none is provided
 */
export function getBlogImageWithDefault(
  imageUrl?: string | null,
  imagePath?: string | null
): string {
  // If we have an image URL, use it
  if (imageUrl && imageUrl.trim()) {
    return imageUrl;
  }

  // If we have an image path, construct the Supabase URL
  if (imagePath && imagePath.trim()) {
    return `https://lzumixprwbtxjchwjelc.supabase.co/storage/v1/object/public/blog-images/${imagePath}`;
  }

  // Return default image if no image is provided
  return DEFAULT_BLOG_IMAGE;
}

/**
 * Check if a blog post has a custom image (not the default)
 */
export function hasCustomImage(
  imageUrl?: string | null,
  imagePath?: string | null
): boolean {
  return !!(imageUrl?.trim() || imagePath?.trim());
}
