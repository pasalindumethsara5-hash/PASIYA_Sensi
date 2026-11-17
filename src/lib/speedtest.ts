export type NetworkTier = 'PRO' | 'STABLE' | 'LAGGING';

export interface SpeedTestRecord {
  id: string;
  timestamp: string;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  tier: NetworkTier;
}

export interface NetworkEvaluation {
  tier: NetworkTier;
  label: string;
  recommendation: string;
}

/**
 * Computes trimmed median ping (ms) and mean consecutive delta jitter (ms).
 */
export function computePingStats(samplesMs: number[]): {
  pingMs: number;
  jitterMs: number;
} {
  const clean = samplesMs.filter((n) => Number.isFinite(n) && n >= 0);
  if (clean.length === 0) {
    return { pingMs: 0, jitterMs: 0 };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  // Drop single highest cold-start spike when >= 4 samples exist
  const trimmed = sorted.length >= 4 ? sorted.slice(0, sorted.length - 1) : sorted;
  const mid = Math.floor(trimmed.length / 2);
  const pingMs =
    trimmed.length % 2 === 1
      ? trimmed[mid]
      : (trimmed[mid - 1] + trimmed[mid]) / 2;

  let jitterSum = 0;
  for (let i = 1; i < clean.length; i++) {
    jitterSum += Math.abs(clean[i] - clean[i - 1]);
  }
  const jitterMs = clean.length > 1 ? jitterSum / (clean.length - 1) : 0;

  return {
    pingMs: Math.round(pingMs),
    jitterMs: Math.round(jitterMs * 10) / 10,
  };
}

/**
 * Converts transferred bytes and elapsed milliseconds to Megabits per second (Mbps).
 */
export function calculateMbps(bytes: number, durationMs: number): number {
  if (!Number.isFinite(bytes) || bytes <= 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }
  const safeMs = Math.max(durationMs, 10);
  const bits = bytes * 8;
  const mbps = bits / (safeMs / 1000) / 1_000_000;
  return Math.round(Math.min(mbps, 10_000) * 100) / 100;
}

/**
 * Non-linear Ookla-style speedometer curve (0..1) across 0 -> 1000 Mbps ticks:
 * [0, 5, 10, 25, 50, 100, 250, 500, 1000]
 */
export function speedMbpsToGaugeRatio(mbps: number): number {
  if (!Number.isFinite(mbps) || mbps <= 0) return 0;
  const stops = [0, 5, 10, 25, 50, 100, 250, 500, 1000];
  if (mbps >= stops[stops.length - 1]) return 1;

  for (let i = 0; i < stops.length - 1; i++) {
    const low = stops[i];
    const high = stops[i + 1];
    if (mbps <= high) {
      const segProgress = (mbps - low) / (high - low);
      return (i + segProgress) / (stops.length - 1);
    }
  }
  return 1;
}

/**
 * Evaluates connection readiness for Free Fire Ranked & Clash Squad hit registration.
 */
export function evaluateFreeFireNetwork(
  pingMs: number,
  jitterMs: number,
  downloadMbps: number
): NetworkEvaluation {
  if (pingMs <= 45 && jitterMs <= 10 && downloadMbps >= 10) {
    return {
      tier: 'PRO',
      label: 'Tournament Low-Ping Ready',
      recommendation:
        'Instant gloo-wall placement and clean first-shot hit registration. Keep background downloads paused.',
    };
  }
  if (pingMs <= 85 && jitterMs <= 22 && downloadMbps >= 4) {
    return {
      tier: 'STABLE',
      label: 'Ranked Match Stable',
      recommendation:
        'Playable for Battle Royale & CS. Switch to 5GHz Wi-Fi or set Android Private DNS (1dot1dot1dot1.cloudflare-dns.com) to trim jitter.',
    };
  }
  return {
    tier: 'LAGGING',
    label: 'High Ping / Spike Risk',
    recommendation:
      'High latency or jitter detected. Move closer to router, enable Low-Data / Game Priority mode, and close cloud backups.',
  };
}
