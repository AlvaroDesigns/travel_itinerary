'use client';

import * as React from 'react';
import { TravelProvider } from '@/context/TravelContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || '');
      if (
        msg.includes('Could not establish connection. Receiving end does not exist') ||
        msg.includes('message port closed before a response was received')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ThemeProvider>
      <TravelProvider>
        {children}
      </TravelProvider>
    </ThemeProvider>
  );
}
