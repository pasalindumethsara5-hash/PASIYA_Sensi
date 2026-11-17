import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  PlusSquare,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { copyTextSafely } from '../lib/clipboard';
import { triggerHaptic } from '../lib/haptics';
import {
  buildExternalBrowserUrl,
  downloadIosWebClipProfile,
  getInstallGuidanceSummary,
} from '../lib/pwaInstall';
import { BrandLogo } from './BrandLogo';

export const PWAInstallButton: React.FC<{
  onFallbackAction?: () => void;
  fallbackLabel?: string;
}> = ({ onFallbackAction, fallbackLabel = 'Copy Config' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, env, install } =
    usePWAInstall();
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-open the install prompt sheet if the user launched out of an iframe/WebView via ?install=1
  useEffect(() => {
    if (typeof window === 'undefined' || isInstalled) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('install') === '1') {
      setShowInstallSheet(true);
    }
  }, [isInstalled]);

  // If already running as an installed Home Screen / standalone app, expose quick config action
  if (isInstalled) {
    return onFallbackAction ? (
      <button
        type="button"
        onClick={onFallbackAction}
        className="min-h-[40px] px-4 py-2 rounded-lg bg-[#EF4444] text-white text-xs font-semibold tracking-tight hover:bg-[#DC2626] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {fallbackLabel}
      </button>
    ) : null;
  }

  const handlePrimaryInstallClick = async () => {
    triggerHaptic('action');
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setShowInstallSheet(false);
        return;
      }
    }
    setShowInstallSheet(true);
  };

  const currentUrl =
    typeof window !== 'undefined' ? window.location.href : 'https://pasiya-sensi.ai.studio/';
  const externalBrowserUrl = buildExternalBrowserUrl(currentUrl, env.platform);
  const guidance = getInstallGuidanceSummary(env, isInstallable);

  const handleCopyInstallUrl = async () => {
    triggerHaptic('selection');
    const cleanUrl = (() => {
      try {
        const parsed = new URL(currentUrl);
        parsed.searchParams.delete('autostart');
        return parsed.toString();
      } catch {
        return currentUrl;
      }
    })();
    await copyTextSafely(cleanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const platformBadge = isIOS
    ? 'iPhone / iPad (iOS)'
    : isAndroid
      ? 'Android Phone'
      : 'Phone & Desktop App';

  return (
    <>
      <button
        type="button"
        data-testid="header-install-btn"
        onClick={() => void handlePrimaryInstallClick()}
        className="min-h-[40px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-[#EF4444] text-white text-xs font-semibold tracking-tight hover:bg-[#DC2626] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Install App</span>
      </button>

      {showInstallSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pasiya-install-sheet-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo size={34} />
                <div>
                  <h2
                    id="pasiya-install-sheet-title"
                    className="font-display text-lg font-bold text-white leading-tight"
                  >
                    Install PASIYA <span className="text-[#EF4444]">Sensi</span>
                  </h2>
                  <p className="text-xs font-mono text-[#9A9AA6] mt-0.5">
                    {platformBadge} · Standalone Home Screen App
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close install dialog"
                onClick={() => {
                  triggerHaptic('tap');
                  setShowInstallSheet(false);
                }}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-[#9A9AA6] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-[#D4D4DD] leading-relaxed">
              {guidance.headline}
            </p>

            {/* Direct Android APK Download Button (Works on all Android phones!) */}
            {(!isIOS || isAndroid) && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#0F1E15] border border-[#22C55E]/50 space-y-2">
                <a
                  href={`${import.meta.env.BASE_URL}PASIYA-SENSI.apk`}
                  download="PASIYA-SENSI.apk"
                  onClick={() => triggerHaptic('success')}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] text-black text-sm font-bold hover:bg-[#16A34A] hover:text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Download Android APK (Direct Install)</span>
                </a>
                <p className="text-[11px] text-[#86EFAC] text-center font-medium">
                  ✓ Verified Safe · Release Signed · Free Fire Floating Crosshair
                </p>
              </div>
            )}

            {/* Instant Native One-Tap Prompt (Android Chrome / Edge / Chromium) */}
            {isInstallable && (
              <button
                type="button"
                data-testid="confirm-native-install-btn"
                onClick={() => {
                  triggerHaptic('success');
                  void install().then((ok) => {
                    if (ok) setShowInstallSheet(false);
                  });
                }}
                className="mt-5 w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] text-white text-sm font-semibold hover:bg-[#DC2626] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Install App on This Device</span>
              </button>
            )}

            {/* Embedded iframe / WhatsApp WebView breakout CTA */}
            {!isInstallable && guidance.mode === 'open-external' && (
              <div className="mt-5 space-y-3">
                <a
                  href={externalBrowserUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic('action')}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] text-white text-sm font-semibold hover:bg-[#DC2626] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isIOS
                      ? 'Open in Safari to Install'
                      : 'Open in Chrome & Auto-Install'}
                  </span>
                </a>
                <div className="rounded-xl bg-[#111116] border border-[#23232B] p-3.5 text-xs text-[#B2B2BF] leading-relaxed">
                  {isIOS
                    ? 'Apple requires opening this link in Safari directly, then tapping Share → Add to Home Screen.'
                    : 'Android suppresses automatic app install inside embedded frames or in-app chats. Opening directly in Chrome triggers the native 1-tap Install popup.'}
                </div>
              </div>
            )}

            {/* iOS Safari & WebClip direct options */}
            {!isInstallable && isIOS && (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    downloadIosWebClipProfile();
                  }}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#EF4444] text-white text-sm font-semibold hover:bg-[#DC2626] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download iOS Profile (Direct Home Screen)</span>
                </button>

                <div className="text-[11px] text-center text-[#9A9AA6]">
                  — OR Use Safari 2-Step Quick Add —
                </div>

                <ol className="space-y-2.5 rounded-xl bg-[#111116] border border-[#23232B] p-4 text-sm text-[#D4D4DD]">
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444] text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap <Share className="w-4 h-4 text-white inline" aria-hidden="true" />
                      <strong className="text-white">Share</strong> in Safari toolbar.
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444] text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap{' '}
                      <PlusSquare className="w-4 h-4 text-white inline" aria-hidden="true" />
                      <strong className="text-white">Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Non-iOS Browser Menu / Desktop fallback */}
            {!isInstallable && !isIOS && guidance.mode !== 'open-external' && (
              <ol className="mt-4 space-y-2.5 rounded-xl bg-[#111116] border border-[#23232B] p-4 text-sm text-[#D4D4DD]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Open your browser menu (<strong className="text-white">⋮</strong>) or address-bar{' '}
                    <Smartphone className="w-3.5 h-3.5 inline text-white" aria-hidden="true" />{' '}
                    <strong className="text-white">Install</strong> icon.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/35 text-[#EF4444] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Select <strong className="text-white">Install app</strong> /{' '}
                    <strong className="text-white">Add to Home screen</strong> to install PASIYA SENSI offline.
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopyInstallUrl()}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#141419] border border-[#282832] px-3.5 text-xs font-semibold text-white hover:border-[#3A3A48] transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy App Link</span>
                  </>
                )}
              </button>

              {onFallbackAction && (
                <button
                  type="button"
                  onClick={() => {
                    onFallbackAction();
                    setShowInstallSheet(false);
                  }}
                  className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#141419] border border-[#282832] px-3.5 text-xs font-semibold text-[#D4D4DD] hover:text-white hover:border-[#3A3A48] transition-colors cursor-pointer"
                >
                  <span>{fallbackLabel}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#231B12] border border-[#F59E0B]/40 px-3 py-2 text-xs font-medium text-[#FBBF24]"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Offline Mode — Cached signed presets active</span>
    </div>
  );
};
