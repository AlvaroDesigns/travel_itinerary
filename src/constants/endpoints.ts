// External APIs & Geocoding Services
export const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
export const PHOTON_GEOCODE_URL = "https://photon.komoot.io/api/";

// Internal Application API Routes
export const API_ROUTES = {
  AUTH: {
    ME: "/api/auth/me",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
  },
  TRIPS: {
    BASE: "/api/trips",
    BY_ID: (id: string) => `/api/trips/${id}`,
    ACTIVITIES: (tripId: string) => `/api/trips/${tripId}/activities`,
    NOTIFICATION_SETTINGS: (tripId: string) => `/api/trips/${tripId}/notification-settings`,
  },
  CLIENTS: {
    BASE: "/api/clients",
    BY_ID: (id: string) => `/api/clients/${id}`,
  },
  OPPORTUNITIES: {
    BASE: "/api/opportunities",
    BY_ID: (id: string) => `/api/opportunities/${id}`,
  },
  ASSISTANT: "/api/assistant",
  PUBLIC: {
    BY_TOKEN: (token: string) => `/api/public/${token}`,
  },
  PAYMENTS: {
    STRIPE_CREATE_INTENT: "/api/payments/stripe/create-intent",
    REDSYS_CREATE_CHARGE: "/api/payments/redsys/create-charge",
  },
} as const;
