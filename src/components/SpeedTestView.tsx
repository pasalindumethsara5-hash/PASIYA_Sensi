import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wifi,
} from 'lucide-react';
import {
  type SpeedTestRecord,
  calculateMbps,
  computePingStats,
  evaluateFreeFireNetwork,
  speedMbpsToGaugeRatio,
} from '../lib/speedtest';
import type { PlatformTarget } from '../lib/optimizer';
import { triggerHaptic } from '../lib/haptics';
import { safeSetStorage } from '../lib/clipboard';

interface SpeedTestViewProps {
  platform: PlatformTarget;
}

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'error';

const HISTORY_KEY = 'pasiya_speed_history_v1';
const GAUGE_STOPS = [0, 5, 10, 25, 50, 100, 250, 500, 1000];

function readHistory(): SpeedTestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SpeedTestRecord[]) : [];
  } catch {
    return [];
  }
}

export const SpeedTestView: React.FC<SpeedTestViewProps> = ({ platform }) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [jitterMs, setJitterMs] = useState<number | null>(null);
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null);
  const [uploadMbps, setUploadMbps] = useState<number | null>(null);
  const [liveGaugeMbps, setLiveGaugeMbps] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<SpeedTestRecord[]>(readHistory);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    safeSetStorage(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isRunning =
    phase === 'ping' || phase === 'download' || phase === 'upload';

  const stopTest = () => {
    triggerHaptic('impact');
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('idle');
    setLiveGaugeMbps(0);
  };

  const runSpeedTest = async () => {
    triggerHaptic('action');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setErrorMsg(null);
    setPingMs(null);
    setJitterMs(null);
    setDownloadMbps(null);
    setUploadMbps(null);
    setLiveGaugeMbps(0);

    try {
      // 1. Ping & Jitter Phase (6 samples)
      setPhase('ping');
      const samples: number[] = [];
      for (let i = 0; i < 6; i++) {
        if (signal.aborted) return;
        const t0 = performance.now();
        const res = await fetch(`/api/speedtest/ping?t=${Date.now()}-${i}`, {
          cache: 'no-store',
          signal,
        });
        if (!res.ok) throw new Error('Ping endpoint unavailable');
        await res.json();
        samples.push(performance.now() - t0);
        const partial = computePingStats(samples);
        setPingMs(partial.pingMs);
        setJitterMs(partial.jitterMs);
      }
      const finalPing = computePingStats(samples);
      setPingMs(finalPing.pingMs);
      setJitterMs(finalPing.jitterMs);

      // 2. Download Throughput Phase (2 passes streamed for live gauge needle)
      setPhase('download');
      const dlSizes = [1_048_576, 2_097_152];
      let totalDlBytes = 0;
      const dlStart = performance.now();

      for (const size of dlSizes) {
        if (signal.aborted) return;
        const res = await fetch(
          `/api/speedtest/download?bytes=${size}&t=${Date.now()}`,
          { cache: 'no-store', signal }
        );
        if (!res.ok) throw new Error('Download stream failed');

        if (res.body) {
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalDlBytes += value.byteLength;
              const live = calculateMbps(totalDlBytes, performance.now() - dlStart);
              setLiveGaugeMbps(live);
              setDownloadMbps(live);
            }
          }
        } else {
          const buf = await res.arrayBuffer();
          totalDlBytes += buf.byteLength;
          const live = calculateMbps(totalDlBytes, performance.now() - dlStart);
          setLiveGaugeMbps(live);
          setDownloadMbps(live);
        }
      }
      const finalDl = calculateMbps(totalDlBytes, performance.now() - dlStart);
      setDownloadMbps(finalDl);

      // 3. Upload Throughput Phase (2 passes x 512KB raw binary)
      setPhase('upload');
      setLiveGaugeMbps(0);
      const uploadBytes = 524_288;
      const uploadPayload = new Uint8Array(uploadBytes);
      for (let i = 0; i < uploadPayload.length; i += 4) {
        uploadPayload[i] = (i * 31) & 0xff;
      }

      let totalUlBytes = 0;
      const ulStart = performance.now();

      for (let pass = 0; pass < 2; pass++) {
        if (signal.aborted) return;
        const res = await fetch(`/api/speedtest/upload?t=${Date.now()}-${pass}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: uploadPayload,
          cache: 'no-store',
          signal,
        });
        if (!res.ok) throw new Error('Upload stream failed');
        await res.json();
        totalUlBytes += uploadBytes;
        const liveUl = calculateMbps(totalUlBytes, performance.now() - ulStart);
        setLiveGaugeMbps(liveUl);
        setUploadMbps(liveUl);
      }

      const finalUl = calculateMbps(totalUlBytes, performance.now() - ulStart);
      setUploadMbps(finalUl);
      setLiveGaugeMbps(finalDl);
      setPhase('complete');

      const evaluation = evaluateFreeFireNetwork(
        finalPing.pingMs,
        finalPing.jitterMs,
        finalDl
      );

      const entry: SpeedTestRecord = {
        id: `spd-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        pingMs: finalPing.pingMs,
        jitterMs: finalPing.jitterMs,
        downloadMbps: finalDl,
        uploadMbps: finalUl,
        tier: evaluation.tier,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 6));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setPhase('error');
      setErrorMsg(
        err instanceof Error
          ? `${err.message}. Check your connection and retry.`
          : 'Network test failed.'
      );
    }
  };

  // Ookla-style 270° Arc Geometry (start 135°, sweep 270°)
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270°
  const ratio = speedMbpsToGaugeRatio(liveGaugeMbps);
  const dashOffset = arcLength * (1 - ratio);
  const needleAngleDeg = -135 + ratio * 270;

  const evalState =
    pingMs !== null && downloadMbps !== null
      ? evaluateFreeFireNetwork(pingMs, jitterMs ?? 0, downloadMbps)
      : null;

  const phaseHeadline =
    phase === 'ping'
      ? 'Measuring Latency & Jitter'
      : phase === 'download'
        ? 'Testing Download Speed'
        : phase === 'upload'
          ? 'Testing Upload Speed'
          : phase === 'complete'
            ? 'Speed Test Complete'
            : phase === 'error'
              ? 'Connection Interrupted'
              : 'Ready to Test';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Internet Speed &amp; Ping Test
          </h1>
          <p className="mt-1 text-sm text-[#9A9AA6]">
            Ookla-style live throughput &amp; Free Fire latency analyzer · {platform === 'android' ? 'Android' : 'iOS'} Network Tuning
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-num text-[#C4C4CF]">
          <Wifi className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
          <span>PASIYA Edge Node · HTTP Stream</span>
        </div>
      </div>

      {/* Main Ookla-Inspired Gauge + Live Telemetry Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Circular Speedometer Gauge & GO Trigger */}
        <section
          aria-labelledby="speed-gauge-heading"
          className="lg:col-span-6 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-6 flex flex-col items-center justify-between"
        >
          <div className="w-full flex items-center justify-between gap-3">
            <h2 id="speed-gauge-heading" className="text-base font-bold text-white">
              Live Speedometer
            </h2>
            <span
              data-testid="speedtest-phase"
              className="text-xs font-mono-num text-[#EF4444]"
            >
              {phaseHeadline}
            </span>
          </div>

          <div className="relative my-4 w-[280px] h-[280px] flex items-center justify-center">
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="ooklaRedWhiteArc" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="65%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>

              {/* Base Dark-Black Track Arc */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="#181820"
                strokeWidth="16"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(135 140 140)"
              />

              {/* Active Speed Progress Arc */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="url(#ooklaRedWhiteArc)"
                strokeWidth="16"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(135 140 140)"
                className="transition-[stroke-dashoffset] duration-150 ease-out"
              />

              {/* Calibrated Scale Labels */}
              {GAUGE_STOPS.map((stop, idx) => {
                const frac = idx / (GAUGE_STOPS.length - 1);
                const deg = 135 + frac * 270;
                const rad = (deg * Math.PI) / 180;
                const tx = 140 + Math.cos(rad) * 86;
                const ty = 140 + Math.sin(rad) * 86;
                return (
                  <text
                    key={stop}
                    x={tx}
                    y={ty + 3}
                    textAnchor="middle"
                    fill="#8A8A98"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '9.5px',
                      fontWeight: 600,
                    }}
                  >
                    {stop}
                  </text>
                );
              })}

              {/* Rotating Needle */}
              <g
                transform={`rotate(${needleAngleDeg} 140 140)`}
                className="transition-transform duration-150 ease-out"
              >
                <line
                  x1="140"
                  y1="140"
                  x2="140"
                  y2="46"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="140" cy="46" r="4" fill="#EF4444" />
                <circle cx="140" cy="140" r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.5" />
              </g>
            </svg>

            {/* Center Digital Value & GO Trigger */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none">
              <div
                data-testid="speedtest-live-mbps"
                className="text-3xl font-extrabold font-mono-num text-white leading-none"
              >
                {liveGaugeMbps > 0 ? liveGaugeMbps.toFixed(1) : '0.0'}
              </div>
              <div className="mt-1 text-[11px] font-mono-num text-[#9A9AA6]">
                Mbps
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-3">
            {!isRunning ? (
              <button
                type="button"
                data-testid="speedtest-go-btn"
                onClick={() => void runSpeedTest()}
                className="min-h-[48px] min-w-[160px] px-8 py-2.5 rounded-full bg-[#EF4444] border-2 border-white/25 text-white font-display text-base font-extrabold tracking-wider hover:bg-[#DC2626] transition-all cursor-pointer shadow-[0_0_28px_rgba(239,68,68,0.3)]"
              >
                {phase === 'complete' ? 'TEST AGAIN' : 'GO'}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopTest}
                className="min-h-[48px] min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#050507] text-sm font-bold hover:bg-[#E5E5EC] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#EF4444]" aria-hidden="true" />
                Stop Test
              </button>
            )}
          </div>

          {errorMsg && (
            <p role="alert" className="mt-3 text-xs text-[#EF4444] text-center">
              {errorMsg}
            </p>
          )}
        </section>

        {/* Right: 4-Metric Telemetry Grid + Free Fire Ping Evaluation */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
              <div className="flex items-center gap-2 text-xs text-[#9A9AA6]">
                <Activity className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                Ping Latency
              </div>
              <div
                data-testid="speedtest-ping"
                className="mt-1.5 text-2xl font-extrabold font-mono-num text-white"
              >
                {pingMs !== null ? `${pingMs} ms` : '—'}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
              <div className="text-xs text-[#9A9AA6]">Ping Jitter</div>
              <div
                data-testid="speedtest-jitter"
                className="mt-1.5 text-2xl font-extrabold font-mono-num text-white"
              >
                {jitterMs !== null ? `${jitterMs} ms` : '—'}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
              <div className="flex items-center gap-2 text-xs text-[#9A9AA6]">
                <ArrowDown className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
                Download
              </div>
              <div
                data-testid="speedtest-download"
                className="mt-1.5 text-2xl font-extrabold font-mono-num text-[#EF4444]"
              >
                {downloadMbps !== null ? `${downloadMbps.toFixed(1)} Mbps` : '—'}
              </div>
            </div>

            <div className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-4">
              <div className="flex items-center gap-2 text-xs text-[#9A9AA6]">
                <ArrowUp className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                Upload
              </div>
              <div
                data-testid="speedtest-upload"
                className="mt-1.5 text-2xl font-extrabold font-mono-num text-white"
              >
                {uploadMbps !== null ? `${uploadMbps.toFixed(1)} Mbps` : '—'}
              </div>
            </div>
          </div>

          {/* Free Fire Network Readiness Card */}
          <section
            aria-labelledby="ff-net-heading"
            className="flex-1 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 id="ff-net-heading" className="text-base font-bold text-white">
                  Free Fire Server Readiness
                </h2>
                {evalState && (
                  <span
                    className={`text-xs font-bold font-mono-num ${
                      evalState.tier === 'PRO'
                        ? 'text-[#22C55E]'
                        : evalState.tier === 'STABLE'
                          ? 'text-[#F59E0B]'
                          : 'text-[#EF4444]'
                    }`}
                  >
                    {evalState.label}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-[#C4C4CF] leading-relaxed">
                {evalState
                  ? evalState.recommendation
                  : 'Tap GO to measure real round-trip ping, jitter, download, and upload throughput before entering Ranked or Clash Squad.'}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#23232B] space-y-2 text-xs text-[#9A9AA6]">
              <div className="flex items-start gap-2">
                <ShieldCheck
                  className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  {platform === 'android'
                    ? 'Android Tip: Set Settings → Network → Private DNS to 1dot1dot1dot1.cloudflare-dns.com or dns.google to cut route spikes.'
                    : 'iOS Tip: Disable Wi-Fi Assist & Low Data Mode under Settings → Cellular so iPhone does not swap networks mid-match.'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Saved Speed History */}
      <section
        aria-labelledby="speed-history-heading"
        className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="speed-history-heading" className="text-base font-bold text-white">
            Recent Speed Results
          </h2>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('warning');
                setHistory([]);
              }}
              className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#13131A] border border-[#2A2A34] text-xs font-medium text-[#9A9AA6] hover:text-white cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-[#9A9AA6]">
            No recorded speed runs yet. Run a test above to log your ping and Mbps history.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#23232B] text-[#9A9AA6]">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Ping</th>
                  <th className="py-2 pr-4 font-medium">Jitter</th>
                  <th className="py-2 pr-4 font-medium">Download</th>
                  <th className="py-2 pr-4 font-medium">Upload</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232B] font-mono-num">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 text-[#C4C4CF]">{item.timestamp}</td>
                    <td className="py-2.5 pr-4 text-white">{item.pingMs} ms</td>
                    <td className="py-2.5 pr-4 text-[#C4C4CF]">{item.jitterMs} ms</td>
                    <td className="py-2.5 pr-4 text-[#EF4444] font-bold">
                      {item.downloadMbps.toFixed(1)} Mbps
                    </td>
                    <td className="py-2.5 pr-4 text-white">
                      {item.uploadMbps.toFixed(1)} Mbps
                    </td>
                    <td
                      className={`py-2.5 font-bold ${
                        item.tier === 'PRO'
                          ? 'text-[#22C55E]'
                          : item.tier === 'STABLE'
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                      }`}
                    >
                      {item.tier}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
