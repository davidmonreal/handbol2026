import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { DataRefreshProvider } from './context/DataRefreshContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>
    </LanguageProvider>
    <Analytics />
  </StrictMode>,
);
