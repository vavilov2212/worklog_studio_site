'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchLatestRelease, FALLBACK_RELEASE, type ReleaseInfo } from '@/lib/release';

interface ReleaseContextType extends ReleaseInfo {
  isLoading: boolean;
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

export function ReleaseProvider({ children }: { children: React.ReactNode }) {
  const [release, setRelease] = useState<ReleaseInfo>(FALLBACK_RELEASE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      fetchLatestRelease().then((info) => {
        if (!cancelled) {
          setRelease(info);
          setIsLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ReleaseContext.Provider value={{ ...release, isLoading }}>
      {children}
    </ReleaseContext.Provider>
  );
}

export function useRelease() {
  const context = useContext(ReleaseContext);
  if (context === undefined) {
    throw new Error('useRelease must be used within a ReleaseProvider');
  }
  return context;
}
