import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initTheme } from './theme/theme';
import { App } from './App';
import { scheduleWasmPrefetch } from './lib/decode/prefetch';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Browsers without a native QR detector get the WASM fallback cached while idle, so the first read works offline.
scheduleWasmPrefetch();
