// API configuration and environment variable validation
if (!process.env.NEXT_PUBLIC_NWS_USER_AGENT) {
  throw new Error('NEXT_PUBLIC_NWS_USER_AGENT environment variable is not set');
}

if (!process.env.NEXT_PUBLIC_NWS_API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_NWS_API_BASE_URL environment variable is not set');
}

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_NWS_API_BASE_URL,
  headers: {
    'User-Agent': process.env.NEXT_PUBLIC_NWS_USER_AGENT,
    'Accept': 'application/geo+json',
  },
} as const;

// Helper function to create API request headers
export const getApiHeaders = () => ({
  ...API_CONFIG.headers,
}); 