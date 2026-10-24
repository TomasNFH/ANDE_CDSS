import React, { createContext, useContext, useState, useEffect } from 'react';

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  direction: 'ltr' | 'rtl';
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

interface RTLProviderProps {
  children: React.ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(false);

  const toggleRTL = () => {
    setIsRTL(!isRTL);
  };

  const direction = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.style.direction = direction;
  }, [direction]);

  return (
    <RTLContext.Provider value={{ isRTL, toggleRTL, direction }} data-id="ihg58oa6p" data-path="src/contexts/RTLContext.tsx">
      <div dir={direction} className={isRTL ? 'rtl' : 'ltr'} data-id="ak4yjyepa" data-path="src/contexts/RTLContext.tsx">
        {children}
      </div>
    </RTLContext.Provider>);

};