import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type { AppVersionInfo } from '../lib/appUpdater';
import { CURRENT_APP_VERSION } from '../lib/appUpdater';
import { triggerHaptic } from '../lib/haptics';

interface AppUpdateModalProps {
  updateInfo: AppVersionInfo;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  updateInfo,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [readyToInstall, setReadyToInstall] = useState(false);

  const handleStartUpdate = () => {
    triggerHaptic('action');
    setDownloading(true);

    // Simulate smooth progress bar while initiating download
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setDownloadProgress(100);
        setReadyToInstall(true);

        // Trigger real APK download
        const a = document.createElement('a');
        a.href = './PASIYA-SENSI.apk';
        a.download = 'PASIYA-SENSI.apk';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        triggerHaptic('success');
      } else {
        setDownloadProgress(p);
      }
    }, 120);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App Update Available"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
    >
      <div className="w-full max-w-md my-auto rounded-2xl bg-[#0B0B0F] border border-[#EF4444]/60 shadow-[0_12px_48px_rgba(239,68,68,0.25)] overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-[#23232B] bg-[#140A0D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#EF4444] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Update Available</h3>
                <span className="text-[10px] font-mono-num font-bold text-[#EF4444] bg-[#EF4444]/20 px-2 py-0.5 rounded border border-[#EF4444]/40">
                  v{updateInfo.version}
                </span>
              </div>
              <p className="text-xs text-[#9A9AA6]">
                Current: v{CURRENT_APP_VERSION} → New: v{updateInfo.version}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#D4D4DD] leading-relaxed">
            A new version of <strong className="text-white">PASIYA Sensi</strong> has been released with performance improvements and new features:
          </p>

          {/* Changelog */}
          <div className="p-3.5 rounded-xl bg-[#060609] border border-[#23232B] space-y-2">
            <span className="text-[11px] font-mono text-[#EF4444] font-bold uppercase tracking-wider block">
              What&apos;s New in v{updateInfo.version}:
            </span>
            <ul className="space-y-1.5 text-xs text-[#C4C4CF]">
              {updateInfo.changelog.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#EF4444] mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress or Update Action */}
          {downloading ? (
            <div className="space-y-2 p-3 rounded-xl bg-[#07070A] border border-[#23232B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">
                  {readyToInstall
                    ? 'Download complete! Opening installer...'
                    : 'Downloading APK update...'}
                </span>
                <span className="font-mono text-[#EF4444] font-bold">
                  {downloadProgress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A1A24] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EF4444] to-[#22C55E] transition-all duration-150"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              {readyToInstall && (
                <div className="text-[11px] text-[#86EFAC] flex items-center gap-1.5 pt-1">
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Tap <strong>Open &gt; Update</strong> in your notification bar.</span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartUpdate}
              className="w-full py-3 px-4 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>⚡ 1-Tap Auto-Update Now</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#9A9AA6]">
            <span>Keep your custom sensitivities safe</span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-white underline cursor-pointer"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
