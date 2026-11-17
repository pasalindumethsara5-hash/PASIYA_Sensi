import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  type BeforeInstallPromptEvent,
  type InstallEnvironment,
  detectInstallEnvironment,
} from '../lib/pwaInstall';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() =>
      typeof window !== 'undefined'
        ? (window.__pasiyaDeferredInstallPrompt ?? null)
        : null
    );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isNative = Capacitor.isNativePlatform();
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.navigator.userAgent.includes('wv');
    return isNative || isStandalone;
  });
  const [env, setEnv] = useState<InstallEnvironment>(() => {
    if (typeof window === 'undefined') {
      return {
        platform: 'desktop',
        browserKind: 'other',
        isStandalone: false,
        isInIframe: false,
      };
    }
    const isNative = Capacitor.isNativePlatform();
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true ||
      isNative ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      window.navigator.userAgent.includes('wv');
    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }
    return detectInstallEnvironment(
      window.navigator.userAgent,
      isStandalone,
      inIframe
    );
  });

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const syncEnvironment = () => {
      const isNative = Capacitor.isNativePlatform();
      const isStandalone =
        mq.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
          true ||
        isNative ||
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:' ||
        window.navigator.userAgent.includes('wv');
      let inIframe = false;
      try {
        inIframe = window.self !== window.top;
      } catch {
        inIframe = true;
      }
      setIsInstalled(isStandalone);
      setEnv(
        detectInstallEnvironment(
          window.navigator.userAgent,
          isStandalone,
          inIframe
        )
      );
    };

    syncEnvironment();
    if (window.__pasiyaDeferredInstallPrompt) {
      setDeferredPrompt(window.__pasiyaDeferredInstallPrompt);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pasiyaDeferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const onAppInstalled = () => {
      window.__pasiyaDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    mq.addEventListener('change', syncEnvironment);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
      mq.removeEventListener('change', syncEnvironment);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const promptObj = deferredPrompt ?? window.__pasiyaDeferredInstallPrompt;
    if (!promptObj) return false;
    try {
      await promptObj.prompt();
      const { outcome } = await promptObj.userChoice;
      window.__pasiyaDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!(deferredPrompt ?? (typeof window !== 'undefined' ? window.__pasiyaDeferredInstallPrompt : null)),
    isInstalled,
    isIOS: env.platform === 'ios',
    isAndroid: env.platform === 'android',
    env,
    install,
  };
}
