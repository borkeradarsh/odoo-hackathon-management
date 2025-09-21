'use client';

import { SWRConfig } from 'swr';

// Global SWR configuration
const globalSWRConfig = {
  revalidateOnFocus: true,       // Refresh when tab becomes active  
  revalidateOnReconnect: true,   // Refresh on network reconnect
  refreshInterval: 0,            // No automatic polling by default
  dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  errorRetryCount: 3,            // Retry failed requests 3 times
  errorRetryInterval: 1000,      // Wait 1 second between retries
  loadingTimeout: 3000,          // Show loading timeout after 3 seconds
  focusThrottleInterval: 5000,   // Throttle focus revalidation to 5 seconds
};

// Global fetcher with cache-busting
const globalFetcher = (url: string) => fetch(url, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }
}).then((res) => {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
});

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig 
      value={{
        ...globalSWRConfig,
        fetcher: globalFetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
}