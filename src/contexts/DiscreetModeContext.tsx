import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DiscreetModeContextType {
  isDiscreetMode: boolean;
  toggleDiscreetMode: () => void;
}

const DiscreetModeContext = createContext<DiscreetModeContextType | undefined>(undefined);

export const useDiscreetMode = () => {
  const context = useContext(DiscreetModeContext);
  if (!context) {
    throw new Error('useDiscreetMode must be used within a DiscreetModeProvider');
  }
  return context;
};

interface DiscreetModeProviderProps {
  children: ReactNode;
}

export const DiscreetModeProvider: React.FC<DiscreetModeProviderProps> = ({ children }) => {
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);

  const toggleDiscreetMode = () => {
    setIsDiscreetMode(prev => !prev);
  };

  return (
    <DiscreetModeContext.Provider value={{ isDiscreetMode, toggleDiscreetMode }}>
      {children}
    </DiscreetModeContext.Provider>
  );
};