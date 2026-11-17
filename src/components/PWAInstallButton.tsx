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

  const handlePrimaryInstallClick = () => {
    triggerHaptic('action');
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
        onClick={handlePrimaryInstallClick}
        className={`min-h-[40px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-tight active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
          isAndroid
            ? 'bg-[#22C55E] text-black hover:bg-[#16A34A] hover:text-white shadow-[0_0_15px_rgba(34,197,94,0.25)]'
            : 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-[0_0_15px_rgba(239,68,68,0.25)]'
        }`}
      >
        {isAndroid ? (
          <>
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Download APK</span>
          </>
        ) : isIOS ? (
          <>
            <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Install on iPhone</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Install App</span>
          </>
        )}
      </button>

      {showInstallSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pasiya-install-sheet-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md my-auto max-h-[90vh] flex flex-col rounded-2xl bg-[#0B0B0F] border border-[#23232B] shadow-2xl overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#23232B] bg-[#07070A] shrink-0">
              <div className="flex items-center gap-3">
                <BrandLogo size={32} />
                <div>
                  <h2
                    id="pasiya-install-sheet-title"
                    className="font-display text-base sm:text-lg font-bold text-white leading-tight"
                  >
                    Install PASIYA <span className="text-[#EF4444]">Sensi</span>
                  </h2>
                  <p className="text-[11px] font-mono text-[#9A9AA6]">
                    {platformBadge} · Direct Installation
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
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* ANDROID SECTION */}
              {(!isIOS || isAndroid) && (
                <div className="p-4 rounded-xl bg-[#0D1C12] border border-[#22C55E]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#22C55E]" />
                      Official Android Release APK (v2.0)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/15 px-2 py-0.5 rounded border border-[#22C55E]/30">
                      SIGNED RELEASE
                    </span>
                  </div>

                  <a
                    href="./PASIYA-SENSI.apk"
                    download="PASIYA-SENSI.apk"
                    onClick={() => triggerHaptic('success')}
                    className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] text-black text-sm font-bold hover:bg-[#16A34A] hover:text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Download Android APK (~4.3 MB)</span>
                  </a>

                  <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-[#A7F3D0] space-y-1">
                    <div>1. Click <strong>Download APK</strong> and wait for file to finish.</div>
                    <div>2. Tap <strong>Open</strong> in Chrome or your notification bar.</div>
                    <div>3. Tap <strong>Install</strong>. (If Play Protect asks, tap <em>More details &gt; Install anyway</em>).</div>
                    <div>4. Open app &amp; enjoy the Free Fire Native Crosshair!</div>
                  </div>
                </div>
              )}

              {/* IOS SECTION */}
              {isIOS && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#180C0E] border border-[#EF4444]/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Share className="w-4 h-4 text-[#EF4444]" />
                        Official Safari 2-Tap Install (Recommended)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded border border-[#EF4444]/30">
                        OFFICIAL APPLE
                      </span>
                    </div>

                    <p className="text-xs text-[#D4D4DD] leading-relaxed">
                      iPhone වල Web App එකක් Home Screen එකට දාගන්න ලේසිම සහ නිවැරදිම ක්‍රමය:
                    </p>

                    <ol className="space-y-2 text-xs text-[#E4E4E7]">
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#EF4444] text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                        <span>Safari toolbar එකේ <strong className="text-white">Share (📤)</strong> icon එක ඔබන්න.</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#EF4444] text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                        <span>පහලට scroll කරලා <strong className="text-white">&quot;Add to Home Screen&quot; (➕)</strong> ඔබන්න.</span>
                      </li>
                    </ol>

                    <p className="text-[11px] text-[#9A9AA6]">
                      ✓ Fullscreen App · Official Logo · Offline Support · No &quot;Not Signed&quot; warnings
                    </p>
                  </div>

                  {/* Alternative iOS Profile Download */}
                  <div className="p-3.5 rounded-xl bg-[#060609] border border-[#23232B] space-y-2">
                    <div className="text-[11px] text-[#9A9AA6]">
                      හෝ Direct Configuration Profile එකෙන් දාගන්න:
                    </div>
                    <a
                      href="./PASIYA-SENSI.mobileconfig"
                      download="PASIYA-SENSI.mobileconfig"
                      onClick={() => triggerHaptic('action')}
                      className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#160B0E] border border-[#EF4444]/50 text-white text-xs font-bold hover:bg-[#200D11] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>Download iOS Profile (With Red Emblem Logo)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Web PWA One-Tap Install Option (Android / Chrome Desktop) */}
              {isInstallable && (
                <div className="p-3 rounded-xl bg-[#060609] border border-[#23232B] space-y-2">
                  <div className="text-[11px] text-[#9A9AA6]">
                    Optional: Install via Chrome Web PWA:
                  </div>
                  <button
                    type="button"
                    data-testid="confirm-native-install-btn"
                    onClick={() => {
                      triggerHaptic('success');
                      void install().then((ok) => {
                        if (ok) setShowInstallSheet(false);
                      });
                    }}
                    className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Web Shortcut to Home Screen</span>
                  </button>
                </div>
              )}

              {/* Bottom copy link action */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyInstallUrl()}
                  className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#141419] border border-[#282832] px-3.5 text-xs font-semibold text-white hover:border-[#3A3A48] transition-colors cursor-pointer"
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
                    className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#141419] border border-[#282832] px-3.5 text-xs font-semibold text-[#D4D4DD] hover:text-white hover:border-[#3A3A48] transition-colors cursor-pointer"
                  >
                    <span>{fallbackLabel}</span>
                  </button>
                )}
              </div>
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
