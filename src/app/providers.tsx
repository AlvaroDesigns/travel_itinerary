'use client';

import * as React from 'react';
import { TravelProvider } from '@/context/TravelContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TravelProvider>
        {children}
      </TravelProvider>
    </ThemeProvider>
  );
}
