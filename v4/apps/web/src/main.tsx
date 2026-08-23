import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App.js';
import { AppStateProvider } from './app/state/AppStateProvider.js';
import { ToastProvider } from './components/feedback/toasts/ToastProvider.js';
import './styles/index.css';
import './styles/features.css';
import './styles/motion.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root da aplicação não encontrado.');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
