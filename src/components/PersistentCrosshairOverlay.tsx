import React from 'react';
import { X } from 'lucide-react';
import {
  type ReticleOverlayConfig,
  SCOPE_OVERLAY_PRESETS,
  type ScopeModeId,
  computeOverlayScopeSync,
} from '../lib/aimAssist';
import type { SensitivityConfig } from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';
import { ReticleGlyph } from './ReticleGlyph';

interface PersistentCrosshairOverlayProps {
  enabled: boolean;
  scopeMode: ScopeModeId;
  reticle: ReticleOverlayConfig;
  activeConfig: SensitivityConfig;
  onSelectScope: (scope: ScopeModeId) => void;
  onDisable: () => void;
}

export const PersistentCrosshairOverlay: React.FC<
  PersistentCrosshairOverlayProps
> = ({
  enabled,
  scopeMode,
  reticle,
  activeConfig,
  onSelectScope,
  onDisable,
}) => {
  if (!enabled) return null;

  const sync = computeOverlayScopeSync(scopeMode, activeConfig);

  return (
    <>
      {/* Screen-Center Persistent Non-Intrusive Crosshair Guide */}
      <div
        data-testid="persistent-crosshair-overlay"
        data-reticle-shape={reticle.shape}
        data-scope-mode={scopeMode}
        aria-hidden="true"
        className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center select-none"
      >
        <ReticleGlyph reticle={reticle} showBloomRing={false} size={112} />
      </div>

      {/* Compact Non-Intrusive Scope Switcher & Exit Control */}
      <div
        data-testid="overlay-quick-bar"
        role="region"
        aria-label="Aim overlay quick controls"
        className="fixed bottom-16 md:bottom-4 right-3 sm:right-5 z-40 max-w-[calc(100vw-24px)] rounded-xl bg-[#07070A]/94 border border-[#EF4444]/50 backdrop-blur-md p-1 sm:p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.65)] flex items-center gap-1"
      >
        <span
          className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono-num font-bold text-[#EF4444] whitespace-nowrap"
          title="Synced Sensitivity"
        >
          {sync.preset.magnification} · {sync.sensitivityValue}
        </span>

        {SCOPE_OVERLAY_PRESETS.map((scope) => {
          const active = scope.id === scopeMode;
          const compactMobileLabel =
            scope.id === 'hipfire-general'
              ? 'SMG'
              : scope.id === 'red-dot'
                ? 'Red'
                : scope.id === 'scope-2x'
                  ? '2x'
                  : scope.id === 'scope-4x'
                    ? '4x'
                    : 'AWM';
          return (
            <button
              key={scope.id}
              type="button"
              data-testid={`overlay-dock-scope-${scope.id}`}
              onClick={() => {
                triggerHaptic('selection');
                onSelectScope(scope.id);
              }}
              className={`min-h-[30px] px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#EF4444] text-white'
                  : 'text-[#C4C4CF] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{compactMobileLabel}</span>
              <span className="hidden sm:inline">{scope.shortLabel}</span>
            </button>
          );
        })}

        <div className="w-px h-5 bg-[#23232B] mx-0.5 shrink-0" />

        <button
          type="button"
          data-testid="overlay-dock-close"
          onClick={() => {
            triggerHaptic('tap');
            onDisable();
          }}
          aria-label="Turn off persistent crosshair overlay"
          className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded-lg bg-[#13131A] border border-[#2A2A34] text-white hover:border-[#EF4444] hover:text-[#EF4444] transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
};
