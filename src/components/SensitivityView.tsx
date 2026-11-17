import React, { useState } from 'react';
import {
  Check,
  Copy,
  Cpu,
  Download,
  Flame,
  RotateCcw,
  Save,
  Settings,
  Share,
  Sliders,
  Smartphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import {
  type AdaptiveSensiTier,
  type AdaptiveSensiTierId,
  type PlatformTarget,
  type PlayStyleTarget,
  type SensitivityCap,
  type SensitivityConfig,
  applyAdaptiveSensiTier,
  applyMaxSensitivityBoost,
  computeAdaptiveSensiRecommendations,
  computeAutoCalibratedConfig,
  computeDragPhysicsRatio,
  computeRecommendedDpi,
  convertConfigCap,
  formatFreeFireConfig,
} from '../lib/optimizer';
import { triggerHaptic, triggerSliderDetent } from '../lib/haptics';
import type { GameEdition } from '../lib/gameLauncher';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DragSimulator } from './DragSimulator';
import { GameLauncherCard } from './GameLauncherCard';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface SensitivityViewProps {
  presets: SensitivityConfig[];
  activeConfig: SensitivityConfig;
  activeSlot: number;
  platform: PlatformTarget;
  targetFps: number;
  measuredHz: number;
  gameEdition: GameEdition;
  autoLaunchOnApply: boolean;
  onEditionChange: (edition: GameEdition) => void;
  onToggleAutoLaunch: () => void;
  onLaunchGame: (configOverride?: SensitivityConfig) => void;
  onSelectSlot: (slotIndex: number) => void;
  onPlatformChange: (p: PlatformTarget) => void;
  onConfigChange: (next: SensitivityConfig) => void;
  onSaveCustom: (name: string) => Promise<void>;
  onCopyConfig: () => Promise<void>;
  copied: boolean;
}

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  displayValue?: string;
  onChange: (val: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  displayValue,
  onChange,
}) => {
  const pct = max > min ? Math.round(((value - min) / (max - min)) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-white">
          {label}
        </label>
        <span className="text-sm font-bold font-mono-num text-[#EF4444]">
          {displayValue ?? `${value}${unit}`}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          triggerSliderDetent();
          onChange(Number(e.target.value));
        }}
        style={{
          background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${pct}%, #1B1B22 ${pct}%, #1B1B22 100%)`,
        }}
        className="tactical-slider"
      />
    </div>
  );
};

export const SensitivityView: React.FC<SensitivityViewProps> = ({
  presets,
  activeConfig,
  activeSlot,
  platform,
  targetFps,
  measuredHz,
  gameEdition,
  autoLaunchOnApply,
  onEditionChange,
  onToggleAutoLaunch,
  onLaunchGame,
  onSelectSlot,
  onPlatformChange,
  onConfigChange,
  onSaveCustom,
  onCopyConfig,
  copied,
}) => {
  const { isInstalled } = usePWAInstall();
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [playStyle, setPlayStyle] = useState<PlayStyleTarget>('one-tap');
  const [adaptiveTierId, setAdaptiveTierId] =
    useState<AdaptiveSensiTierId>('balanced');

  const adaptiveTiers = computeAdaptiveSensiRecommendations({
    base: activeConfig,
    platform,
    targetFps,
  });
  const selectedAdaptiveTier =
    adaptiveTiers.find((t) => t.id === adaptiveTierId) ?? adaptiveTiers[1];

  const detectedWidth =
    typeof window !== 'undefined' ? window.screen.width || 390 : 390;
  const dpiSuggestion = computeRecommendedDpi({
    screenWidthPx: detectedWidth,
    style: playStyle,
  });

  const xAxisScale = activeConfig.xAxisScale ?? 1.45;
  const yDragScale = activeConfig.yDragScale ?? 2.85;
  const touchDeadzoneMm = activeConfig.touchDeadzoneMm ?? 0.15;
  const recoilDampeningPct = activeConfig.recoilDampeningPct ?? 75;
  const fireButtonYOffset = activeConfig.fireButtonYOffset ?? 18;
  const xyRatio = computeDragPhysicsRatio(xAxisScale, yDragScale);

  // DOBBEX HEX Auto Drag Assist & Community Tweaks State
  const [autoDragActive, setAutoDragActive] = useState(true);
  const [activeCommunityTweak, setActiveCommunityTweak] = useState('16450');
  const [upwardDragBoost, setUpwardDragBoost] = useState(4.8);
  const [headshotMagnetism, setHeadshotMagnetism] = useState(98);
  const [recoilStabilizer, setRecoilStabilizer] = useState(75);
  const [instantDragTrigger, setInstantDragTrigger] = useState(true);
  const [assistiveTouchTracking, setAssistiveTouchTracking] = useState(85);

  const handleOpenIosAccessibilitySettings = () => {
    triggerHaptic('action');
    window.location.href = 'App-prefs:ACCESSIBILITY';
    setTimeout(() => {
      alert(
        'iPhone Touch Calibration Guide:\n\n1. Open iPhone Settings\n2. Tap "Accessibility" > "Touch"\n3. Tap "AssistiveTouch" (Turn ON)\n4. Set "Tracking Sensitivity" slider to 85% (Rabbit Icon 🐇)\n5. Set "Touch Accommodations" Hold Duration to 0.10s\n6. Return to Free Fire for instant drag lock!'
      );
    }, 450);
  };

  const handleOpenAndroidSettings = () => {
    triggerHaptic('action');
    window.location.href = 'package:com.android.settings';
    setTimeout(() => {
      alert(
        'Android Sensi Boost Guide:\n\n1. Open Phone Settings\n2. Go to System > Language & Input > Pointer Speed (Set to MAX 🐇)\n3. In Developer Options, set "Smallest Width (DPI)" to 520\n4. Set Touch & Hold Delay to Short (0.5s)\n5. Return to Free Fire for instant drag lock!'
      );
    }, 450);
  };

  const updateField = <K extends keyof SensitivityConfig>(
    key: K,
    val: SensitivityConfig[K]
  ) => {
    onConfigChange({
      ...activeConfig,
      [key]: val,
      source: 'custom',
    });
  };

  const handleCapSwitch = (cap: SensitivityCap) => {
    triggerHaptic('selection');
    onConfigChange(convertConfigCap(activeConfig, cap));
  };

  const handleSelectPreset = (preset: SensitivityConfig) => {
    triggerHaptic('selection');
    const converted = convertConfigCap(preset, activeConfig.cap);
    onConfigChange(converted);
  };

  const handleMaxBoost = () => {
    triggerHaptic('action');
    onConfigChange(applyMaxSensitivityBoost(activeConfig));
  };

  const handleAutoCalibrate = () => {
    triggerHaptic('success');
    const calibrated = computeAutoCalibratedConfig({
      base: activeConfig,
      platform,
      refreshHz: measuredHz,
      screenWidthPx: detectedWidth,
      style: playStyle,
    });
    onConfigChange(calibrated);
  };

  const handleReset = () => {
    triggerHaptic('impact');
    const base = presets[0];
    if (base) {
      onConfigChange(convertConfigCap(base, activeConfig.cap));
    }
  };

  const handleApplyAdaptiveTier = (tier: AdaptiveSensiTier) => {
    triggerHaptic('success');
    setAdaptiveTierId(tier.id);
    const nextConfig = applyAdaptiveSensiTier(
      activeConfig,
      tier,
      platform,
      targetFps
    );
    onConfigChange(nextConfig);
    if (autoLaunchOnApply) {
      onLaunchGame(nextConfig);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) {
      triggerHaptic('warning');
      setSaveError('Enter a profile name before saving.');
      return;
    }
    triggerHaptic('success');
    setSaveError(null);
    setSaving(true);
    try {
      await onSaveCustom(trimmed);
      setCustomName('');
      setSaveSuccess(`Signed & saved "${trimmed}" to Config Vault`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  const configPreview = formatFreeFireConfig(activeConfig, platform, targetFps);

  return (
    <div className="space-y-6">
      {/* 1-Click Platform Install & APK Download Banner */}
      {isInstalled ? (
        <div className="p-3.5 rounded-2xl glass-panel-crimson border border-[#22C55E]/40 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,197,94,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  PASIYA Sensi Engine Active
                </span>
                <span className="text-[10px] font-mono-num font-bold text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/30">
                  INSTALLED PRO
                </span>
              </div>
              <p className="text-xs text-[#A7F3D0] mt-0.5">
                Running in direct hardware mode · Free Fire &amp; MAX Calibrated · 100% Antiban
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-[#22C55E] bg-[#22C55E]/15 px-3 py-1 rounded-lg border border-[#22C55E]/30 hidden sm:inline-block">
            READY FOR BATTLE
          </span>
        </div>
      ) : platform === 'android' ? (
        <div className="p-3.5 rounded-2xl bg-[#0D1C12] border border-[#22C55E]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(34,197,94,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  PASIYA Sensi Android APK (Official Release)
                </span>
                <span className="text-[10px] font-mono-num font-bold text-[#22C55E] bg-[#22C55E]/20 px-2 py-0.5 rounded border border-[#22C55E]/30">
                  FREE FIRE CROSSHAIR READY
                </span>
              </div>
              <p className="text-xs text-[#A7F3D0] mt-0.5">
                Download and install directly on any Android phone (Verified safe).
              </p>
            </div>
          </div>
          <a
            href="./PASIYA-SENSI.apk"
            download="PASIYA-SENSI.apk"
            onClick={() => triggerHaptic('success')}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] text-black text-xs font-bold hover:bg-[#16A34A] hover:text-white transition-all text-center whitespace-nowrap shrink-0 cursor-pointer shadow-lg inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download APK (~4.3 MB)</span>
          </a>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#180C0E] border border-[#EF4444]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  iPhone Direct Settings App (.mobileconfig)
                </span>
                <span className="text-[10px] font-mono-num font-bold text-[#EF4444] bg-[#EF4444]/20 px-2 py-0.5 rounded border border-[#EF4444]/30">
                  FULLSCREEN APP
                </span>
              </div>
              <p className="text-xs text-[#FCA5A5] mt-0.5">
                Settings &gt; Profile Downloaded &gt; Install. Launches fullscreen like a native app!
              </p>
            </div>
          </div>
          <a
            href="./PASIYA-SENSI.mobileconfig"
            download="PASIYA-SENSI.mobileconfig"
            onClick={() => triggerHaptic('action')}
            className="px-4 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] transition-all text-center whitespace-nowrap shrink-0 cursor-pointer shadow-lg inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download iOS Profile</span>
          </a>
        </div>
      )}

      {/* Top Control Bar: Heading, Hardware Auto-Calibrate, Platform & Cap */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sensitivity &amp; Drag Physics Lab
          </h1>
          <p className="mt-1 text-sm text-[#9A9AA6]">
            {platform === 'android' ? 'Android DPI' : 'iOS Gliding Cursor'} ·{' '}
            {activeConfig.cap}-Max Scale · {measuredHz}Hz Display Matched · Y/X {xyRatio}:1
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            data-testid="auto-calibrate-btn"
            onClick={handleAutoCalibrate}
            className="ff-btn-sheen min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
            Auto-Calibrate
          </button>

          {/* Platform Segmented Switch (iOS-smooth spring pill) */}
          <SlidingSegmentedControl<PlatformTarget>
            ariaLabel="Target platform"
            variant="crimson"
            value={platform}
            onChange={onPlatformChange}
            options={[
              { id: 'android', label: 'Android' },
              { id: 'ios', label: 'iOS' },
            ]}
          />

          {/* Cap Scale Switch (iOS-smooth spring pill) */}
          <SlidingSegmentedControl<'200' | '100'>
            ariaLabel="Sensitivity scale maximum"
            variant="white"
            value={String(activeConfig.cap) as '200' | '100'}
            onChange={(val) => handleCapSwitch(Number(val) as SensitivityCap)}
            options={[
              { id: '200', label: '200 Max Cap' },
              { id: '100', label: '100 Classic' },
            ]}
          />
        </div>
      </div>

      {/* 4 Quick Profile Slots with Spring Slide Pill */}
      <SlidingSegmentedControl<'0' | '1' | '2' | '3'>
        ariaLabel="Quick calibration profile slots"
        variant="crimson"
        layout="grid"
        className="rounded-2xl p-1.5"
        pillRadiusClass="rounded-xl"
        buttonClassName="min-h-[42px] font-bold"
        value={String(activeSlot) as '0' | '1' | '2' | '3'}
        onChange={(idxStr) => onSelectSlot(Number(idxStr))}
        options={[
          { id: '0', label: 'Slot 1', testId: 'profile-slot-1' },
          { id: '1', label: 'Slot 2', testId: 'profile-slot-2' },
          { id: '2', label: 'Slot 3', testId: 'profile-slot-3' },
          { id: '3', label: 'Slot 4', testId: 'profile-slot-4' },
        ]}
      />

      {/* Horizontal Weapon Preset Strip (Hidden Scrollbar + Smooth Glide) */}
      <SlidingSegmentedControl<string>
        ariaLabel="Built-in weapon sensitivity presets"
        variant="crimson"
        layout="scrollable"
        className="rounded-2xl p-1.5"
        pillRadiusClass="rounded-xl"
        buttonClassName="min-h-[40px] px-4"
        value={activeConfig.id}
        onChange={(id) => {
          const found = presets.find((p) => p.id === id);
          if (found) handleSelectPreset(found);
        }}
        options={presets.map((preset) => ({
          id: preset.id,
          label: preset.name,
        }))}
      />

      {/* Adaptive Sensi 3-Tier Engine (Platform + Target FPS) */}
      <section
        aria-labelledby="adaptive-sensi-heading"
        className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4 sm:p-5"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#050507] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="adaptive-sensi-heading"
                  className="text-base font-bold text-white"
                >
                  Adaptive Sensi Engine
                </h2>
                <span className="text-[11px] font-mono-num font-bold text-[#EF4444]">
                  {platform === 'ios' ? 'iOS Digitizer' : 'Android DPI'} · {targetFps} FPS
                </span>
              </div>
              <p className="text-xs text-[#9A9AA6] mt-0.5">
                Analyzes {platform === 'ios' ? 'iOS' : 'Android'} touch curve &amp; {targetFps}Hz frame window into 3 calibrated tiers
              </p>
            </div>
          </div>

          <SlidingSegmentedControl<AdaptiveSensiTierId>
            ariaLabel="Adaptive sensitivity tier selector"
            variant="crimson"
            value={adaptiveTierId}
            onChange={setAdaptiveTierId}
            options={adaptiveTiers.map((tier) => ({
              id: tier.id,
              label: tier.label,
              testId: `adaptive-tier-${tier.id}`,
            }))}
          />
        </div>

        <div
          key={`${adaptiveTierId}-${platform}-${targetFps}-${activeConfig.cap}`}
          className="ios-panel-glide mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {adaptiveTiers.map((tier) => {
            const isSelected = tier.id === adaptiveTierId;
            return (
              <div
                key={tier.id}
                className={`rounded-xl border p-3.5 transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#140A0D] border-[#EF4444]/80 shadow-[0_0_20px_rgba(239,68,68,0.14)]'
                    : 'bg-[#060609] border-[#23232B] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {tier.label}
                    </div>
                    <div className="text-[11px] text-[#9A9AA6]">
                      {tier.tagline}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={`apply-adaptive-${tier.id}`}
                    onClick={() => handleApplyAdaptiveTier(tier)}
                    className={`ios-spring-btn min-h-[32px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                        : 'bg-[#13131A] border border-[#2A2A34] text-white hover:border-[#EF4444]/60'
                    }`}
                  >
                    Apply {tier.label}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    ['GEN', tier.general],
                    ['RED', tier.redDot],
                    ['2X', tier.x2],
                    [
                      platform === 'ios' ? 'IOS' : 'DPI',
                      platform === 'ios' ? tier.iosTouchSpeed : tier.dpi,
                    ],
                  ].map(([lbl, val]) => (
                    <div
                      key={lbl}
                      className="rounded-lg bg-[#050507] border border-[#23232B] py-1.5"
                    >
                      <div className="text-[9px] text-[#9A9AA6]">{lbl}</div>
                      <div className="text-xs font-bold font-mono-num text-white">
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2.5 text-[11px] text-[#C4C4CF] leading-relaxed">
                  {tier.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free Fire Auto-Launch Bridge */}
      <GameLauncherCard
        edition={gameEdition}
        onEditionChange={onEditionChange}
        autoLaunchOnApply={autoLaunchOnApply}
        onToggleAutoLaunch={onToggleAutoLaunch}
        platform={platform}
        activeConfig={activeConfig}
        targetFps={targetFps}
        onLaunchTriggered={() => onLaunchGame()}
      />

      {/* DOBBEX HEX Auto Drag Assist & Community Tweaks Engine */}
      <section className="rounded-2xl bg-[#0B0B0F] border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-bold text-white">Auto Drag Assist &amp; Tweaks</h2>
              <p className="text-xs text-[#9A9AA6]">Custom hex codes &amp; upward recoil dampening</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#38BDF8] bg-[#38BDF8]/15 px-2.5 py-0.5 rounded border border-[#38BDF8]/30">
            Tweak #{activeCommunityTweak}
          </span>
        </div>

        {/* Toggle 1: Aim Auto Drag Assist */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
          <div>
            <div className="text-xs font-bold text-white">Aim Auto Drag Assist</div>
            <div className="text-[10px] text-[#9A9AA6]">Activates vertical drag lift curve on 1st touch</div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('action');
              setAutoDragActive((v) => !v);
            }}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoDragActive ? 'bg-[#38BDF8]' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                autoDragActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Community Tweaks Selector */}
        <div>
          <label className="block text-xs font-mono text-[#9A9AA6] mb-2 uppercase tracking-wider">
            COMMUNITY TWEAKS
          </label>
          <div className="grid grid-cols-5 gap-2">
            {['16450', '21024', '8080', '16452', 'Custom'].map((code) => {
              const isSelected = activeCommunityTweak === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveCommunityTweak(code);
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-[#38BDF8] text-black shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                      : 'bg-black/40 text-white border border-white/10 hover:border-white/25'
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Upward Drag, Headshot Magnetism, Micro-Recoil */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-1">
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <span>↗</span> Upward Drag Lift Boost
              </span>
              <span className="font-mono text-[#38BDF8]">{upwardDragBoost.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.05"
              value={upwardDragBoost}
              onChange={(e) => {
                triggerSliderDetent();
                setUpwardDragBoost(Number(e.target.value));
              }}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-1">
              <span className="flex items-center gap-1.5 text-[#EF4444]">
                <span>🎯</span> Headshot Magnetism
              </span>
              <span className="font-mono text-white">{headshotMagnetism}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="1"
              value={headshotMagnetism}
              onChange={(e) => {
                triggerSliderDetent();
                setHeadshotMagnetism(Number(e.target.value));
              }}
              className="w-full accent-[#EF4444] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-1">
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <span>🛡</span> Micro-Recoil Stabilizer
              </span>
              <span className="font-mono text-[#38BDF8]">{recoilStabilizer}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={recoilStabilizer}
              onChange={(e) => {
                triggerSliderDetent();
                setRecoilStabilizer(Number(e.target.value));
              }}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
          </div>
        </div>

        {/* Toggle 2: 1st Touch Instant Drag Trigger */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="text-xs font-bold text-white">1st Touch Instant Drag Trigger</div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('action');
              setInstantDragTrigger((v) => !v);
            }}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              instantDragTrigger ? 'bg-[#38BDF8]' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                instantDragTrigger ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* DOBBEX HEX REAL SYSTEM TOUCH CALIBRATION (WHY GAME SENSI DIRECTLY CHANGES) */}
      <section className="rounded-2xl bg-[#0B0B0F] border border-[#38BDF8]/40 p-5 sm:p-6 shadow-[0_0_30px_rgba(56,189,248,0.12)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#38BDF8]" />
            <div>
              <h2 className="text-base font-bold text-white">
                {platform === 'ios' ? 'iOS AssistiveTouch Tuning' : 'Android Pointer Speed & Touch Engine'}
              </h2>
              <span className="text-xs text-[#86EFAC]">
                Direct Hardware Digitizer Calibration
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={platform === 'ios' ? handleOpenIosAccessibilitySettings : handleOpenAndroidSettings}
            className="px-3.5 py-1.5 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-black text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Open Settings</span>
          </button>
        </div>

        {platform === 'ios' ? (
          <div>
            <div className="flex justify-between text-xs font-semibold text-white mb-1.5">
              <span>Tracking Sensitivity (Rabbit Icon)</span>
              <span className="font-mono text-[#38BDF8]">{assistiveTouchTracking}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={assistiveTouchTracking}
              onChange={(e) => {
                triggerSliderDetent();
                setAssistiveTouchTracking(Number(e.target.value));
              }}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
            <div className="mt-3 p-3 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-mono text-[#9A9AA6] font-bold">
                RECOMMENDED HARDWARE CALIBRATION:
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>AssistiveTouch Tracking: 85% (Rabbit Icon 🐇)</span>
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>Touch Accommodations: Hold Duration 0.10s</span>
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>3D Touch / Haptic: Fast Response</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-mono text-[#9A9AA6] font-bold">
                RECOMMENDED ANDROID HARDWARE CALIBRATION:
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>Pointer Speed: Maximum (Rabbit 🐇)</span>
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>Developer Options: Smallest Width (DPI) 520 / 600</span>
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>Touch &amp; Hold Delay: Short (0.5s)</span>
              </div>
              <div className="flex items-center gap-2 text-[#86EFAC]">
                <span>✓</span>
                <span>Touch Sampling Rate: 240Hz / 360Hz Gaming Mode</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Precision Sliders + X/Y Drag Physics Calibrator */}
        <div className="lg:col-span-7 space-y-6">
          <section
            aria-labelledby="sliders-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#23232B]">
              <div>
                <h2 id="sliders-heading" className="text-base font-bold text-white">
                  {activeConfig.name}
                </h2>
                <p className="text-xs text-[#9A9AA6] mt-0.5">
                  {activeConfig.weapons.join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMaxBoost}
                  className="ff-btn-sheen min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#190B0E] border border-[#EF4444]/55 text-xs font-semibold text-white hover:bg-[#261015] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                  Max Sensitivity
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-medium text-[#C4C4CF] hover:text-white hover:border-white/30 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>

            {/* Compact 8-Cell In-Game Matrix Summary */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['General', activeConfig.general],
                ['Red Dot', activeConfig.redDot],
                ['2x Scope', activeConfig.x2],
                ['4x Scope', activeConfig.x4],
                ['Sniper', activeConfig.awm],
                ['Free Look', activeConfig.freeLook],
                ['Button Size', `${activeConfig.fireButtonSize}%`],
                ['Button Y', `${fireButtonYOffset}%`],
              ].map(([lbl, val]) => (
                <div
                  key={lbl}
                  className="rounded-xl bg-[#060609] border border-[#23232B] py-2 px-1"
                >
                  <div className="text-[10px] text-[#9A9AA6]">{lbl}</div>
                  <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
                    {val}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1">
              <SliderRow
                id="sens-general"
                label="General"
                value={activeConfig.general}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('general', v)}
              />
              <SliderRow
                id="sens-reddot"
                label="Red Dot"
                value={activeConfig.redDot}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('redDot', v)}
              />
              <SliderRow
                id="sens-2x"
                label="2x Scope"
                value={activeConfig.x2}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('x2', v)}
              />
              <SliderRow
                id="sens-4x"
                label="4x Scope"
                value={activeConfig.x4}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('x4', v)}
              />
              <SliderRow
                id="sens-awm"
                label="AWM / Sniper Scope"
                value={activeConfig.awm}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('awm', v)}
              />
              <SliderRow
                id="sens-freelook"
                label="Free Look"
                value={activeConfig.freeLook}
                min={0}
                max={activeConfig.cap}
                onChange={(v) => updateField('freeLook', v)}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-[#23232B] space-y-1">
              <SliderRow
                id="sens-firebtn"
                label="Fire Button Size (Drag Room)"
                value={activeConfig.fireButtonSize}
                min={35}
                max={75}
                unit="%"
                onChange={(v) => updateField('fireButtonSize', v)}
              />
              <SliderRow
                id="sens-fire-y"
                label="Fire Trigger Y-Position Offset"
                value={fireButtonYOffset}
                min={10}
                max={32}
                unit="%"
                onChange={(v) => updateField('fireButtonYOffset', v)}
              />
              <SliderRow
                id="sens-dragpred"
                label="Drag Prediction Lift Offset"
                value={activeConfig.dragPredictionPct ?? 5}
                min={0}
                max={10}
                unit="%"
                onChange={(v) => updateField('dragPredictionPct', v)}
              />
              {platform === 'android' ? (
                <SliderRow
                  id="sens-dpi"
                  label="Android DPI (Smallest Width)"
                  value={activeConfig.dpi}
                  min={320}
                  max={640}
                  unit=" dp"
                  onChange={(v) => updateField('dpi', v)}
                />
              ) : (
                <SliderRow
                  id="sens-ios-touch"
                  label="iOS Gliding Cursor Speed"
                  value={activeConfig.iosTouchSpeed}
                  min={40}
                  max={120}
                  onChange={(v) => updateField('iosTouchSpeed', v)}
                />
              )}
            </div>

            {/* Save Signed Custom Profile Form */}
            <form
              onSubmit={handleSaveSubmit}
              className="mt-6 pt-5 border-t border-[#23232B] flex flex-col sm:flex-row gap-3"
            >
              <label htmlFor="custom-profile-name" className="sr-only">
                Custom profile name
              </label>
              <input
                id="custom-profile-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name custom profile (e.g. Poco F5 Rush)"
                maxLength={40}
                className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#060609] border border-[#23232B] text-sm text-white placeholder:text-[#6E6E7A] focus:outline-none focus:border-[#EF4444]"
              />
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#050507] text-sm font-bold hover:bg-[#E5E5EC] disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
                {saving ? 'Signing...' : 'Save & Sign'}
              </button>
            </form>

            {saveError && (
              <p role="alert" className="mt-2 text-xs text-[#EF4444]">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p role="status" className="mt-2 text-xs text-[#22C55E]">
                {saveSuccess}
              </p>
            )}
          </section>

          {/* X & Y Drag Physics Calibrator */}
          <section
            aria-labelledby="xy-physics-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#23232B]">
              <div>
                <h2 id="xy-physics-heading" className="text-base font-bold text-white">
                  X &amp; Y Drag Physics Calibrator
                </h2>
                <p className="text-xs text-[#9A9AA6] mt-0.5">
                  Balance horizontal gloo-turn speed against vertical headshot drag lift
                </p>
              </div>
              <span
                data-testid="xy-ratio-readout"
                className="text-xs font-mono-num font-bold text-[#EF4444]"
              >
                Y/X Ratio: {xyRatio}:1
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <SliderRow
                  id="physics-x-axis"
                  label="X-Axis Horizontal Sensitivity"
                  value={xAxisScale}
                  min={1}
                  max={2.2}
                  step={0.05}
                  displayValue={`${xAxisScale.toFixed(2)}x`}
                  onChange={(v) => updateField('xAxisScale', v)}
                />
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[
                    [1.2, '1.20x'],
                    [1.45, '1.45x Pro'],
                    [1.65, '1.65x Fast'],
                    [1.9, '1.90x Gloo'],
                  ].map(([val, label]) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        updateField('xAxisScale', Number(val));
                      }}
                      className={`min-h-[34px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        Math.abs(xAxisScale - Number(val)) < 0.03
                          ? 'bg-[#EF4444] text-white border-[#EF4444]'
                          : 'bg-[#060609] text-[#C4C4CF] border-[#23232B] hover:border-white/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SliderRow
                  id="physics-y-drag"
                  label="Y-Axis Headshot Drag"
                  value={yDragScale}
                  min={1.5}
                  max={4.2}
                  step={0.05}
                  displayValue={`${yDragScale.toFixed(2)}x`}
                  onChange={(v) => updateField('yDragScale', v)}
                />
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[
                    [2.4, '2.40x Stable'],
                    [2.85, '2.85x HS'],
                    [3.2, '3.20x J-Drag'],
                    [3.6, '3.60x Snap'],
                  ].map(([val, label]) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        updateField('yDragScale', Number(val));
                      }}
                      className={`min-h-[34px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        Math.abs(yDragScale - Number(val)) < 0.03
                          ? 'bg-white text-[#050507] border-white'
                          : 'bg-[#060609] text-[#C4C4CF] border-[#23232B] hover:border-white/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#23232B] space-y-1">
                <SliderRow
                  id="physics-deadzone"
                  label="Edge Touch Deadzone"
                  value={touchDeadzoneMm}
                  min={0.05}
                  max={0.4}
                  step={0.01}
                  displayValue={`${touchDeadzoneMm.toFixed(2)} mm`}
                  onChange={(v) => updateField('touchDeadzoneMm', v)}
                />
                <SliderRow
                  id="physics-recoil"
                  label="Micro-Recoil Dampening"
                  value={recoilDampeningPct}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateField('recoilDampeningPct', v)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Tactical Drag Arena, Ready-to-Paste Config & DPI Calculator */}
        <div className="lg:col-span-5 space-y-6">
          <DragSimulator config={activeConfig} />

          <section
            aria-labelledby="config-output-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2
                id="config-output-heading"
                className="text-base font-bold text-white"
              >
                Ready-to-Paste Settings
              </h2>
              <button
                type="button"
                onClick={() => void onCopyConfig()}
                className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-semibold hover:bg-[#DC2626] transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy Config
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#060609] border border-[#23232B] text-xs font-mono-num text-[#E2E2EA] whitespace-pre-wrap leading-relaxed">
              {configPreview}
            </pre>
            <p className="mt-3 text-xs text-[#9A9AA6] leading-relaxed">
              <strong className="text-white">Recoil &amp; Aim Note:</strong>{' '}
              {activeConfig.recoilNotes}
            </p>
          </section>

          {/* Playstyle DPI & Touch Multiplier Calculator */}
          <section
            aria-labelledby="dpi-calc-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="dpi-calc-heading" className="text-base font-bold text-white">
                Playstyle {platform === 'android' ? 'DPI' : 'Touch'} Calculator
              </h2>
              <span className="text-xs font-mono-num text-[#EF4444]">
                {platform === 'android'
                  ? `${dpiSuggestion.recommendedDpi} dp`
                  : `Speed ${dpiSuggestion.touchStepIos}`}
              </span>
            </div>

            <SlidingSegmentedControl<PlayStyleTarget>
              ariaLabel="Playstyle target selector"
              variant="crimson"
              layout="grid"
              className="mt-3"
              value={playStyle}
              onChange={setPlayStyle}
              options={[
                { id: 'balanced', label: 'Balanced' },
                { id: 'one-tap', label: 'One-Tap' },
                { id: 'fast-gloo', label: '360° Gloo' },
              ]}
            />

            <p className="mt-3 text-xs text-[#9A9AA6] leading-relaxed">
              {dpiSuggestion.note}
            </p>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onConfigChange({
                  ...activeConfig,
                  dpi: dpiSuggestion.recommendedDpi,
                  iosTouchSpeed: dpiSuggestion.touchStepIos,
                  source: 'custom',
                });
              }}
              className="mt-3 w-full min-h-[40px] rounded-xl bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] transition-colors cursor-pointer"
            >
              Apply Recommended{' '}
              {platform === 'android'
                ? `${dpiSuggestion.recommendedDpi} DPI`
                : `Speed ${dpiSuggestion.touchStepIos}`}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
