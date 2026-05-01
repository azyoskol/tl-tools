import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
const TweaksContext = createContext();
export const TweaksProvider = ({ children }) => {
  const [tweaks, setTweaks] = useLocalStorage('metraly-tweaks', {
    accentColor: '#00E5FF',
    density: 'comfortable',
    showSparklines: true,
    sidebarCollapsed: false,
  });
  const setTweak = (key, value) => setTweaks((prev) => ({ ...prev, [key]: value }));
  return <TweaksContext.Provider value={{ tweaks, setTweak }}>{children}</TweaksContext.Provider>;
};
export const useTweaks = () => useContext(TweaksContext);