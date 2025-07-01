/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { API_BASE_URL } from "./wagmiConfig";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface ApiClientOptions {
  endpoint: string;
  method?: HttpMethod;
  body?: any;
  token?: string | null;
  contentType?: string;
  useJsonBody?: boolean;
  showToastOnError?: boolean;
}

/**
 * Helper function for making authenticated API calls
 * Handles auth headers, error responses, and optional toast notifications
 */
export async function apiClient<T = any>({
  endpoint,
  method = "GET",
  body,
  token,
  contentType = "application/json",
  useJsonBody = true,
  showToastOnError = true,
}: ApiClientOptions): Promise<T> {
  try {
    // Prepare URL (handle both absolute and relative paths)
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${
          endpoint.startsWith("/") ? endpoint : `/${endpoint}`
        }`;

    // Prepare headers
    const headers: HeadersInit = {};

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Add body if needed
    if (body && method !== "GET") {
      options.body = useJsonBody ? JSON.stringify(body) : body;
    }

    // Make the request
    const response = await fetch(url, options);

    // Handle authentication errors
    if (response.status === 401) {
      if (showToastOnError) {
        toast.error("Your session has expired. Please login again.");
      }
      // You might want to trigger a logout here or redirect
      throw new Error("Unauthorized: Your session has expired");
    }

    // Parse response
    let data;
    const contentTypeHeader = response.headers.get("content-type");
    if (contentTypeHeader && contentTypeHeader.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check for error responses
    if (!response.ok) {
      const errorMessage =
        typeof data === "object" && data.message
          ? data.message
          : "An error occurred";

      if (showToastOnError) {
        toast.error(`API Error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error) {
    // Handle network errors and other unexpected issues
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Only show toast if it's not already an auth error (which shows its own toast)
    if (
      showToastOnError &&
      !errorMessage.includes("Unauthorized: Your session has expired")
    ) {
      toast.error(`Request failed: ${errorMessage}`);
    }

    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Helper function for making form data API calls with image uploads
 * Handles auth headers, error responses, and optional toast notifications
 */
export async function apiClientFormData<T = any>({
  endpoint,
  method = "POST",
  formData,
  token,
  showToastOnError = true,
}: {
  endpoint: string;
  method?: HttpMethod;
  formData: FormData;
  token?: string | null;
  showToastOnError?: boolean;
}): Promise<T> {
  try {
    // Prepare URL (handle both absolute and relative paths)
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${
          endpoint.startsWith("/") ? endpoint : `/${endpoint}`
        }`;

    // Prepare headers (don't set Content-Type for FormData - browser will set it with boundary)
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
      body: formData,
    };

    // Make the request
    const response = await fetch(url, options);

    // Handle authentication errors
    if (response.status === 401) {
      if (showToastOnError) {
        toast.error("Your session has expired. Please login again.");
      }
      throw new Error("Unauthorized: Your session has expired");
    }

    // Parse response
    let data;
    const contentTypeHeader = response.headers.get("content-type");
    if (contentTypeHeader && contentTypeHeader.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check for error responses
    if (!response.ok) {
      const errorMessage =
        typeof data === "object" && data.message
          ? data.message
          : "An error occurred";

      if (showToastOnError) {
        toast.error(`API Error: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error) {
    // Handle network errors and other unexpected issues
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Only show toast if it's not already an auth error (which shows its own toast)
    if (
      showToastOnError &&
      !errorMessage.includes("Unauthorized: Your session has expired")
    ) {
      toast.error(`Request failed: ${errorMessage}`);
    }

    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Shorthand for GET requests
 */
export function get<T = any>(
  endpoint: string,
  token?: string | null,
  options: Partial<ApiClientOptions> = {}
) {
  return apiClient<T>({
    endpoint,
    method: "GET",
    token,
    ...options,
  });
}

/**
 * Shorthand for POST requests
 */
export function post<T = any>(
  endpoint: string,
  body: any,
  token?: string | null,
  options: Partial<ApiClientOptions> = {}
) {
  return apiClient<T>({
    endpoint,
    method: "POST",
    body,
    token,
    ...options,
  });
}

/**
 * Shorthand for PUT requests
 */
export function put<T = any>(
  endpoint: string,
  body: any,
  token?: string | null,
  options: Partial<ApiClientOptions> = {}
) {
  return apiClient<T>({
    endpoint,
    method: "PUT",
    body,
    token,
    ...options,
  });
}

/**
 * Shorthand for DELETE requests
 */
export function del<T = any>(
  endpoint: string,
  body?: any,
  token?: string | null,
  options: Partial<ApiClientOptions> = {}
) {
  return apiClient<T>({
    endpoint,
    method: "DELETE",
    body,
    token,
    ...options,
  });
}

/**
 * Helper function to create FormData for DEX requests with images
 */
export function createDexFormData(
  data: Record<string, any>,
  images: {
    primaryLogo?: Blob | null;
    secondaryLogo?: Blob | null;
    favicon?: Blob | null;
    pnlPosters?: (Blob | null)[];
  } = {}
): FormData {
  const formData = new FormData();

  // Add regular fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Add image files
  if (images.primaryLogo) {
    formData.append("primaryLogo", images.primaryLogo, "primaryLogo.webp");
  }
  if (images.secondaryLogo) {
    formData.append(
      "secondaryLogo",
      images.secondaryLogo,
      "secondaryLogo.webp"
    );
  }
  if (images.favicon) {
    formData.append("favicon", images.favicon, "favicon.webp");
  }
  if (images.pnlPosters) {
    images.pnlPosters.forEach((poster, index) => {
      if (poster) {
        formData.append(`pnlPoster${index}`, poster, `pnlPoster${index}.webp`);
      }
    });
  }

  return formData;
}

/**
 * Shorthand for POST requests with form data (for image uploads)
 */
export function postFormData<T = any>(
  endpoint: string,
  formData: FormData,
  token?: string | null,
  options: { showToastOnError?: boolean } = {}
) {
  return apiClientFormData<T>({
    endpoint,
    method: "POST",
    formData,
    token,
    ...options,
  });
}

/**
 * Shorthand for PUT requests with form data (for image uploads)
 */
export function putFormData<T = any>(
  endpoint: string,
  formData: FormData,
  token?: string | null,
  options: { showToastOnError?: boolean } = {}
) {
  return apiClientFormData<T>({
    endpoint,
    method: "PUT",
    formData,
    token,
    ...options,
  });
}
