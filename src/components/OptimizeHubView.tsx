import React, { useState } from 'react';
import type { HardwareTelemetry } from '../hooks/useDeviceTelemetry';
import {
  OPTIMIZATION_PROFILES,
  type OptimizationProfileMode,
  type PlatformTarget,
  classifyDeviceTier,
  computeBoostReadiness,
} from '../lib/optimizer';
import { triggerHaptic, triggerSliderDetent } from '../lib/haptics';
import { FpsLabView } from './FpsLabView';
import { LowEndBoostView } from './LowEndBoostView';

interface OptimizeHubViewProps {
  telemetry: HardwareTelemetry;
  platform: PlatformTarget;
  targetFps: 60 | 90 | 120 | 144;
  lowEndBoostActive: boolean;
  checkedIds: string[];
  smoothGraphics: boolean;
  resolutionScale: number;
  profileMode: OptimizationProfileMode;
  onSelectFps: (fps: 60 | 90 | 120 | 144) => void;
  onProbeHz: () => void;
  onToggleLowEndBoost: () => void;
  onApplyOneTapBoost: () => void;
  onToggleChecklistItem: (id: string) => void;
  onToggleSmoothGraphics: () => void;
  onPlatformChange: (p: PlatformTarget) => void;
  onApplyProfileMode: (mode: OptimizationProfileMode) => void;
  onResolutionScaleChange: (scale: number) => void;
}

interface StatRingProps {
  label: string;
  valueText: string;
  subLabel: string;
  pct: number;
  accentColor: string;
}

const StatRing: React.FC<StatRingProps> = ({
  label,
  valueText,
  subLabel,
  pct,
  accentColor,
}) => {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4 flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            stroke="#1A1A22"
            strokeWidth="7"
          />
          <circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            stroke={accentColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-extrabold font-mono-num text-white">
          {valueText}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[#9A9AA6]">{label}</div>
        <div className="mt-1 text-sm font-bold text-white truncate">{subLabel}</div>
      </div>
    </div>
  );
};

export const OptimizeHubView: React.FC<OptimizeHubViewProps> = ({
  telemetry,
  platform,
  targetFps,
  lowEndBoostActive,
  checkedIds,
  smoothGraphics,
  resolutionScale,
  profileMode,
  onSelectFps,
  onProbeHz,
  onToggleLowEndBoost,
  onApplyOneTapBoost,
  onToggleChecklistItem,
  onToggleSmoothGraphics,
  onPlatformChange,
  onApplyProfileMode,
  onResolutionScaleChange,
}) => {
  const [subTab, setSubTab] = useState<'boost' | 'fps'>('boost');

  const tier = classifyDeviceTier({
    ramGb: telemetry.ramGb,
    cores: telemetry.cores,
    refreshHz: telemetry.measuredHz,
    forcedLowEnd: lowEndBoostActive,
  });

  const readiness = computeBoostReadiness({
    tier,
    checkedIds,
    platform,
    smoothGraphics,
    lowEndBoostActive,
  });

  const ramPct = Math.min(100, Math.round((telemetry.ramGb / 8) * 100));
  const hzPct = Math.min(100, Math.round((telemetry.measuredHz / 144) * 100));
  const activeProfileSpec = OPTIMIZATION_PROFILES.find((p) => p.id === profileMode);

  return (
    <div className="space-y-6">
      {/* Hardware Utilization Rings + Sub-Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div
          role="group"
          aria-label="Optimization mode"
          className="inline-flex items-center p-1 rounded-xl bg-[#0B0B0F] border border-[#23232B] self-start"
        >
          <button
            type="button"
            data-testid="opt-subtab-boost"
            onClick={() => {
              triggerHaptic('tap');
              setSubTab('boost');
            }}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'boost'
                ? 'bg-[#EF4444] text-white'
                : 'text-[#9A9AA6] hover:text-white'
            }`}
          >
            System Boost &amp; Profiles
          </button>
          <button
            type="button"
            data-testid="opt-subtab-fps"
            onClick={() => {
              triggerHaptic('tap');
              setSubTab('fps');
            }}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'fps'
                ? 'bg-[#EF4444] text-white'
                : 'text-[#9A9AA6] hover:text-white'
            }`}
          >
            FPS &amp; Display Hz Lab
          </button>
        </div>

        <span className="text-xs font-mono-num text-[#9A9AA6]">
          Profile: <strong className="text-white">{activeProfileSpec?.label}</strong> · Render{' '}
          <strong className="text-[#EF4444]">{resolutionScale}%</strong> · Target{' '}
          <strong className="text-white">{targetFps} FPS</strong>
        </span>
      </div>

      {/* 3 Circular Hardware Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatRing
          label="RAM Tier Capacity"
          valueText={`${telemetry.ramGb}G`}
          subLabel={`${telemetry.cores} CPU Cores`}
          pct={ramPct}
          accentColor="#FFFFFF"
        />
        <StatRing
          label="Display Ceiling"
          valueText={`${telemetry.measuredHz}Hz`}
          subLabel={`${telemetry.avgFrameMs} ms Frame Avg`}
          pct={hzPct}
          accentColor="#EF4444"
        />
        <StatRing
          label="Boost Readiness"
          valueText={`${readiness.score}%`}
          subLabel={readiness.label}
          pct={readiness.score}
          accentColor="#22C55E"
        />
      </div>

      {/* Gaming Profiles & Resolution Render Scale */}
      <section
        aria-labelledby="gaming-profiles-heading"
        className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 id="gaming-profiles-heading" className="text-base font-bold text-white">
            Gaming Profiles &amp; Render Scale
          </h2>
          <span className="text-xs text-[#9A9AA6]">
            {activeProfileSpec?.summary}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {OPTIMIZATION_PROFILES.map((prof) => {
            const selected = prof.id === profileMode;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onApplyProfileMode(prof.id);
                }}
                className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#190B0E] border-[#EF4444] text-white'
                    : 'bg-[#060609] border-[#23232B] text-[#C4C4CF] hover:border-white/30'
                }`}
              >
                <div className="text-xs font-bold text-white">{prof.label}</div>
                <div className="text-[11px] font-mono-num text-[#9A9AA6] mt-0.5">
                  {prof.targetFps} FPS · {prof.resolutionScale}% Scale
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-[#23232B]">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <label htmlFor="opt-res-scale" className="text-xs font-semibold text-white">
              Recommended In-Game Render Resolution Scale
            </label>
            <span className="text-xs font-bold font-mono-num text-[#EF4444]">
              {resolutionScale}%
            </span>
          </div>
          <input
            id="opt-res-scale"
            type="range"
            min={60}
            max={100}
            step={5}
            value={resolutionScale}
            onChange={(e) => {
              triggerSliderDetent();
              onResolutionScaleChange(Number(e.target.value));
            }}
            style={{
              background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${Math.round(((resolutionScale - 60) / 40) * 100)}%, #1B1B22 ${Math.round(((resolutionScale - 60) / 40) * 100)}%, #1B1B22 100%)`,
            }}
            className="tactical-slider"
          />
        </div>
      </section>

      {subTab === 'boost' ? (
        <LowEndBoostView
          telemetry={telemetry}
          platform={platform}
          lowEndBoostActive={lowEndBoostActive}
          checkedIds={checkedIds}
          smoothGraphics={smoothGraphics}
          onToggleLowEndBoost={onToggleLowEndBoost}
          onApplyOneTapBoost={onApplyOneTapBoost}
          onToggleChecklistItem={onToggleChecklistItem}
          onToggleSmoothGraphics={onToggleSmoothGraphics}
          onPlatformChange={onPlatformChange}
        />
      ) : (
        <FpsLabView
          telemetry={telemetry}
          platform={platform}
          targetFps={targetFps}
          lowEndBoostActive={lowEndBoostActive}
          onSelectFps={onSelectFps}
          onProbeHz={onProbeHz}
        />
      )}
    </div>
  );
};
