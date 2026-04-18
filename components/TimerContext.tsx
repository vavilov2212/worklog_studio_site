'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TimerContextType {
  isRunning: boolean;
  time: number;
  toggleTimer: () => void;
  formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(true);
  const [time, setTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsMounted(true);
      const randomMinutes = Math.floor(Math.random() * 60);
      const randomSeconds = Math.floor(Math.random() * 60);
      setTime(randomMinutes * 60 + randomSeconds);
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isMounted]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      // Reset logic or keep time? Based on Hero requirement, it resets on stop: setTime(0);
      // But for demo sync, maybe we just stop it and keep the value, or reset to 0.
      // The Hero code says setTime(0) when stopping.
      setTime(0);
    } else {
      setIsRunning(true);
    }
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{ isRunning, time, toggleTimer, formatTime }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
