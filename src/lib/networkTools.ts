export interface TouchLatencySummary {
  sampleCount: number;
  avgIntervalMs: number;
  fastestIntervalMs: number;
  estimatedTouchHz: number;
  grade: 'ULTRA' | 'FAST' | 'STANDARD';
}

export function evaluateTouchSamples(intervalsMs: number[]): TouchLatencySummary {
  const valid = intervalsMs.filter((n) => Number.isFinite(n) && n >= 1 && n <= 1200);
  if (valid.length === 0) {
    return {
      sampleCount: 0,
      avgIntervalMs: 0,
      fastestIntervalMs: 0,
      estimatedTouchHz: 0,
      grade: 'STANDARD',
    };
  }

  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const fastest = Math.min(...valid);
  // Real browser frame-event touch polling cadence derived from fastest burst delta
  const rawHz = Math.min(480, Math.max(30, Math.round(1000 / Math.max(2.08, fastest))));
  const snappedHz =
    rawHz >= 210 ? 240 : rawHz >= 135 ? 180 : rawHz >= 105 ? 120 : rawHz >= 75 ? 90 : 60;

  const grade: TouchLatencySummary['grade'] =
    avg <= 125 || snappedHz >= 180 ? 'ULTRA' : avg <= 210 || snappedHz >= 90 ? 'FAST' : 'STANDARD';

  return {
    sampleCount: valid.length,
    avgIntervalMs: Number(avg.toFixed(1)),
    fastestIntervalMs: Number(fastest.toFixed(1)),
    estimatedTouchHz: snappedHz,
    grade,
  };
}

export interface NetworkTargetResult {
  id: string;
  label: string;
  endpoint: string;
  latencyMs: number | null;
  status: 'online' | 'unreachable';
}

export function rankProbeResults<T extends { latencyMs: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.latencyMs === null && b.latencyMs === null) return 0;
    if (a.latencyMs === null) return 1;
    if (b.latencyMs === null) return -1;
    return a.latencyMs - b.latencyMs;
  });
}
