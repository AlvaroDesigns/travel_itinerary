import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { NOMINATIM_SEARCH_URL, PHOTON_GEOCODE_URL } from "@/constants";

// Cache entry definition
interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

// In-memory cache for idempotent GET queries
const cache = new Map<string, CacheEntry>();

/**
 * Default cache TTL (2 minutes)
 */
const DEFAULT_CACHE_TTL = 2 * 60 * 1000;

export interface RequestOptions extends AxiosRequestConfig {
  cacheTtl?: number; // Milliseconds to cache response (GET only)
  skipCache?: boolean;
}

/**
 * Normalized API Error
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status?: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Configured Axios Instance for the application
 */
export const apiClient: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor for centralized error extraction
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    let message = "Ha ocurrido un error inesperado al procesar la solicitud.";
    const status = error.response?.status;
    const code = error.code;
    const data = error.response?.data;

    if (error.response?.data) {
      message =
        error.response.data.error ||
        error.response.data.message ||
        (typeof error.response.data === "string"
          ? error.response.data
          : message);
    } else if (error.request) {
      message = "No se ha recibido respuesta del servidor. Comprueba tu conexión.";
    } else if (error.message) {
      message = error.message;
    }

    const apiError = new ApiError(message, status, code, data);
    return Promise.reject(apiError);
  }
);

/**
 * Cached GET helper
 */
export async function getCached<T = unknown>(
  url: string,
  options?: RequestOptions
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options?.params || {})}`;
  const now = Date.now();

  if (!options?.skipCache && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (entry.expiresAt > now) {
      return entry.data as T;
    }
    cache.delete(cacheKey);
  }

  const response = await apiClient.get<T>(url, options);
  const ttl = options?.cacheTtl ?? DEFAULT_CACHE_TTL;

  if (ttl > 0) {
    cache.set(cacheKey, {
      data: response.data,
      expiresAt: now + ttl,
    });
  }

  return response.data;
}

/**
 * Invalidate cache helper
 */
export function invalidateCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}

export interface AddressSuggestion {
  title: string;
  subtitle: string;
  full: string;
}

/**
 * Geocoding with Photon (Komoot / OpenStreetMap) using cached axios requests
 */
export async function searchPhotonAddresses(
  cleanQuery: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  try {
    const data = await getCached<{
      features?: Array<{
        properties?: {
          street?: string;
          housenumber?: string;
          name?: string;
          district?: string;
          city?: string;
          state?: string;
          country?: string;
        };
      }>;
    }>(PHOTON_GEOCODE_URL, {
      params: {
        q: cleanQuery,
        limit: 5,
        lang: "es",
      },
      signal,
      cacheTtl: 5 * 60 * 1000, // Cache searches for 5 minutes
    });

    if (!data?.features || data.features.length === 0) return [];

    return data.features.map((f) => {
      const p = f.properties || {};
      const streetName = p.street
        ? p.street + (p.housenumber ? ` ${p.housenumber}` : "")
        : p.name || "";
      const details = [p.district, p.city, p.state, p.country]
        .filter(Boolean)
        .join(", ");
      const full = [streetName || p.name, details].filter(Boolean).join(", ");
      return {
        title: streetName || p.name || full,
        subtitle: details,
        full: full || p.name || cleanQuery,
      };
    });
  } catch (err) {
    console.warn("Photon address search failed, falling back:", err);
    return [];
  }
}

/**
 * Geocoding fallback with Nominatim (OpenStreetMap) using cached axios requests
 */
export async function searchNominatimAddresses(
  cleanQuery: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  try {
    const data = await getCached<
      Array<{
        display_name?: string;
      }>
    >(NOMINATIM_SEARCH_URL, {
      params: {
        format: "json",
        q: cleanQuery,
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        "Accept-Language": "es",
      },
      signal,
      cacheTtl: 5 * 60 * 1000, // Cache searches for 5 minutes
    });

    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((item) => {
      const parts = (item.display_name || "").split(", ");
      const title = parts.slice(0, 2).join(", ");
      const subtitle = parts.slice(2).join(", ");
      return {
        title,
        subtitle,
        full: item.display_name || cleanQuery,
      };
    });
  } catch (err) {
    console.error("Nominatim address search failed:", err);
    return [];
  }
}
