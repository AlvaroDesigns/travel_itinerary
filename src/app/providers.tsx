'use client';

import * as React from 'react';
import { TravelProvider } from '@/context/TravelContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TravelProvider>
      {children}
    </TravelProvider>
  );
}
