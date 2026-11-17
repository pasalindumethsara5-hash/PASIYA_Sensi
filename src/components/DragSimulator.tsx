import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, RotateCcw, Sparkles } from 'lucide-react';
import {
  type DragSimulationResult,
  type SensitivityConfig,
  simulateDragHeadshot,
} from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';

interface DragSimulatorProps {
  config: SensitivityConfig;
}

function liftScoreToBottomPct(res: DragSimulationResult): number {
  if (res.outcome === 'HEADSHOT') {
    const normalized = (res.liftScore - 72) / 32;
    return Math.round(77 + normalized * 8);
  }
  if (res.outcome === 'BODY_UNDERSHOOT') {
    const normalized = Math.min(1, Math.max(0, res.liftScore / 72));
    return Math.round(40 + normalized * 24);
  }
  return 94;
}

export const DragSimulator: React.FC<DragSimulatorProps> = ({ config }) => {
  const startPoint = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const [lastSample, setLastSample] = useState({
    distancePx: 86,
    durationMs: 95,
    dxPx: 6,
  });
  const [shotCount, setShotCount] = useState(0);
  const [headshotCount, setHeadshotCount] = useState(0);

  const lastResult = simulateDragHeadshot({
    dragDistancePx: lastSample.distancePx,
    dragDurationMs: lastSample.durationMs,
    dragDxPx: lastSample.dxPx,
    general: config.general,
    redDot: config.redDot,
    cap: config.cap,
    dpi: config.dpi,
    fireButtonSize: config.fireButtonSize,
    dragPredictionPct: config.dragPredictionPct,
    yDragScale: config.yDragScale,
    recoilDampeningPct: config.recoilDampeningPct,
  });

  const [crosshairLiftPct, setCrosshairLiftPct] = useState(() =>
    liftScoreToBottomPct(lastResult)
  );

  useEffect(() => {
    if (!dragging) {
      setCrosshairLiftPct(liftScoreToBottomPct(lastResult));
    }
  }, [dragging, lastResult.liftScore, lastResult.outcome]);

  const commitDrag = (distancePx: number, durationMs: number, dxPx = 6) => {
    setLastSample({ distancePx, durationMs, dxPx });
    const res = simulateDragHeadshot({
      dragDistancePx: distancePx,
      dragDurationMs: durationMs,
      dragDxPx: dxPx,
      general: config.general,
      redDot: config.redDot,
      cap: config.cap,
      dpi: config.dpi,
      fireButtonSize: config.fireButtonSize,
      dragPredictionPct: config.dragPredictionPct,
      yDragScale: config.yDragScale,
      recoilDampeningPct: config.recoilDampeningPct,
    });
    triggerHaptic(res.outcome === 'HEADSHOT' ? 'success' : 'impact');
    setShotCount((c) => c + 1);
    if (res.outcome === 'HEADSHOT') {
      setHeadshotCount((h) => h + 1);
    }
    setCrosshairLiftPct(liftScoreToBottomPct(res));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHaptic('detent');
    startPoint.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
    setDragging(true);
    setCrosshairLiftPct(44);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !startPoint.current) return;
    const dy = Math.max(0, startPoint.current.y - e.clientY);
    const previewLift = Math.min(94, 44 + dy * 0.42);
    setCrosshairLiftPct(Math.round(previewLift));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !startPoint.current) return;
    setDragging(false);
    const dy = Math.max(10, startPoint.current.y - e.clientY);
    const dx = Math.abs(e.clientX - startPoint.current.x);
    const dt = Math.max(30, performance.now() - startPoint.current.time);
    startPoint.current = null;
    commitDrag(dy, dt, dx);
  };

  const runCalibrationTest = () => {
    commitDrag(86, 95, 5);
  };

  const resetStats = () => {
    triggerHaptic('impact');
    setShotCount(0);
    setHeadshotCount(0);
    setLastSample({ distancePx: 86, durationMs: 95, dxPx: 6 });
  };

  const hsRate =
    shotCount > 0 ? Math.round((headshotCount / shotCount) * 100) : 0;

  const outcomeTone =
    lastResult.outcome === 'HEADSHOT'
      ? 'text-[#22C55E]'
      : lastResult.outcome === 'OVERSHOOT'
        ? 'text-[#EF4444]'
        : 'text-[#F59E0B]';

  const outcomeLabel =
    lastResult.outcome === 'HEADSHOT'
      ? 'HEADSHOT LOCK'
      : lastResult.outcome === 'OVERSHOOT'
        ? 'OVERSHOOT (PAST HEAD)'
        : 'BODY UNDERSHOOT';

  const fireOffsetPx = Math.round(((config.fireButtonYOffset ?? 18) - 10) * 0.8 + 10);

  return (
    <section
      aria-labelledby="drag-sim-heading"
      className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="drag-sim-heading" className="text-base font-bold text-white">
            Tactical Drag Arena
          </h2>
          <p className="text-xs text-[#9A9AA6] mt-0.5">
            Swipe upward from the trigger button to test live headshot physics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runCalibrationTest}
            className="ff-btn-sheen min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-medium text-white hover:border-[#EF4444]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
            Test Drag
          </button>
          <button
            type="button"
            aria-label="Reset drag statistics"
            onClick={resetStats}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#13131A] border border-[#2A2A34] text-[#9A9AA6] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Arena Top Physics Telemetry Strip */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-[#060609] border border-[#23232B] py-2 px-1">
          <div className="text-[10px] text-[#9A9AA6]">Est. Damage</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-[#EF4444]">
            {lastResult.estimatedDamage}
          </div>
        </div>
        <div className="rounded-xl bg-[#060609] border border-[#23232B] py-2 px-1">
          <div className="text-[10px] text-[#9A9AA6]">Headshots</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
            {headshotCount}
          </div>
        </div>
        <div className="rounded-xl bg-[#060609] border border-[#23232B] py-2 px-1">
          <div className="text-[10px] text-[#9A9AA6]">Drag Speed</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
            {lastResult.speedPxPerMs} <span className="text-[10px] text-[#9A9AA6]">px/ms</span>
          </div>
        </div>
        <div className="rounded-xl bg-[#060609] border border-[#23232B] py-2 px-1">
          <div className="text-[10px] text-[#9A9AA6]">Elevation</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
            +{lastResult.elevationDeg}°
          </div>
        </div>
      </div>

      {/* Interactive Touch / Pointer Pad */}
      <div
        data-testid="drag-calibration-pad"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="mt-3 relative h-64 rounded-xl bg-[#060609] border border-[#23232B] overflow-hidden select-none touch-none cursor-ns-resize"
      >
        {/* Subtle Center Aim Rail */}
        <div
          aria-hidden="true"
          className="absolute inset-y-6 left-1/2 -translate-x-1/2 w-px bg-gradient-to-t from-[#EF4444]/65 via-white/25 to-transparent pointer-events-none"
        />

        {/* Target Silhouette Reference */}
        <div className="absolute inset-x-0 top-5 flex flex-col items-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {lastResult.outcome === 'HEADSHOT' && (
              <span
                aria-hidden="true"
                className="ff-shockwave absolute -inset-1.5 rounded-full border border-[#22C55E]/70"
              />
            )}
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
                lastResult.outcome === 'HEADSHOT'
                  ? 'border-[#22C55E] bg-[#22C55E]/15 ff-headlock-pulse'
                  : 'border-[#EF4444]/75 bg-[#EF4444]/10'
              }`}
            >
              <span className="text-[10px] font-mono-num font-bold text-white">
                HEAD
              </span>
            </div>
          </div>
          <div className="mt-1.5 w-16 h-24 rounded-t-xl border border-[#2A2A34] bg-[#101016]/90 flex items-center justify-center">
            <span className="text-[10px] font-mono-num text-[#7E7E8A]">
              CHEST
            </span>
          </div>
        </div>

        {/* Animated Crosshair Indicator */}
        <div
          style={{ bottom: `${crosshairLiftPct}%` }}
          className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none transition-[bottom] duration-150 ease-out"
        >
          <Crosshair
            className={`w-7 h-7 ${
              lastResult.outcome === 'HEADSHOT'
                ? 'text-[#22C55E]'
                : lastResult.outcome === 'OVERSHOOT'
                  ? 'text-[#EF4444]'
                  : 'text-[#F59E0B]'
            }`}
          />
        </div>

        {/* Fire Button Trigger Zone */}
        <div
          style={{ bottom: `${fireOffsetPx}px` }}
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center"
        >
          <div
            style={{
              width: `${Math.max(44, config.fireButtonSize * 1.15)}px`,
              height: `${Math.max(44, config.fireButtonSize * 1.15)}px`,
            }}
            className={`rounded-full border-2 flex items-center justify-center transition-colors ${
              dragging
                ? 'border-[#EF4444] bg-[#EF4444]/25'
                : 'border-white/40 bg-[#13131A]/95'
            }`}
          >
            <span className="text-[10px] font-mono-num font-semibold text-white">
              {config.fireButtonSize}%
            </span>
          </div>
          <span className="mt-1 text-[11px] text-[#9A9AA6]">
            Hold &amp; swipe upward
          </span>
        </div>
      </div>

      {/* Diagnostic Telemetry Readout */}
      <div className="mt-4 pt-4 border-t border-[#23232B] grid grid-cols-3 gap-3 text-left">
        <div>
          <div className="text-xs text-[#9A9AA6]">Shot Result</div>
          <div
            data-testid="drag-outcome"
            className={`mt-0.5 text-xs font-bold font-mono-num ${outcomeTone}`}
          >
            {outcomeLabel}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#9A9AA6]">Headbox Accuracy</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
            {lastResult.headboxAccuracy}%
          </div>
        </div>
        <div>
          <div className="text-xs text-[#9A9AA6]">Session HS Rate</div>
          <div className="mt-0.5 text-sm font-bold font-mono-num text-white">
            {shotCount > 0 ? `${hsRate}% (${headshotCount}/${shotCount})` : 'Ready'}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#C4C4CF] leading-relaxed">
        {lastResult.recommendation}
      </p>
    </section>
  );
};
