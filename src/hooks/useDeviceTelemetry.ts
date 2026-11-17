import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlatformTarget } from '../lib/optimizer';

export interface HardwareTelemetry {
  detectedPlatform: PlatformTarget;
  deviceLabel: string;
  ramGb: number;
  cores: number;
  measuredHz: number;
  avgFrameMs: number;
  jitterMs: number;
  screenRes: string;
  touchCapable: boolean;
  isProbingHz: boolean;
}

function detectInitialPlatform(): PlatformTarget {
  if (typeof navigator === 'undefined') return 'android';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|macintosh/.test(ua) && navigator.maxTouchPoints > 0) {
    return 'ios';
  }
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'android';
}

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Mobile / Desktop Browser';
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'Apple iPhone (iOS)';
  if (/iPad/.test(ua)) return 'Apple iPad (iPadOS)';
  if (/Android/.test(ua)) {
    const match = ua.match(/Android\s[\d.]+;\s([^;)]+)/);
    return match ? match[1].trim() : 'Android Handset';
  }
  return 'Desktop Calibration Workstation';
}

export function useDeviceTelemetry() {
  const activeRafRef = useRef<number>(0);

  const [telemetry, setTelemetry] = useState<HardwareTelemetry>(() => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const ramGb =
      (nav as unknown as { deviceMemory?: number } | undefined)?.deviceMemory ??
      4;
    const cores = nav?.hardwareConcurrency ?? 4;
    const screenRes =
      typeof window !== 'undefined'
        ? `${window.screen.width}×${window.screen.height}`
        : '1080×2400';

    return {
      detectedPlatform: detectInitialPlatform(),
      deviceLabel: detectDeviceLabel(),
      ramGb,
      cores,
      measuredHz: 60,
      avgFrameMs: 16.67,
      jitterMs: 0.4,
      screenRes,
      touchCapable:
        typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0,
      isProbingHz: false,
    };
  });

  const probeDisplayHz = useCallback(() => {
    if (activeRafRef.current) {
      cancelAnimationFrame(activeRafRef.current);
      activeRafRef.current = 0;
    }

    setTelemetry((prev) => ({ ...prev, isProbingHz: true }));

    const deltas: number[] = [];
    let last = performance.now();
    let count = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (count > 2 && dt > 2 && dt < 50) {
        deltas.push(dt);
      }
      count += 1;
      if (count < 72) {
        activeRafRef.current = requestAnimationFrame(tick);
      } else {
        activeRafRef.current = 0;
        const sorted = [...deltas].sort((a, b) => a - b);
        const median =
          sorted.length > 0
            ? sorted[Math.floor(sorted.length / 2)]
            : 16.67;
        const avg =
          deltas.length > 0
            ? deltas.reduce((a, b) => a + b, 0) / deltas.length
            : 16.67;
        const rawHz = 1000 / median;
        const snappedHz =
          rawHz >= 136
            ? 144
            : rawHz >= 112
              ? 120
              : rawHz >= 82
                ? 90
                : 60;
        const variance =
          deltas.length > 1
            ? Math.max(...deltas) - Math.min(...deltas)
            : 0.4;

        setTelemetry((prev) => ({
          ...prev,
          measuredHz: snappedHz,
          avgFrameMs: Number(avg.toFixed(2)),
          jitterMs: Number(Math.min(variance, 12).toFixed(2)),
          isProbingHz: false,
        }));
      }
    };

    activeRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (activeRafRef.current) {
        cancelAnimationFrame(activeRafRef.current);
        activeRafRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    const cancel = probeDisplayHz();
    return cancel;
  }, [probeDisplayHz]);

  return { telemetry, probeDisplayHz };
}
