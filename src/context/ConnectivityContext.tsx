import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ConnectivityType = 'high' | 'low' | 'zero';

interface ConnectivityContextType {
  connectivity: ConnectivityType;
  setConnectivity: (c: ConnectivityType) => void;
  isOffline: boolean;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export const ConnectivityProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [connectivity, setConnectivityState] = useState<ConnectivityType>(() => {
    // Attempt to load initial state or default to high
    return 'high';
  });

  const isOffline = connectivity === 'zero';

  const setConnectivity = (c: ConnectivityType) => {
    setConnectivityState(c);
  };

  return (
    <ConnectivityContext.Provider value={{ connectivity, setConnectivity, isOffline }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};
