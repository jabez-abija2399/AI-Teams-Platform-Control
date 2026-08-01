'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CreatorExperienceService, CreatorProgressState } from '../services/creator-experience.service';

interface FriendlyStatusContextType {
  isDeveloperMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  toggleDeveloperMode: () => void;
  getFriendlyState: (rawStatus: string, rawProgress: number, rawLogs?: Array<{ message: string }>) => CreatorProgressState;
}

const FriendlyStatusContext = createContext<FriendlyStatusContextType | undefined>(undefined);

export function FriendlyStatusProvider({ children }: { children: React.ReactNode }) {
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_teams_dev_mode');
      if (saved !== null) {
        setIsDeveloperMode(saved === 'true');
      }
    } catch {}
  }, []);

  const setDeveloperMode = (enabled: boolean) => {
    setIsDeveloperMode(enabled);
    try {
      localStorage.setItem('ai_teams_dev_mode', String(enabled));
    } catch {}
  };

  const toggleDeveloperMode = () => {
    setDeveloperMode(!isDeveloperMode);
  };

  const getFriendlyState = (
    rawStatus: string,
    rawProgress: number,
    rawLogs: Array<{ message: string }> = []
  ): CreatorProgressState => {
    return CreatorExperienceService.calculateProgressState(rawStatus, rawProgress, rawLogs);
  };

  return (
    <FriendlyStatusContext.Provider
      value={{
        isDeveloperMode,
        setDeveloperMode,
        toggleDeveloperMode,
        getFriendlyState,
      }}
    >
      {children}
    </FriendlyStatusContext.Provider>
  );
}

export function useCreatorExperience() {
  const context = useContext(FriendlyStatusContext);
  if (!context) {
    throw new Error('useCreatorExperience must be used within a FriendlyStatusProvider');
  }
  return context;
}
