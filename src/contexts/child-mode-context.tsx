import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth-context';

interface ChildModeCtx {
  childMode: boolean;
  toggle: () => void;
}

const Ctx = createContext<ChildModeCtx>({ childMode: false, toggle: () => {} });

export function ChildModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [childMode, setChildMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('childMode').then((val) => {
      if (val !== null) {
        setChildMode(val === 'true');
      } else {
        // Default: son gets child mode, dad gets adult mode
        setChildMode(profile?.role === 'son');
      }
      setReady(true);
    });
  }, [profile?.role]);

  const toggle = () =>
    setChildMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem('childMode', String(next));
      return next;
    });

  if (!ready) return null;
  return <Ctx.Provider value={{ childMode, toggle }}>{children}</Ctx.Provider>;
}

export const useChildMode = () => useContext(Ctx);
