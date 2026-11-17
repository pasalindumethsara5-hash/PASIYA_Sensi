import React, { useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  Crosshair,
  Eye,
  LocateFixed,
  MonitorDot,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { PlatformTarget, SensitivityConfig } from '../lib/optimizer';
import {
  type EngagementRange,
  RETICLE_COLORS,
  RETICLE_SHAPES,
  type ReticleOverlayConfig,
  type ReticleShapeId,
  SCOPE_OVERLAY_PRESETS,
  type ScopeModeId,
  WEAPON_CLASS_PROFILES,
  type WeaponClassId,
  computeOverlayScopeSync,
  computeTacticalAimSolution,
} from '../lib/aimAssist';
import { triggerHaptic, triggerSliderDetent } from '../lib/haptics';
import {
  isNativeAndroid,
  checkOverlayPermission,
  requestOverlayPermission,
} from '../lib/nativeCrosshair';
import { copyTextSafely } from '../lib/clipboard';
import { ReticleGlyph, ReticleMiniIcon } from './ReticleGlyph';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

interface AimAssistViewProps {
  activeConfig: SensitivityConfig;
  platform: PlatformTarget;
  overlayEnabled: boolean;
  onToggleOverlay: () => void;
  scopeMode: ScopeModeId;
  onSelectScopeMode: (scope: ScopeModeId) => void;
  reticle: ReticleOverlayConfig;
  onReticleChange: React.Dispatch<React.SetStateAction<ReticleOverlayConfig>>;
}

export const AimAssistView: React.FC<AimAssistViewProps> = ({
  activeConfig,
  platform,
  overlayEnabled,
  onToggleOverlay,
  scopeMode,
  onSelectScopeMode,
  reticle,
  onReticleChange,
}) => {
  const [weaponClass, setWeaponClass] = useState<WeaponClassId>('one-tap');
  const [range, setRange] = useState<EngagementRange>('mid');
  const [showDragVector, setShowDragVector] = useState(true);
  const [customReticlePos, setCustomReticlePos] = useState<{
    xPct: number;
    yPct: number;
  } | null>(null);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

  React.useEffect(() => {
    if (isNativeAndroid()) {
      checkOverlayPermission().then(setHasOverlayPermission);
    }
  }, [overlayEnabled]);

  const handleToggleOverlayWithPermission = async () => {
    triggerHaptic(overlayEnabled ? 'tap' : 'success');
    if (!overlayEnabled && isNativeAndroid()) {
      const granted = await checkOverlayPermission();
      if (!granted) {
        setHasOverlayPermission(false);
        await requestOverlayPermission();
        return;
      }
    }
    onToggleOverlay();
  };

  const solution = computeTacticalAimSolution({
    weaponClass,
    range,
    config: activeConfig,
    platform,
  });

  const scopeSync = computeOverlayScopeSync(scopeMode, activeConfig);

  const handleSelectWeaponClass = (nextClass: WeaponClassId) => {
    triggerHaptic('selection');
    setWeaponClass(nextClass);
    setCustomReticlePos(null);
    const nextSolution = computeTacticalAimSolution({
      weaponClass: nextClass,
      range,
      config: activeConfig,
      platform,
    });
    onReticleChange((prev) => ({
      ...prev,
      shape: nextSolution.profile.recommendedReticle,
      gapPx: nextSolution.effectiveReticleGapPx,
    }));
  };

  const handleApplyRecommendedReticle = () => {
    triggerHaptic('success');
    setCustomReticlePos(null);
    onReticleChange((prev) => ({
      ...prev,
      shape: solution.profile.recommendedReticle,
      gapPx: solution.effectiveReticleGapPx,
    }));
  };

  const handleScopeSelection = (nextScope: ScopeModeId) => {
    triggerHaptic('selection');
    onSelectScopeMode(nextScope);
    const nextSync = computeOverlayScopeSync(nextScope, activeConfig);
    setWeaponClass(nextSync.preset.recommendedClass);
    setCustomReticlePos(null);
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.min(84, Math.max(16, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(82, Math.max(16, ((e.clientY - rect.top) / rect.height) * 100));
    triggerHaptic('detent');
    setCustomReticlePos({
      xPct: Math.round(xPct),
      yPct: Math.round(yPct),
    });
  };

  // Convert targetHeightPct (0 = chest base, 100 = head top) into visual arena top %
  const defaultAnchorTopPct = Math.round(68 - (solution.targetHeightPct / 100) * 44);
  const reticleLeftPct = customReticlePos?.xPct ?? 50;
  const reticleTopPct = customReticlePos?.yPct ?? defaultAnchorTopPct;

  const handleCopySpec = async () => {
    triggerHaptic('success');
    const summary = [
      `[PASIYA SENSI — AIM ASSIST (${solution.profile.label})]`,
      `Scope Guide: ${scopeSync.preset.label} (${scopeSync.preset.magnification})`,
      `Weapons: ${solution.profile.weapons.join(', ')}`,
      `Range Focus: ${range.toUpperCase()} (${solution.profile.idealRangeLabel})`,
      `Crosshair Style: ${reticle.shape} · Gap ${reticle.gapPx}px · Scale ${reticle.scale.toFixed(2)}x`,
      `Pre-Aim Anchor: ${solution.profile.primaryAnchorName}`,
      `Drag Execution: ${solution.dragVectorLabel}`,
      `Synced ${scopeSync.sensitivityLabel}: ${scopeSync.sensitivityValue}`,
    ].join('\n');
    await copyTextSafely(summary);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Fair-Play Clarification */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Aim Assist &amp; Reticle Optics Lab
          </h1>
          <p className="mt-1 text-sm text-[#9A9AA6]">
            Visual crosshair overlays, head-anchor alignment &amp; positioning playbooks · Zero game injection
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopySpec()}
          className="ff-btn-sheen self-start lg:self-auto min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copiedSpec ? (
            <Check className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
          )}
          {copiedSpec ? 'Copied Playbook' : 'Copy Aim Playbook'}
        </button>
      </div>

      {/* Persistent Screen-Center Crosshair Overlay Controller & Free Fire Scope Selector */}
      <section
        aria-labelledby="overlay-mode-heading"
        className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
          overlayEnabled
            ? 'bg-[#12090C] border-[#EF4444]/75 shadow-[0_0_24px_rgba(239,68,68,0.16)]'
            : 'bg-[#0B0B0F] border-[#23232B]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#050507] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <MonitorDot className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="overlay-mode-heading"
                  className="text-base font-bold text-white"
                >
                  Persistent Screen-Center Crosshair Overlay
                </h2>
                <span
                  className={`text-[10px] font-mono-num font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    overlayEnabled
                      ? 'bg-[#EF4444]/20 border-[#EF4444]/60 text-white'
                      : 'bg-[#060609] border-[#23232B] text-[#9A9AA6]'
                  }`}
                >
                  {overlayEnabled ? 'CENTER HUD ACTIVE' : 'STANDBY'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#9A9AA6]">
                Pins a non-intrusive click-through reticle at exact viewport center across tabs · Tuned per Free Fire optic
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={overlayEnabled}
            data-testid="toggle-persistent-overlay"
            onClick={() => void handleToggleOverlayWithPermission()}
            className={`ff-btn-sheen min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              overlayEnabled
                ? 'bg-[#EF4444] text-white border-[#EF4444]'
                : 'bg-white text-[#050507] border-white hover:bg-[#E5E5EC]'
            }`}
          >
            {overlayEnabled ? 'Overlay ON · Click to Hide' : 'Enable Screen Overlay'}
          </button>
        </div>

        {isNativeAndroid() && !hasOverlayPermission && (
          <div className="mt-3 p-3 rounded-xl bg-[#2A1215] border border-[#EF4444]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#FCA5A5]">
              <strong className="text-white block font-bold">Free Fire Crosshair Permission Required:</strong>
              Allow &quot;Display over other apps&quot; in Android Settings so the crosshair stays on screen when playing Free Fire.
            </div>
            <button
              type="button"
              onClick={() => void requestOverlayPermission()}
              className="px-3.5 py-1.5 rounded-lg bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] transition-colors shrink-0 cursor-pointer"
            >
              Grant Permission
            </button>
          </div>
        )}

        {/* Scope Selector Row */}
        <div
          role="group"
          aria-label="Free Fire weapon scope overlay presets"
          className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2"
        >
          {SCOPE_OVERLAY_PRESETS.map((scope) => {
            const activeScope = scopeMode === scope.id;
            const synced = computeOverlayScopeSync(scope.id, activeConfig);
            return (
              <button
                key={scope.id}
                type="button"
                data-testid={`scope-preset-${scope.id}`}
                onClick={() => handleScopeSelection(scope.id)}
                className={`rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                  activeScope
                    ? 'bg-[#1A0D10] border-[#EF4444] text-white'
                    : 'bg-[#060609] border-[#23232B] text-[#C4C4CF] hover:border-white/35'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {scope.shortLabel}
                  </span>
                  <span className="text-[10px] font-mono-num font-bold text-[#EF4444] shrink-0">
                    {scope.magnification}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-mono-num text-[#9A9AA6]">
                  <span className="truncate">{scope.weaponFocus.split(' · ')[0]}</span>
                  <span className="text-white font-semibold shrink-0">
                    Sensi {synced.sensitivityValue}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p
          data-testid="active-scope-cue"
          className="mt-3 text-xs text-[#C4C4CF] leading-relaxed"
        >
          <strong className="text-white">{scopeSync.preset.label} Cue:</strong>{' '}
          {scopeSync.preset.scopeCue}
        </p>
      </section>

      {/* 5 Weapon Class Selector Tabs (iOS-smooth spring pill + no scrollbar) */}
      <SlidingSegmentedControl<WeaponClassId>
        ariaLabel="Free Fire weapon classes"
        variant="crimson"
        layout="scrollable"
        className="rounded-2xl p-1.5"
        pillRadiusClass="rounded-xl"
        buttonClassName="min-h-[42px] px-4 font-bold"
        value={weaponClass}
        onChange={handleSelectWeaponClass}
        options={WEAPON_CLASS_PROFILES.map((wc) => ({
          id: wc.id,
          label: wc.shortLabel,
          testId: `weapon-class-${wc.id}`,
        }))}
      />

      {/* Main 2-Column Interactive Reticle Stage + Positioning Playbook */}
      <div
        key={weaponClass}
        className="ios-panel-glide grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left: Visual Reticle Overlay Stage & Sight Customizer */}
        <div className="lg:col-span-7 space-y-6">
          <section
            aria-labelledby="reticle-stage-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2
                  id="reticle-stage-heading"
                  className="text-base font-bold text-white"
                >
                  Interactive Reticle Overlay Stage
                </h2>
                <p className="text-xs text-[#9A9AA6] mt-0.5">
                  {solution.profile.weapons.join(' · ')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap');
                    setShowDragVector((v) => !v);
                  }}
                  className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    showDragVector
                      ? 'bg-[#190B0E] border-[#EF4444]/60 text-white'
                      : 'bg-[#13131A] border-[#2A2A34] text-[#9A9AA6] hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                  Drag Vector
                </button>
                {customReticlePos && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCustomReticlePos(null);
                    }}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-semibold text-white hover:border-white/40 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <LocateFixed className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                    Snap Anchor
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Tactical Target Viewport */}
            <div
              data-testid="reticle-preview-stage"
              onClick={handleStageClick}
              title="Click anywhere inside arena to preview custom reticle placement"
              className="relative h-72 sm:h-80 rounded-xl bg-[#050507] border border-[#23232B] overflow-hidden select-none cursor-crosshair"
            >
              {/* Rangefinder horizon & subtle distance ticks */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,68,68,0.12) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Top HUD telemetry strip inside optical preview */}
              <div className="pointer-events-none relative z-10 flex items-center justify-between px-3.5 py-2.5 text-[11px] font-mono-num text-[#9A9AA6]">
                <span>
                  OPTIC: {RETICLE_SHAPES.find((s) => s.id === reticle.shape)?.label.toUpperCase()}
                </span>
                <span className="text-white">
                  RANGE:{' '}
                  {range === 'close' ? '8m' : range === 'mid' ? '24m' : '48m'}
                </span>
              </div>

              {/* Enemy Tactical Silhouette (Scaled slightly by range!) */}
              <div
                aria-hidden="true"
                style={{
                  transform: `translate(-50%, -50%) scale(${
                    range === 'close' ? 1.12 : range === 'mid' ? 0.96 : 0.78
                  })`,
                }}
                className="pointer-events-none absolute left-1/2 top-[53%] flex flex-col items-center transition-transform duration-300 ease-out"
              >
                {/* Head Hitbox Zone */}
                <div className="w-12 h-12 rounded-full border-2 border-[#EF4444]/80 bg-[#EF4444]/10 flex items-center justify-center">
                  <span className="text-[9px] font-mono-num font-bold text-white">
                    HEAD
                  </span>
                </div>

                {/* Collar / Shoulder Pre-Aim Line */}
                <div className="mt-1 w-20 h-3 rounded-t-lg border-x border-t border-white/25 bg-white/[0.04]" />

                {/* Upper & Mid Chest Block */}
                <div className="w-20 h-24 rounded-b-xl border border-[#2A2A34] bg-[#101016]/90 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] font-mono-num text-[#9A9AA6]">
                    CHEST
                  </span>
                </div>
              </div>

              {/* Tactical Gloo / Hard-Cover Peek Reference Block */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-3 sm:left-4 bottom-0 w-20 sm:w-24 h-24 sm:h-28 rounded-tr-xl border-t border-r border-white/20 bg-[#121218]/90 px-2 sm:px-2.5 py-2 flex flex-col justify-between"
              >
                <span className="text-[8px] sm:text-[9px] font-mono-num text-[#9A9AA6] leading-tight">
                  RIGHT PEEK
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono-num text-[#EF4444]">
                  45° GLOO
                </span>
              </div>

              {/* Recommended Drag Lift Trajectory Vector */}
              {showDragVector && (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 w-full h-full"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="ff-arrow-head"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L6,3 L0,6 Z" fill="#22C55E" />
                    </marker>
                  </defs>
                  <path
                    d={`M ${reticleLeftPct} ${reticleTopPct} Q ${
                      reticleLeftPct + Math.round(solution.curveAngleDeg * 0.35)
                    } ${Math.max(18, reticleTopPct - 10)} ${reticleLeftPct} ${Math.max(
                      18,
                      reticleTopPct - 20
                    )}`}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="0.7"
                    strokeDasharray="1.8 1.4"
                    markerEnd="url(#ff-arrow-head)"
                  />
                </svg>
              )}

              {/* Live Visual Reticle Overlay */}
              <div
                data-testid="active-reticle-overlay"
                style={{
                  left: `${reticleLeftPct}%`,
                  top: `${reticleTopPct}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out"
              >
                <ReticleGlyph
                  reticle={reticle}
                  bloomRadiusPx={solution.bloomRadiusPx}
                />
              </div>

              {/* Bottom Hint Inside Stage */}
              <div className="pointer-events-none absolute bottom-2.5 right-3 text-[10px] font-mono-num text-[#9A9AA6]">
                Tap stage to align reticle
              </div>
            </div>

            {/* Sight Customizer Controls */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-white">
                  Reticle Shape Presets
                </span>
                <button
                  type="button"
                  data-testid="apply-recommended-reticle"
                  onClick={handleApplyRecommendedReticle}
                  className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#190B0E] border border-[#EF4444]/55 text-xs font-semibold text-white hover:bg-[#261015] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                  Apply Recommended Sight
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RETICLE_SHAPES.map((shapeItem) => {
                  const active = reticle.shape === shapeItem.id;
                  return (
                    <button
                      key={shapeItem.id}
                      type="button"
                      data-testid={`reticle-shape-${shapeItem.id}`}
                      onClick={() => {
                        triggerHaptic('selection');
                        onReticleChange((prev) => ({
                          ...prev,
                          shape: shapeItem.id as ReticleShapeId,
                        }));
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl text-left border transition-colors flex items-center gap-2 cursor-pointer ${
                        active
                          ? 'bg-[#EF4444] text-white border-[#EF4444]'
                          : 'bg-[#060609] text-[#C4C4CF] border-[#23232B] hover:border-white/35'
                      }`}
                    >
                      <ReticleMiniIcon
                        shape={shapeItem.id}
                        color={active ? '#FFFFFF' : reticle.color}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {shapeItem.label}
                        </div>
                        <div
                          className={`text-[10px] font-mono-num truncate ${
                            active ? 'text-white/85' : 'text-[#9A9AA6]'
                          }`}
                        >
                          {shapeItem.tag}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Swatches + Center Dot Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#23232B]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#9A9AA6] mr-1">Sight Color</span>
                  {RETICLE_COLORS.map((c) => {
                    const active = reticle.color === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap');
                          onReticleChange((prev) => ({ ...prev, color: c.hex }));
                        }}
                        className={`min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#16161D] border-white text-white'
                            : 'bg-[#060609] border-[#23232B] text-[#C4C4CF] hover:border-white/30'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: c.hex }}
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          aria-hidden="true"
                        />
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={reticle.showCenterDot}
                  onClick={() => {
                    triggerHaptic('tap');
                    onReticleChange((prev) => ({
                      ...prev,
                      showCenterDot: !prev.showCenterDot,
                    }));
                  }}
                  className={`min-h-[36px] inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    reticle.showCenterDot
                      ? 'bg-white text-[#050507] border-white'
                      : 'bg-[#060609] text-[#9A9AA6] border-[#23232B]'
                  }`}
                >
                  Center Dot: {reticle.showCenterDot ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Reticle Geometry Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="reticle-scale" className="text-white font-medium">
                      Scale
                    </label>
                    <span className="font-mono-num font-bold text-[#EF4444]">
                      {reticle.scale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    id="reticle-scale"
                    type="range"
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    value={reticle.scale}
                    onChange={(e) => {
                      triggerSliderDetent();
                      onReticleChange((prev) => ({
                        ...prev,
                        scale: Number(e.target.value),
                      }));
                    }}
                    className="tactical-slider"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="reticle-gap" className="text-white font-medium">
                      Center Gap
                    </label>
                    <span className="font-mono-num font-bold text-[#EF4444]">
                      {reticle.gapPx} px
                    </span>
                  </div>
                  <input
                    id="reticle-gap"
                    type="range"
                    min={2}
                    max={16}
                    step={1}
                    value={reticle.gapPx}
                    onChange={(e) => {
                      triggerSliderDetent();
                      onReticleChange((prev) => ({
                        ...prev,
                        gapPx: Number(e.target.value),
                      }));
                    }}
                    className="tactical-slider"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="reticle-opacity" className="text-white font-medium">
                      Opacity
                    </label>
                    <span className="font-mono-num font-bold text-[#EF4444]">
                      {reticle.opacityPct}%
                    </span>
                  </div>
                  <input
                    id="reticle-opacity"
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={reticle.opacityPct}
                    onChange={(e) => {
                      triggerSliderDetent();
                      onReticleChange((prev) => ({
                        ...prev,
                        opacityPct: Number(e.target.value),
                      }));
                    }}
                    className="tactical-slider"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Engagement Distance + Synced Scope Metrics + Positioning Tips */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-labelledby="aim-playbook-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
                <h2
                  id="aim-playbook-heading"
                  className="text-base font-bold text-white"
                >
                  {solution.profile.label} Profile
                </h2>
              </div>
              <span className="text-xs font-mono-num font-bold text-[#EF4444]">
                {solution.profile.idealRangeLabel}
              </span>
            </div>

            {/* Engagement Distance Switch (iOS-smooth spring pill) */}
            <SlidingSegmentedControl<EngagementRange>
              ariaLabel="Engagement distance"
              variant="crimson"
              layout="grid"
              className="mt-4"
              value={range}
              onChange={(rId) => {
                setRange(rId);
                setCustomReticlePos(null);
              }}
              options={[
                { id: 'close', label: 'Close (0–12m)', testId: 'range-close' },
                { id: 'mid', label: 'Mid (12–35m)', testId: 'range-mid' },
                { id: 'long', label: 'Long (35m+)', testId: 'range-long' },
              ]}
            />

            {/* 3-Tile Synced Ballistics Summary */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-left">
              <div className="rounded-xl bg-[#060609] border border-[#23232B] p-3">
                <div className="text-[11px] text-[#9A9AA6]">Pre-Aim Anchor</div>
                <div className="mt-1 text-xs font-bold text-white leading-snug">
                  {solution.profile.primaryAnchorName}
                </div>
              </div>
              <div className="rounded-xl bg-[#060609] border border-[#23232B] p-3">
                <div className="text-[11px] text-[#9A9AA6]">
                  Synced {solution.pairedScopeLabel}
                </div>
                <div
                  data-testid="aim-synced-scope"
                  className="mt-1 text-lg font-extrabold font-mono-num text-[#EF4444]"
                >
                  {solution.pairedScopeValue}
                </div>
              </div>
              <div className="rounded-xl bg-[#060609] border border-[#23232B] p-3">
                <div className="text-[11px] text-[#9A9AA6]">Drag Action</div>
                <div className="mt-1 text-xs font-bold font-mono-num text-[#22C55E] leading-snug">
                  {solution.dragVectorLabel}
                </div>
              </div>
            </div>

            {/* Stance & Anchor Directive */}
            <div className="mt-4 rounded-xl bg-[#060609] border border-[#23232B] p-3.5">
              <div className="text-xs font-semibold text-white mb-1">
                Distance Discipline
              </div>
              <p
                data-testid="aim-stance-note"
                className="text-xs text-[#C4C4CF] leading-relaxed"
              >
                {solution.stanceNote}
              </p>
            </div>
          </section>

          {/* Tactical Positioning Playbook */}
          <section
            aria-labelledby="positioning-tips-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
                <h2
                  id="positioning-tips-heading"
                  className="text-base font-bold text-white"
                >
                  Tactical Positioning Tips
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#22C55E]">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Fair Play
              </span>
            </div>

            <div className="divide-y divide-[#23232B]">
              {solution.profile.positioningTips.map((tip, idx) => (
                <div key={tip.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="text-sm font-semibold text-white">
                    0{idx + 1}. {tip.title}
                  </div>
                  <p className="mt-1 text-xs text-[#9A9AA6] leading-relaxed">
                    {tip.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
