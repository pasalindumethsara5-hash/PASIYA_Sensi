import React, { useRef, useState } from 'react';
import { Globe, Hand, RotateCcw, Server, Zap } from 'lucide-react';
import type { PlatformTarget } from '../lib/optimizer';
import {
  type NetworkTargetResult,
  evaluateTouchSamples,
  rankProbeResults,
} from '../lib/networkTools';
import { triggerHaptic } from '../lib/haptics';
import { SlidingSegmentedControl } from './SlidingSegmentedControl';
import { SpeedTestView } from './SpeedTestView';
import { TacticalAudioView } from './TacticalAudioView';

interface ToolsHubViewProps {
  platform: PlatformTarget;
}

type ToolsSectionMode = 'all' | 'audio' | 'speed';

export const ToolsHubView: React.FC<ToolsHubViewProps> = ({ platform }) => {
  const [sectionMode, setSectionMode] = useState<ToolsSectionMode>('all');

  // Touch Response & Polling Latency Pad State
  const lastTapAtRef = useRef<number | null>(null);
  const [touchIntervals, setTouchIntervals] = useState<number[]>([]);

  // Real Backend TCP/Socket Network Benchmarks
  const [regionResults, setRegionResults] = useState<NetworkTargetResult[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [dnsResults, setDnsResults] = useState<NetworkTargetResult[]>([]);
  const [dnsLoading, setDnsLoading] = useState(false);

  const touchSummary = evaluateTouchSamples(touchIntervals);

  const handleTouchTap = () => {
    triggerHaptic('detent');
    const now = performance.now();
    if (lastTapAtRef.current !== null) {
      const delta = Number((now - lastTapAtRef.current).toFixed(1));
      if (delta >= 1 && delta <= 1200) {
        setTouchIntervals((prev) => [delta, ...prev].slice(0, 25));
      }
    }
    lastTapAtRef.current = now;
  };

  const resetTouchSamples = () => {
    triggerHaptic('impact');
    lastTapAtRef.current = null;
    setTouchIntervals([]);
  };

  const runRegionBenchmark = async () => {
    triggerHaptic('action');
    setRegionLoading(true);
    try {
      const res = await fetch(`/api/tools/region-ping?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { items?: NetworkTargetResult[] };
        if (data.items) {
          setRegionResults(rankProbeResults(data.items));
        }
      }
    } catch {
      setRegionResults([]);
    } finally {
      setRegionLoading(false);
    }
  };

  const runDnsBenchmark = async () => {
    triggerHaptic('action');
    setDnsLoading(true);
    try {
      const res = await fetch(`/api/tools/dns-benchmark?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { items?: NetworkTargetResult[] };
        if (data.items) {
          setDnsResults(rankProbeResults(data.items));
        }
      }
    } catch {
      setDnsResults([]);
    } finally {
      setDnsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Sub-navigation between Speed Test, Tactical 3D Audio, and Combined Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SlidingSegmentedControl<ToolsSectionMode>
          ariaLabel="Tools hub modules"
          variant="crimson"
          layout="scrollable"
          className="max-w-full"
          value={sectionMode}
          onChange={setSectionMode}
          options={[
            {
              id: 'all',
              label: 'All Net & Audio Tools',
              testId: 'tools-filter-all',
            },
            {
              id: 'audio',
              label: 'Tactical 3D Audio',
              testId: 'tools-filter-audio',
            },
            {
              id: 'speed',
              label: 'Speed & Route Ping',
              testId: 'tools-filter-speed',
            },
          ]}
        />
      </div>

      {/* Primary Section: Ookla-Style Speed & Latency Test */}
      {(sectionMode === 'all' || sectionMode === 'speed') && (
        <div className="ios-panel-glide">
          <SpeedTestView platform={platform} />
        </div>
      )}

      {/* Tactical 3D Audio Sound Stage Section */}
      {(sectionMode === 'all' || sectionMode === 'audio') && (
        <div className="ios-panel-glide">
          <TacticalAudioView />
        </div>
      )}

      {/* Secondary Section: Touch Polling Pad + Regional Ping + DNS Benchmark */}
      {sectionMode !== 'audio' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Touch Response & Polling Latency Pad */}
        <section
          aria-labelledby="touch-lab-heading"
          className="lg:col-span-5 rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="touch-lab-heading" className="text-base font-bold text-white">
                Touch Response &amp; Polling Test
              </h2>
              <p className="text-xs text-[#9A9AA6] mt-0.5">
                Tap rapidly inside the pad to measure input cadence
              </p>
            </div>
            <button
              type="button"
              onClick={resetTouchSamples}
              aria-label="Reset touch samples"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#13131A] border border-[#2A2A34] text-[#9A9AA6] hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            data-testid="touch-latency-pad"
            onPointerDown={handleTouchTap}
            className="mt-4 w-full h-44 rounded-xl bg-[#060609] border-2 border-dashed border-[#2A2A34] hover:border-[#EF4444]/70 active:border-[#EF4444] active:bg-[#190B0E]/40 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer select-none"
          >
            <Hand className="w-7 h-7 text-[#EF4444]" aria-hidden="true" />
            <span className="text-sm font-bold text-white">
              Tap Rapidly Here to Measure
            </span>
            <span className="text-xs font-mono-num text-[#9A9AA6]">
              {touchSummary.sampleCount} samples recorded
            </span>
          </button>

          <div className="mt-4 pt-4 border-t border-[#23232B] grid grid-cols-3 gap-3 text-left">
            <div>
              <div className="text-xs text-[#9A9AA6]">Fastest Interval</div>
              <div
                data-testid="touch-fastest-ms"
                className="mt-0.5 text-base font-extrabold font-mono-num text-[#EF4444]"
              >
                {touchSummary.fastestIntervalMs > 0
                  ? `${touchSummary.fastestIntervalMs} ms`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9A9AA6]">Average Interval</div>
              <div className="mt-0.5 text-base font-extrabold font-mono-num text-white">
                {touchSummary.avgIntervalMs > 0
                  ? `${touchSummary.avgIntervalMs} ms`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9A9AA6]">Peak Burst Rate</div>
              <div className="mt-0.5 text-base font-extrabold font-mono-num text-[#22C55E]">
                {touchSummary.estimatedTouchHz > 0
                  ? `${touchSummary.estimatedTouchHz} Hz`
                  : '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Regional Edge Server Ping + Game DNS Benchmark */}
        <div className="lg:col-span-7 space-y-6">
          <section
            aria-labelledby="region-ping-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-[#EF4444] shrink-0" aria-hidden="true" />
                <h2 id="region-ping-heading" className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                  Global Route Latency
                </h2>
              </div>
              <button
                type="button"
                data-testid="test-regions-btn"
                disabled={regionLoading}
                onClick={() => void runRegionBenchmark()}
                className="min-h-[36px] shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] disabled:opacity-60 transition-colors cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {regionLoading ? 'Probing...' : 'Test Regions'}
              </button>
            </div>

            {regionResults.length === 0 ? (
              <p className="text-xs text-[#9A9AA6]">
                Click Test Regions to run real TCP connect probes toward Asia, Europe, and North America routes.
              </p>
            ) : (
              <div className="divide-y divide-[#23232B]">
                {regionResults.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="text-[11px] font-mono-num text-[#9A9AA6]">
                        {item.endpoint}
                      </div>
                    </div>
                    <span
                      className={`font-mono-num font-bold ${
                        item.latencyMs === null
                          ? 'text-[#9A9AA6]'
                          : item.latencyMs <= 50
                            ? 'text-[#22C55E]'
                            : item.latencyMs <= 110
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                      }`}
                    >
                      {item.latencyMs !== null ? `${item.latencyMs} ms` : 'Blocked / Timeout'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            aria-labelledby="dns-benchmark-heading"
            className="rounded-2xl bg-[#0B0B0F] border border-[#23232B] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#EF4444] shrink-0" aria-hidden="true" />
                <h2 id="dns-benchmark-heading" className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                  Game DNS Benchmark
                </h2>
              </div>
              <button
                type="button"
                data-testid="test-dns-btn"
                disabled={dnsLoading}
                onClick={() => void runDnsBenchmark()}
                className="min-h-[36px] shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#050507] text-xs font-bold hover:bg-[#E5E5EC] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {dnsLoading ? 'Testing...' : 'Test DNS'}
              </button>
            </div>

            {dnsResults.length === 0 ? (
              <p className="text-xs text-[#9A9AA6]">
                Compare real TCP latency to Cloudflare (1.1.1.1), Google (8.8.8.8), Quad9 (9.9.9.9), and AdGuard DNS.
              </p>
            ) : (
              <div className="divide-y divide-[#23232B]">
                {dnsResults.map((item, idx) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {item.label}{' '}
                        {idx === 0 && item.latencyMs !== null ? (
                          <span className="ml-1 text-[#22C55E] font-mono-num">
                            Fastest
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] font-mono-num text-[#9A9AA6]">
                        {item.endpoint}
                      </div>
                    </div>
                    <span
                      className={`font-mono-num font-bold ${
                        item.latencyMs !== null ? 'text-white' : 'text-[#9A9AA6]'
                      }`}
                    >
                      {item.latencyMs !== null ? `${item.latencyMs} ms` : 'Unreachable'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      )}
    </div>
  );
};
