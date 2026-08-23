import { useContext } from 'react';
import { AppStateContext } from './context.js';

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState precisa estar dentro de AppStateProvider.');
  return value;
}
