import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Cpu,
  Crosshair,
  Gauge,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react';
import type { HardwareTelemetry } from '../hooks/useDeviceTelemetry';
import {
  type PlatformTarget,
  type SensitivityConfig,
  classifyDeviceTier,
  computeBoostReadiness,
  computeDragPhysicsRatio,
} from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';
import type { GameEdition } from '../lib/gameLauncher';
import { DeveloperContactCard } from './DeveloperContactCard';
import { GameLauncherCard } from './GameLauncherCard';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';

export type HubChannel = 'fps' | 'frametime' | 'ping';

interface CommandHubViewProps {
  telemetry: HardwareTelemetry;
  platform: PlatformTarget;
  activeConfig: SensitivityConfig;
  targetFps: 60 | 90 | 120 | 144;
  lowEndBoostActive: boolean;
  smoothGraphics: boolean;
  checkedIds: string[];
  presetsCount: number;
  gameEdition: GameEdition;
  autoLaunchOnApply: boolean;
  onEditionChange: (edition: GameEdition) => void;
  onToggleAutoLaunch: () => void;
  onLaunchGame: () => void;
  onNavigateTab: (tab: 'sensitivity' | 'aim' | 'hub' | 'optimize' | 'tools' | 'vault') => void;
}

interface BatteryNavigator extends Navigator {
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
}

export const CommandHubView: React.FC<CommandHubViewProps> = ({
  telemetry,
  platform,
  activeConfig,
  targetFps,
  lowEndBoostActive,
  smoothGraphics,
  checkedIds,
  presetsCount,
  gameEdition,
  autoLaunchOnApply,
  onEditionChange,
  onToggleAutoLaunch,
  onLaunchGame,
  onNavigateTab,
}) => {
  const [channel, setChannel] = useState<HubChannel>('fps');
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [livePingMs, setLivePingMs] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fpsSeriesRef = useRef<number[]>(Array(32).fill(telemetry.measuredHz));
  const frameTimeSeriesRef = useRef<number[]>(
    Array(32).fill(telemetry.avgFrameMs || 16.7)
  );
  const pingSeriesRef = useRef<number[]>(Array(24).fill(12));

  useEffect(() => {
    const nav = navigator as BatteryNavigator;
    if (typeof nav.getBattery === 'function') {
      nav
        .getBattery()
        .then((bat) => {
          setBatteryPct(Math.round(bat.level * 100));
        })
        .catch(() => {
          setBatteryPct(null);
        });
    }
  }, []);

  // Sample real frame pacing or lightweight server ping for the live oscilloscope
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastNow = performance.now();
    let sampleAccum = 0;
    let smoothedDt = telemetry.avgFrameMs || 16.7;

    const drawChart = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const data =
        channel === 'fps'
          ? fpsSeriesRef.current
          : channel === 'frametime'
            ? frameTimeSeriesRef.current
            : pingSeriesRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#060609';
      ctx.fillRect(0, 0, w, h);

      // Hairline horizontal reference grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const y = Math.round((h / 4) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (data.length < 2) return;

      const minVal =
        channel === 'fps' ? 20 : 0;
      const maxVal =
        channel === 'fps'
          ? Math.max(155, telemetry.measuredHz + 25)
          : channel === 'frametime'
            ? Math.max(52, Math.max(...data) + 10)
            : Math.max(60, Math.max(...data) + 15);

      const stepX = w / Math.max(1, data.length - 1);

      const points = data.map((val, idx) => {
        const norm = Math.min(1, Math.max(0, (val - minVal) / (maxVal - minVal)));
        return {
          x: idx * stepX,
          y: h - 16 - norm * (h - 32),
        };
      });

      const traceSmoothCurve = () => {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
      };

      // Soft crimson gradient fill beneath waveform
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, h);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Primary white-to-red waveform stroke
      ctx.strokeStyle = channel === 'ping' ? '#FFFFFF' : '#EF4444';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      traceSmoothCurve();
      ctx.stroke();

      // Latest sample point highlight
      const lastPt = points[points.length - 1];
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now: number) => {
      const rawDt = Math.min(48, Math.max(6, now - lastNow));
      lastNow = now;
      smoothedDt = smoothedDt * 0.72 + rawDt * 0.28;
      sampleAccum += rawDt;

      if (sampleAccum >= 110) {
        sampleAccum = 0;
        const instantFps = Math.min(165, Math.max(24, Math.round(1000 / smoothedDt)));
        fpsSeriesRef.current = [...fpsSeriesRef.current.slice(1), instantFps];
        frameTimeSeriesRef.current = [
          ...frameTimeSeriesRef.current.slice(1),
          Number(smoothedDt.toFixed(1)),
        ];
        drawChart();
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(tick);
      }
    };

    drawChart();
    if (!prefersReduced) {
      rafId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafId);
  }, [channel, telemetry.measuredHz, telemetry.avgFrameMs]);

  // Real lightweight HTTP RTT probe every 2.2s when viewing Hub
  useEffect(() => {
    let active = true;
    const probe = async () => {
      try {
        const t0 = performance.now();
        const res = await fetch(`/api/speedtest/ping?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!active || !res.ok) return;
        const rtt = Math.max(1, Math.round(performance.now() - t0));
        setLivePingMs(rtt);
        pingSeriesRef.current = [...pingSeriesRef.current.slice(1), rtt];
      } catch {
        // Offline
      }
    };
    void probe();
    const timer = window.setInterval(() => {
      void probe();
    }, 2400);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

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

  const xyRatio = computeDragPhysicsRatio(
    activeConfig.xAxisScale,
    activeConfig.yDragScale
  );

  const governors = [
    {
      id: 'drag-physics',
      icon: Crosshair,
      title: 'X/Y Drag Headshot Curve',
      detail: `${activeConfig.name} · Y/X ${xyRatio}:1 · General ${activeConfig.general}`,
      status: 'READY',
      tone: 'text-[#22C55E]',
      tab: 'sensitivity' as const,
    },
    {
      id: 'fps-pipeline',
      icon: Gauge,
      title: `${targetFps}Hz Frame Sync Pipeline`,
      detail: `Measured panel ceiling ${telemetry.measuredHz}Hz · ${telemetry.avgFrameMs}ms avg frame`,
      status: targetFps <= telemetry.measuredHz ? 'SYNCED' : 'CAPPED',
      tone: targetFps <= telemetry.measuredHz ? 'text-[#22C55E]' : 'text-[#F59E0B]',
      tab: 'optimize' as const,
    },
    {
      id: 'boost-engine',
      icon: Zap,
      title: 'Low-End Stability Engine',
      detail: `${readiness.score}% readiness · ${smoothGraphics ? 'Smooth GFX Active' : 'Standard GFX'}`,
      status: lowEndBoostActive ? 'BOOST ON' : 'STANDBY',
      tone: lowEndBoostActive ? 'text-[#EF4444]' : 'text-[#C4C4CF]',
      tab: 'optimize' as const,
    },
    {
      id: 'network-edge',
      icon: Wifi,
      title: 'Network & DNS Analyzer',
      detail: livePingMs !== null ? `Local edge RTT ${livePingMs} ms · Bandwidth tester ready` : 'Offline cached profile mode',
      status: livePingMs !== null ? `${livePingMs} MS` : 'OFFLINE',
      tone: 'text-white',
      tab: 'tools' as const,
    },
    {
      id: 'tamper-guard',
      icon: ShieldCheck,
      title: 'HMAC-SHA256 Tamper Shield',
      detail: `${presetsCount} server-signed presets · Zero game memory injection`,
      status: 'ACTIVE',
      tone: 'text-[#22C55E]',
      tab: 'vault' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hardware Identity Summary Strip */}
      <section
        aria-labelledby="hub-device-heading"
        className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#160A0D] border border-[#EF4444]/40 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-[#EF4444]" aria-hidden="true" />
            </div>
            <div>
              <h1
                id="hub-device-heading"
                className="text-xl sm:text-2xl font-bold tracking-tight text-white"
              >
                {telemetry.deviceLabel}
              </h1>
              <p className="mt-1 text-xs text-[#9A9AA6] font-mono-num">
                {platform === 'ios' ? 'iOS Target' : 'Android Target'} · {telemetry.ramGb} GB RAM ·{' '}
                {telemetry.cores} Cores · {telemetry.screenRes} · {telemetry.measuredHz}Hz
                {batteryPct !== null ? ` · Battery ${batteryPct}%` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-xs font-mono-num font-bold text-[#22C55E]">
              {readiness.label.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('action');
                onNavigateTab('sensitivity');
              }}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] transition-colors whitespace-nowrap cursor-pointer"
            >
              Open Sensi Lab
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Telemetry Oscilloscope + 4 KPI Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-labelledby="telemetry-wave-heading"
          className="lg:col-span-7 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6 flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
              <h2
                id="telemetry-wave-heading"
                className="text-base font-bold text-white"
              >
                Live Session Telemetry
              </h2>
            </div>

            <SlidingSegmentedControl<HubChannel>
              ariaLabel="Telemetry oscilloscope channel"
              variant="crimson"
              buttonClassName="min-h-[32px] px-3 py-1"
              value={channel}
              onChange={setChannel}
              options={[
                { id: 'fps', label: 'FPS Pacing' },
                { id: 'frametime', label: 'Frame ms' },
                { id: 'ping', label: 'Edge Ping' },
              ]}
            />
          </div>

          <canvas
            ref={canvasRef}
            data-testid="hub-telemetry-canvas"
            width={640}
            height={176}
            className="w-full h-[176px] rounded-xl border border-[#23232B]"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-num text-[#9A9AA6]">
            <span>
              {channel === 'fps'
                ? `${targetFps} FPS Target · ${telemetry.measuredHz}Hz Panel`
                : channel === 'frametime'
                  ? `Avg ${telemetry.avgFrameMs} ms · Jitter ${telemetry.jitterMs} ms`
                  : `Live Server Ping: ${livePingMs !== null ? `${livePingMs} ms` : 'Measuring...'}`}
            </span>
            <span className="text-white">
              {telemetry.touchCapable ? 'Touch Digitizer Active' : 'Pointer Input Active'}
            </span>
          </div>
        </section>

        {/* Right 2x2 Live Telemetry KPIs */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 flex flex-col justify-between">
            <div className="text-xs text-[#9A9AA6]">Target Frame Rate</div>
            <div className="mt-2 text-3xl font-extrabold font-mono-num text-white">
              {targetFps} <span className="text-sm font-semibold text-[#9A9AA6]">FPS</span>
            </div>
            <div className="mt-2 text-xs font-mono-num text-[#EF4444]">
              Panel {telemetry.measuredHz}Hz Detected
            </div>
          </div>

          <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 flex flex-col justify-between">
            <div className="text-xs text-[#9A9AA6]">Edge Latency</div>
            <div className="mt-2 text-3xl font-extrabold font-mono-num text-white">
              {livePingMs !== null ? livePingMs : '—'}{' '}
              <span className="text-sm font-semibold text-[#9A9AA6]">ms</span>
            </div>
            <div className="mt-2 text-xs font-mono-num text-[#22C55E]">
              {livePingMs !== null && livePingMs < 40 ? 'Low Jitter Route' : 'Live Probe Active'}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 flex flex-col justify-between">
            <div className="text-xs text-[#9A9AA6]">Drag Y/X Ratio</div>
            <div className="mt-2 text-3xl font-extrabold font-mono-num text-[#EF4444]">
              {xyRatio}
              <span className="text-sm font-semibold text-white">:1</span>
            </div>
            <div className="mt-2 text-xs font-mono-num text-[#C4C4CF]">
              {activeConfig.cap}-Cap · DPI {activeConfig.dpi}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 flex flex-col justify-between">
            <div className="text-xs text-[#9A9AA6]">Boost Readiness</div>
            <div className="mt-2 text-3xl font-extrabold font-mono-num text-white">
              {readiness.score}
              <span className="text-sm font-semibold text-[#9A9AA6]">%</span>
            </div>
            <div className="mt-2 text-xs font-mono-num text-[#C4C4CF]">
              {lowEndBoostActive ? 'Low-End Guard ON' : 'Standard Tier'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Governors & Optimization Modules List */}
      <section
        aria-labelledby="hub-engines-heading"
        className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id="hub-engines-heading" className="text-base font-bold text-white">
            Active Engines &amp; Calibration Status
          </h2>
          <span className="text-xs font-mono-num text-[#9A9AA6]">
            Tap any module to adjust
          </span>
        </div>

        <div className="divide-y divide-[#23232B]">
          {governors.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onNavigateTab(g.tab);
                }}
                className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#060609] border border-[#23232B] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {g.title}
                    </div>
                    <div className="text-xs text-[#9A9AA6] truncate">{g.detail}</div>
                  </div>
                </div>
                <span className={`text-xs font-mono-num font-bold shrink-0 ${g.tone}`}>
                  {g.status}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <GameLauncherCard
        edition={gameEdition}
        onEditionChange={onEditionChange}
        autoLaunchOnApply={autoLaunchOnApply}
        onToggleAutoLaunch={onToggleAutoLaunch}
        platform={platform}
        activeConfig={activeConfig}
        targetFps={targetFps}
        onLaunchTriggered={onLaunchGame}
      />

      <DeveloperContactCard />
    </div>
  );
};
