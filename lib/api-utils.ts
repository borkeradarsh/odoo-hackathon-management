// Utility functions for API routes

/**
 * Returns headers that prevent caching to ensure fresh data
 */
export const getNoCacheHeaders = () => ({
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
});

/**
 * Create a JSON response with no-cache headers
 */
export const createNoCacheResponse = (data: unknown, init?: ResponseInit) => {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getNoCacheHeaders(),
      ...init?.headers,
    },
  });
};