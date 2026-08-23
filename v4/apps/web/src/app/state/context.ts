import { createContext } from 'react';
import type { BootstrapPayload } from '@lorion/contracts';

export type AppStatus = 'loading' | 'ready' | 'error';

export type AppState = {
  status: AppStatus;
  data: BootstrapPayload | null;
  error: string | null;
  reload(): Promise<void>;
};

export const AppStateContext = createContext<AppState | null>(null);
