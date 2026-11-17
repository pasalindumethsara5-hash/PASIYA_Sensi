import React, { useRef } from 'react';
import { ExternalLink, Play, Rocket, X } from 'lucide-react';
import {
  type GameEdition,
  buildGameLaunchSpec,
} from '../lib/gameLauncher';
import type { PlatformTarget, SensitivityConfig } from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface GameLauncherCardProps {
  edition: GameEdition;
  onEditionChange: (edition: GameEdition) => void;
  autoLaunchOnApply: boolean;
  onToggleAutoLaunch: () => void;
  platform: PlatformTarget;
  activeConfig: SensitivityConfig;
  targetFps: number;
  onLaunchTriggered: () => void;
}

export const GameLauncherCard: React.FC<GameLauncherCardProps> = ({
  edition,
  onEditionChange,
  autoLaunchOnApply,
  onToggleAutoLaunch,
  platform,
  activeConfig,
  targetFps,
  onLaunchTriggered,
}) => {
  const launchSpec = buildGameLaunchSpec(
    edition,
    platform,
    activeConfig,
    targetFps
  );

  return (
    <section
      aria-labelledby="game-launcher-heading"
      className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4 sm:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#160A0D] border border-[#EF4444]/50 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="game-launcher-heading"
                className="text-base font-bold text-white"
              >
                Free Fire Auto-Launch Bridge
              </h2>
              <span className="text-[11px] font-mono-num text-[#EF4444]">
                {launchSpec.packageId}
              </span>
            </div>
            <p className="text-xs text-[#9A9AA6] mt-0.5">
              Copies active sensitivity loadout &amp; launches straight into {launchSpec.label}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SlidingSegmentedControl<GameEdition>
            ariaLabel="Free Fire edition selector"
            variant="white"
            value={edition}
            onChange={onEditionChange}
            options={[
              {
                id: 'freefire',
                label: 'Free Fire',
                testId: 'edition-freefire',
              },
              {
                id: 'freefire-max',
                label: 'FF MAX',
                testId: 'edition-freefire-max',
              },
            ]}
          />

          <button
            type="button"
            role="switch"
            aria-checked={autoLaunchOnApply}
            data-testid="toggle-auto-launch"
            onClick={() => {
              triggerHaptic('selection');
              onToggleAutoLaunch();
            }}
            className={`ios-spring-btn min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              autoLaunchOnApply
                ? 'bg-[#190B0E] border-[#EF4444] text-white'
                : 'bg-[#060609] border-[#2A2A34] text-[#9A9AA6] hover:text-white'
            }`}
          >
            Auto-Launch on Apply: {autoLaunchOnApply ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            data-testid="launch-game-now-btn"
            onClick={() => {
              triggerHaptic('action');
              onLaunchTriggered();
            }}
            className="ff-btn-sheen ios-spring-btn min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            Copy &amp; Auto-Launch
          </button>
        </div>
      </div>
    </section>
  );
};

interface AutoLaunchOverlayBannerProps {
  visible: boolean;
  countdownSec: number;
  launchStatus: 'counting' | 'launched';
  edition: GameEdition;
  platform: PlatformTarget;
  activeConfig: SensitivityConfig;
  targetFps: number;
  onCancel: () => void;
  onLaunchImmediately: () => void;
}

export const AutoLaunchBanner: React.FC<AutoLaunchOverlayBannerProps> = ({
  visible,
  countdownSec,
  launchStatus,
  edition,
  platform,
  activeConfig,
  targetFps,
  onCancel,
  onLaunchImmediately,
}) => {
  const hiddenAnchorRef = useRef<HTMLAnchorElement | null>(null);

  if (!visible) return null;

  const spec = buildGameLaunchSpec(edition, platform, activeConfig, targetFps);

  return (
    <div
      role="status"
      data-testid="auto-launch-banner"
      className="fixed bottom-16 md:bottom-5 right-4 left-4 md:left-auto md:w-[440px] z-50 ios-panel-glide rounded-2xl bg-[#0B0B0F]/98 border border-[#EF4444]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.75)] backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EF4444] flex items-center justify-center shrink-0">
            <Rocket className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">
              {launchStatus === 'launched'
                ? `Launching ${spec.label}...`
                : `Auto-Launching ${spec.label} in ${countdownSec}s`}
            </div>
            <p className="mt-0.5 text-[11px] text-[#C4C4CF] truncate">
              {activeConfig.name} · {targetFps} FPS loadout copied to clipboard
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Cancel game auto-launch"
          onClick={() => {
            triggerHaptic('impact');
            onCancel();
          }}
          className="min-w-[34px] min-h-[34px] rounded-lg text-[#9A9AA6] hover:text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          ref={hiddenAnchorRef}
          href={spec.deepLinkUrl}
          data-testid="direct-deeplink-anchor"
          onClick={() => {
            triggerHaptic('success');
            onLaunchImmediately();
          }}
          className="ios-spring-btn min-h-[38px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626]"
        >
          <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          Open {spec.label} Now
        </a>

        <a
          href={spec.storeFallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic('selection')}
          className="ios-spring-btn min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13131A] border border-[#2A2A34] text-xs font-semibold text-[#C4C4CF] hover:text-white"
        >
          {spec.storeLabel}
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
};
