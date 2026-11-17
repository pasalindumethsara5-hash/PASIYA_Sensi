import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import type { BeforeInstallPromptEvent } from './lib/pwaInstall';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.__pasiyaDeferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__pasiyaDeferredInstallPrompt = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    window.__pasiyaDeferredInstallPrompt = null;
  });

  if ('serviceWorker' in navigator) {
    registerSW({ immediate: true });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
