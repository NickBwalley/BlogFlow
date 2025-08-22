import { toast } from "sonner";

interface RateLimitError {
  error: string;
  message: string;
  retryAfter?: number;
}

/**
 * Shows a toast notification for rate limit errors
 */
export function showRateLimitToast(error: RateLimitError) {
  const retryTime = error.retryAfter
    ? formatRetryTime(error.retryAfter)
    : "a moment";

  toast.error("Rate Limit Exceeded", {
    description: `You've made too many requests. Please wait ${retryTime} before trying again.`,
    duration: Math.min((error.retryAfter || 60) * 1000, 10000), // Show for retry time or max 10 seconds
    action: {
      label: "Dismiss",
      onClick: () => {},
    },
  });
}

/**
 * Handles API response errors and shows toast for rate limits
 */
export async function handleApiError(response: Response): Promise<void> {
  if (response.status === 429) {
    try {
      const errorData: RateLimitError = await response.json();
      showRateLimitToast(errorData);
    } catch {
      // Fallback if response is not JSON
      toast.error("Rate Limit Exceeded", {
        description:
          "You've made too many requests. Please wait a moment before trying again.",
        duration: 5000,
      });
    }
  } else if (!response.ok) {
    // Handle other errors
    try {
      const errorData = await response.json();
      toast.error("Request Failed", {
        description:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        duration: 5000,
      });
    } catch {
      toast.error("Request Failed", {
        description: `HTTP ${response.status}: ${response.statusText}`,
        duration: 5000,
      });
    }
  }
}

/**
 * Wrapper for fetch that automatically handles rate limit errors
 */
export async function fetchWithRateLimitToast(
  url: string | URL | Request,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429) {
    await handleApiError(response);
  }

  return response;
}

/**
 * Formats retry time in a human-readable way
 */
function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

/**
 * Custom hook for making API calls with rate limit handling
 */
export function useApiWithRateLimit() {
  const apiCall = async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        await handleApiError(response);
        throw new Error("Rate limit exceeded");
      }

      if (!response.ok) {
        await handleApiError(response);
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message !== "Rate limit exceeded") {
        toast.error("Network Error", {
          description:
            "Failed to connect to the server. Please check your internet connection.",
          duration: 5000,
        });
      }
      throw error;
    }
  };

  return { apiCall };
}
