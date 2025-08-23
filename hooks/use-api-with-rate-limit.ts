"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { handleApiError } from "@/lib/utils/rate-limit-toast";

interface ApiOptions extends RequestInit {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

/**
 * Custom hook for making API calls with automatic rate limit handling
 */
export function useApiWithRateLimit() {
  const apiCall = useCallback(
    async (url: string, options: ApiOptions = {}): Promise<Response> => {
      const {
        showErrorToast = true,
        showSuccessToast = false,
        successMessage,
        ...requestOptions
      } = options;

      try {
        const response = await fetch(url, requestOptions);

        // Handle rate limit errors
        if (response.status === 429) {
          if (showErrorToast) {
            await handleApiError(response);
          }
          throw new Error("Rate limit exceeded");
        }

        // Handle other HTTP errors
        if (!response.ok) {
          if (showErrorToast) {
            await handleApiError(response);
          }
          throw new Error(`HTTP ${response.status}`);
        }

        // Show success toast if requested
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        return response;
      } catch (error) {
        // Handle network errors
        if (error instanceof Error) {
          if (error.message === "Rate limit exceeded") {
            throw error; // Re-throw rate limit errors (already handled)
          }

          if (showErrorToast && error.message.includes("Failed to fetch")) {
            toast.error("Network Error", {
              description:
                "Failed to connect to the server. Please check your internet connection.",
              duration: 5000,
            });
          }
        }

        throw error;
      }
    },
    []
  );

  const get = useCallback(
    (url: string, options: Omit<ApiOptions, "method"> = {}) =>
      apiCall(url, { ...options, method: "GET" }),
    [apiCall]
  );

  const post = useCallback(
    (
      url: string,
      data?: any,
      options: Omit<ApiOptions, "method" | "body"> = {}
    ) =>
      apiCall(url, {
        ...options,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      }),
    [apiCall]
  );

  const put = useCallback(
    (
      url: string,
      data?: any,
      options: Omit<ApiOptions, "method" | "body"> = {}
    ) =>
      apiCall(url, {
        ...options,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      }),
    [apiCall]
  );

  const del = useCallback(
    (url: string, options: Omit<ApiOptions, "method"> = {}) =>
      apiCall(url, { ...options, method: "DELETE" }),
    [apiCall]
  );

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
  };
}
