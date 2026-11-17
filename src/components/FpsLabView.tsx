import React, { useEffect, useRef } from 'react';
import { Activity, CheckCircle2, Gauge, Lock, RefreshCw } from 'lucide-react';
import type { HardwareTelemetry } from '../hooks/useDeviceTelemetry';
import {
  type PlatformTarget,
  classifyDeviceTier,
  evaluateFpsOptions,
} from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';

interface FpsLabViewProps {
  telemetry: HardwareTelemetry;
  platform: PlatformTarget;
  targetFps: 60 | 90 | 120 | 144;
  lowEndBoostActive: boolean;
  onSelectFps: (fps: 60 | 90 | 120 | 144) => void;
  onProbeHz: () => void;
}

export const FpsLabView: React.FC<FpsLabViewProps> = ({
  telemetry,
  platform,
  targetFps,
  lowEndBoostActive,
  onSelectFps,
  onProbeHz,
}) => {
  const tier = classifyDeviceTier({
    ramGb: telemetry.ramGb,
    cores: telemetry.cores,
    refreshHz: telemetry.measuredHz,
    forcedLowEnd: lowEndBoostActive,
  });

  const options = evaluateFpsOptions({
    ramGb: telemetry.ramGb,
    cores: telemetry.cores,
    refreshHz: telemetry.measuredHz,
    forcedLowEnd: lowEndBoostActive,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const start = performance.now();
    let lastTargetUpdate = 0;
    let lastBaseUpdate = 0;
    let targetX = 0;
    let baseX = 0;

    const drawFrame = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const elapsedSec = (now - start) / 1000;
      const speedPx = 220;

      if (prefersReduced) {
        targetX = w * 0.45;
        baseX = w * 0.45;
      } else {
        const targetStepMs = 1000 / targetFps;
        if (now - lastTargetUpdate >= targetStepMs) {
          targetX = (elapsedSec * speedPx) % (w - 32);
          lastTargetUpdate = now;
        }
        const baseStepMs = 1000 / 60;
        if (now - lastBaseUpdate >= baseStepMs) {
          baseX = (elapsedSec * speedPx) % (w - 32);
          lastBaseUpdate = now;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#060609';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#23232B';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(`TARGET ${targetFps} FPS`, 12, 20);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.roundRect(16 + targetX, 30, 22, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#9A9AA6';
      ctx.fillText('BASELINE 60 FPS', 12, h / 2 + 20);
      ctx.fillStyle = '#52525E';
      ctx.beginPath();
      ctx.roundRect(16 + baseX, h / 2 + 30, 22, 16, 4);
      ctx.fill();

      if (!prefersReduced) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, [targetFps]);

  const tierLabel =
    tier === 'high' ? 'High Tier' : tier === 'mid' ? 'Mid Tier' : 'Low-End Tier';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            FPS Unlock &amp; Refresh Rate Profiler
          </h1>
          <p className="mt-1 text-sm text-[#9A9AA6]">
            {telemetry.deviceLabel} · {telemetry.ramGb} GB RAM · {telemetry.cores} Cores ·{' '}
            {tierLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('action');
            onProbeHz();
          }}
          disabled={telemetry.isProbingHz}
          className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] disabled:opacity-60 transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#EF4444] ${
              telemetry.isProbingHz ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          {telemetry.isProbingHz ? 'Measuring Hz...' : 'Measure Display Hz'}
        </button>
      </div>

      {/* Hardware Telemetry Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
          <div className="text-xs text-[#9A9AA6]">Detected Panel Rate</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-[#EF4444]">
            {telemetry.measuredHz} Hz
          </div>
        </div>
        <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
          <div className="text-xs text-[#9A9AA6]">Frame Time Avg</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-white">
            {telemetry.avgFrameMs} ms
          </div>
        </div>
        <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
          <div className="text-xs text-[#9A9AA6]">Frame Jitter</div>
          <div className="mt-1 text-2xl font-bold font-mono-num text-white">
            {telemetry.jitterMs} ms
          </div>
        </div>
        <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
          <div className="text-xs text-[#9A9AA6]">Active Target</div>
          <div
            data-testid="active-fps-readout"
            className={`mt-1 text-2xl font-bold font-mono-num ${
              targetFps <= telemetry.measuredHz ? 'text-[#22C55E]' : 'text-[#F59E0B]'
            }`}
          >
            {targetFps} FPS
          </div>
        </div>
      </div>

      {/* 60 / 90 / 120 / 144 FPS Selection Grid */}
      <section aria-labelledby="fps-targets-heading" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <h2 id="fps-targets-heading" className="text-base font-bold text-white">
            Select Target Frame Rate
          </h2>
          <span className="text-xs text-[#9A9AA6]">
            Hardware-validated options · Override warning shown on capped panels
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {options.map((opt) => {
            const isSelected = targetFps === opt.fps;
            return (
              <button
                key={opt.fps}
                type="button"
                onClick={() => {
                  triggerHaptic(opt.supported ? 'selection' : 'warning');
                  onSelectFps(opt.fps);
                }}
                className={`text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#170A0D] border-[#EF4444] shadow-[0_0_24px_rgba(239,68,68,0.14)]'
                    : 'bg-[#0B0B0F] border-[#23232B] hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-extrabold font-mono-num text-white">
                    {opt.fps} FPS
                  </span>
                  {opt.supported ? (
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#EF4444]' : 'text-[#22C55E]'
                      }`}
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock className="w-4 h-4 text-[#9A9AA6]" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-2 text-xs font-medium text-[#C4C4CF]">
                  {opt.supported
                    ? opt.recommended
                      ? 'Recommended for this display'
                      : 'Supported by hardware'
                    : 'Panel / Tier Capped'}
                </div>
                <p className="mt-2 text-xs text-[#9A9AA6] leading-relaxed">
                  {opt.reason}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Motion Cadence Comparison + OS Sync Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-labelledby="motion-preview-heading"
          className="lg:col-span-6 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
            <h2
              id="motion-preview-heading"
              className="text-base font-bold text-white"
            >
              Frame Pacing Motion Preview
            </h2>
          </div>
          <canvas
            ref={canvasRef}
            width={520}
            height={120}
            className="w-full h-[120px] rounded-xl border border-[#23232B]"
          />
          <p className="mt-3 text-xs text-[#9A9AA6] leading-relaxed">
            Both Free Fire&apos;s in-game High FPS setting and your phone&apos;s display
            refresh rate must match. An external app cannot force frames past your
            screen&apos;s hardware refresh ceiling ({telemetry.measuredHz} Hz).
          </p>
        </section>

        <section
          aria-labelledby="os-sync-heading"
          className="lg:col-span-6 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
            <h2 id="os-sync-heading" className="text-base font-bold text-white">
              {platform === 'android' ? 'Android' : 'iOS'} {targetFps} FPS Sync Steps
            </h2>
          </div>
          {platform === 'android' ? (
            <ol className="space-y-2.5 text-xs text-[#C4C4CF] leading-relaxed">
              <li>
                1. Open <strong className="text-white">Settings → Display → Motion Smoothness</strong>{' '}
                and lock Refresh Rate to <strong className="text-[#EF4444]">{Math.min(targetFps, 144)}Hz</strong> (or High).
              </li>
              <li>
                2. In <strong className="text-white">Game Turbo / Game Space</strong>, set Free Fire Performance Mode to{' '}
                <strong className="text-white">Pro / Max FPS</strong> and disable thermal frame-cap if available.
              </li>
              <li>
                3. Open <strong className="text-white">Free Fire → Settings → Display → High FPS</strong> and select{' '}
                <strong className="text-[#EF4444]">High</strong> (90/120Hz builds unlock automatically on whitelisted SoCs).
              </li>
            </ol>
          ) : (
            <ol className="space-y-2.5 text-xs text-[#C8C2CC] leading-relaxed">
              <li>
                1. On iPhone ProMotion models (13 Pro – 16 Pro), open{' '}
                <strong className="text-white">Settings → Accessibility → Motion</strong> and ensure{' '}
                <strong className="text-[#EF4444]">Limit Frame Rate is OFF</strong>.
              </li>
              <li>
                2. Turn <strong className="text-white">Low Power Mode OFF</strong> before launching Free Fire (Low Power Mode locks iOS to 60Hz).
              </li>
              <li>
                3. Open <strong className="text-white">Free Fire → Settings → Display → High FPS</strong> and switch to{' '}
                <strong className="text-[#EF4444]">High</strong>.
              </li>
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};
