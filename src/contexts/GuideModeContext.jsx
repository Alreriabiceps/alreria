import React, { createContext, useContext, useState } from "react";

const GuideModeContext = createContext();

export const useGuideMode = () => useContext(GuideModeContext);

export const GuideModeProvider = ({ children }) => {
  const [guideMode, setGuideMode] = useState(true); // Default ON

  return (
    <GuideModeContext.Provider value={{ guideMode, setGuideMode }}>
      {children}
    </GuideModeContext.Provider>
  );
}; 