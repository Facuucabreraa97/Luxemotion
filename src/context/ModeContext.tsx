import React, { createContext, useContext, useState, useEffect } from 'react';
import { S } from '../styles';

type Mode = 'velvet' | 'agency';

interface ModeContextType {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    panel: string;
  };
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>('velvet');

  const toggleMode = () => {
    setModeState(prev => prev === 'velvet' ? 'agency' : 'velvet');
  };

  const setMode = (m: Mode) => setModeState(m);

  const theme = mode === 'velvet'
    ? {
        primary: '#C6A649', // Gold
        secondary: '#EC4899', // Pink
        accent: '#9333EA', // Purple
        bg: 'bg-[#030303]',
        panel: S.panel
      }
    : {
        primary: '#3B82F6', // Blue
        secondary: '#64748B', // Slate
        accent: '#0F172A', // Navy
        bg: 'bg-white text-black',
        panel: 'bg-white border border-gray-200 shadow-xl text-black'
      };

  return (
    <ModeContext.Provider value={{ mode, toggleMode, setMode, theme }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error("useMode must be used within a ModeProvider");
  return context;
};
