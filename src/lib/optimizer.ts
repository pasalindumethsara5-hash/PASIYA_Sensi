export type PlatformTarget = 'android' | 'ios';
export type SensitivityCap = 100 | 200;
export type DeviceTier = 'low' | 'mid' | 'high';
export type ConfigCategory =
  | 'headshot'
  | 'smg'
  | 'recoil'
  | 'sniper'
  | 'lowend'
  | 'custom';

export interface SensitivityConfig {
  id: string;
  name: string;
  category: ConfigCategory;
  cap: SensitivityCap;
  general: number;
  redDot: number;
  x2: number;
  x4: number;
  awm: number;
  freeLook: number;
  dpi: number;
  iosTouchSpeed: number; // 1..120 iOS Gliding Cursor / Tracking Speed equivalent
  fireButtonSize: number; // 35..75%
  fireButtonYOffset?: number; // 10..32% bottom offset
  dragPredictionPct?: number; // 0..10% vertical drag lift calibration offset
  xAxisScale?: number; // 1.0..2.2x horizontal tracking gain
  yDragScale?: number; // 1.5..4.2x vertical headshot drag gain
  touchDeadzoneMm?: number; // 0.05..0.40mm palm/edge filter
  recoilDampeningPct?: number; // 0..100% micro-recoil stabilization
  recoilNotes: string;
  dragCue: string;
  weapons: string[];
  signature?: string;
  checksum?: string;
  source?: 'official' | 'custom';
}

export interface DragSample {
  dragDistancePx: number;
  dragDurationMs: number;
  dragDxPx?: number;
  general: number;
  redDot: number;
  cap: SensitivityCap;
  dpi: number;
  fireButtonSize: number;
  dragPredictionPct?: number;
  yDragScale?: number;
  recoilDampeningPct?: number;
}

export type DragOutcome = 'HEADSHOT' | 'BODY_UNDERSHOOT' | 'OVERSHOOT';

export interface DragSimulationResult {
  outcome: DragOutcome;
  liftScore: number; // 0..140, headbox is 74..102
  headboxAccuracy: number; // 0..100%
  velocityPxPerSec: number;
  speedPxPerMs: number;
  elevationDeg: number;
  estimatedDamage: number;
  recommendation: string;
}

export interface DeviceMetrics {
  ramGb: number;
  cores: number;
  refreshHz: number;
  forcedLowEnd?: boolean;
}

export interface FpsOptionInfo {
  fps: 60 | 90 | 120 | 144;
  supported: boolean;
  recommended: boolean;
  reason: string;
}

export interface LowEndChecklistItem {
  id: string;
  platform: 'both' | 'android' | 'ios';
  title: string;
  detail: string;
  impactWeight: number;
}

export const BUILTIN_CONFIGS: SensitivityConfig[] = [
  {
    id: 'drag-hs-max',
    name: 'Drag Headshot Max',
    category: 'headshot',
    cap: 200,
    general: 196,
    redDot: 192,
    x2: 184,
    x4: 176,
    awm: 145,
    freeLook: 165,
    dpi: 500,
    iosTouchSpeed: 105,
    fireButtonSize: 45,
    recoilNotes:
      'High initial vertical acceleration with controlled 4x tracking to prevent over-flicking past the head hitbox.',
    dragCue:
      'Place crosshair slightly below chest level; flick upward in a 75ms J-curve.',
    weapons: ['Desert Eagle', 'Woodpecker', 'M1887', 'AC80'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
  {
    id: 'smg-rush-200',
    name: 'MP40 & SMG Close Rush',
    category: 'smg',
    cap: 200,
    general: 200,
    redDot: 198,
    x2: 188,
    x4: 172,
    awm: 132,
    freeLook: 155,
    dpi: 540,
    iosTouchSpeed: 112,
    fireButtonSize: 44,
    recoilNotes:
      'Maximum General + Red Dot pairing counteracts SMG close-range aim assist lock on the torso.',
    dragCue:
      'Pull straight up immediately on first bullet contact; release fire after 5 rounds to reset bloom.',
    weapons: ['MP40', 'UMP', 'MAC10', 'MP5'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
  {
    id: 'ar-zero-recoil',
    name: 'AR Zero-Recoil Stable',
    category: 'recoil',
    cap: 200,
    general: 178,
    redDot: 174,
    x2: 176,
    x4: 168,
    awm: 140,
    freeLook: 135,
    dpi: 460,
    iosTouchSpeed: 90,
    fireButtonSize: 50,
    recoilNotes:
      'Balanced 2x/4x multiplier stabilizes horizontal bloom on 6–10 round scoped bursts.',
    dragCue:
      'Crouch before firing mid-range, pulse 4-5 bullets, pause 120ms to lock crosshair recovery.',
    weapons: ['SCAR', 'M4A1', 'AK47', 'GROZA'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
  {
    id: 'sniper-quickswitch',
    name: 'AWM & M82B Quick-Switch',
    category: 'sniper',
    cap: 200,
    general: 168,
    redDot: 164,
    x2: 162,
    x4: 170,
    awm: 186,
    freeLook: 120,
    dpi: 440,
    iosTouchSpeed: 84,
    fireButtonSize: 52,
    recoilNotes:
      'Tuned AWM scope gain enables rapid micro-adjustments without overshooting moving targets.',
    dragCue:
      'Pre-aim center screen using pet/emote dot, tap fire then quick-weapon-switch within 90ms.',
    weapons: ['AWM', 'M82B', 'KAR98K'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
  {
    id: 'universal-ranked',
    name: 'Universal Ranked Hybrid',
    category: 'headshot',
    cap: 200,
    general: 188,
    redDot: 184,
    x2: 178,
    x4: 170,
    awm: 150,
    freeLook: 145,
    dpi: 480,
    iosTouchSpeed: 96,
    fireButtonSize: 48,
    recoilNotes:
      'All-purpose Clash Squad & Battle Royale preset balancing close drag speed with scoped spray stability.',
    dragCue:
      'Medium upward drag from upper chest; keep DPI under 500 for consistent thumb muscle memory.',
    weapons: ['M1887', 'UMP', 'SCAR', 'XM8'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
  {
    id: 'lowend-safe',
    name: 'Low-End Safe Stable',
    category: 'lowend',
    cap: 200,
    general: 176,
    redDot: 170,
    x2: 160,
    x4: 148,
    awm: 136,
    freeLook: 120,
    dpi: 400,
    iosTouchSpeed: 80,
    fireButtonSize: 54,
    recoilNotes:
      'Reduces jitter amplification when devices drop below 45 FPS during smoke/gloo-wall fights.',
    dragCue:
      'Larger 54% fire button gives reliable touch registration on 60Hz budget digitizers.',
    weapons: ['UMP', 'M4A1', 'M1014', 'M60'],
    source: 'official',
    signature: 'hmac-sha256:pasiya-official-v2-verified',
  },
];

export const LOW_END_CHECKLIST: LowEndChecklistItem[] = [
  {
    id: 'ff-smooth-gfx',
    platform: 'both',
    title: 'Set Free Fire Graphics to Smooth + Shadows Off',
    detail: 'Cuts GPU shader load by ~40% during final-zone gloo wall fights.',
    impactWeight: 25,
  },
  {
    id: 'storage-headroom',
    platform: 'both',
    title: 'Keep at least 15% internal storage free',
    detail: 'Prevents flash NAND write stalls and texture pop-in lag.',
    impactWeight: 15,
  },
  {
    id: 'thermal-clear',
    platform: 'both',
    title: 'Remove heavy phone case & disable charging while playing',
    detail: 'Stops SoC thermal throttling after 10 minutes of Clash Squad.',
    impactWeight: 15,
  },
  {
    id: 'android-anim-off',
    platform: 'android',
    title: 'Developer Options: Window & Transition animation scale 0.5x',
    detail: 'Reduces compositor overhead when switching apps or overlays.',
    impactWeight: 15,
  },
  {
    id: 'android-bg-limit',
    platform: 'android',
    title: 'Limit background processes & unrestricted battery for Free Fire',
    detail: 'Keeps social apps from waking CPU cores mid-gunfight.',
    impactWeight: 15,
  },
  {
    id: 'ios-low-power-off',
    platform: 'ios',
    title: 'Disable Low Power Mode & Background App Refresh',
    detail: 'Low Power Mode caps iPhone CPU clocks and locks ProMotion to 60Hz.',
    impactWeight: 15,
  },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function scaleSensitivityValue(
  value: number,
  fromCap: SensitivityCap,
  toCap: SensitivityCap
): number {
  if (fromCap === toCap) return clamp(Math.round(value), 0, toCap);
  if (fromCap === 200 && toCap === 100) {
    return clamp(Math.round(value / 2), 0, 100);
  }
  return clamp(Math.round(value * 2), 0, 200);
}

export function convertConfigCap(
  config: SensitivityConfig,
  targetCap: SensitivityCap
): SensitivityConfig {
  if (config.cap === targetCap) return config;
  const from = config.cap;
  return {
    ...config,
    cap: targetCap,
    general: scaleSensitivityValue(config.general, from, targetCap),
    redDot: scaleSensitivityValue(config.redDot, from, targetCap),
    x2: scaleSensitivityValue(config.x2, from, targetCap),
    x4: scaleSensitivityValue(config.x4, from, targetCap),
    awm: scaleSensitivityValue(config.awm, from, targetCap),
    freeLook: scaleSensitivityValue(config.freeLook, from, targetCap),
  };
}

export function applyMaxSensitivityBoost(
  config: SensitivityConfig
): SensitivityConfig {
  const cap = config.cap;
  return {
    ...config,
    general: cap,
    redDot: cap,
    x2: Math.round(cap * 0.96),
    x4: Math.round(cap * 0.9),
    awm: Math.round(cap * 0.78),
    freeLook: Math.round(cap * 0.85),
    dpi: clamp(Math.max(config.dpi, 500), 360, 620),
    iosTouchSpeed: clamp(Math.max(config.iosTouchSpeed, 108), 50, 120),
    fireButtonSize: clamp(Math.min(config.fireButtonSize, 46), 38, 65),
  };
}

export function simulateDragHeadshot(
  sample: DragSample
): DragSimulationResult {
  const safeDuration = Math.max(25, sample.dragDurationMs);
  const safeDistance = clamp(sample.dragDistancePx, 8, 280);
  const safeDx = clamp(Math.abs(sample.dragDxPx ?? 6), 0, 120);
  const velocityPxPerSec = Math.round((safeDistance / safeDuration) * 1000);
  const speedPxPerMs = Number((safeDistance / safeDuration).toFixed(2));
  const elevationDeg = Math.round(
    (Math.atan2(safeDx, Math.max(1, safeDistance)) * 180) / Math.PI
  );

  // Normalize general & redDot to 0..100 scale for physics consistency
  const normGeneral = sample.cap === 200 ? sample.general / 2 : sample.general;
  const normRedDot = sample.cap === 200 ? sample.redDot / 2 : sample.redDot;
  const combinedSens = normGeneral * 0.62 + normRedDot * 0.38;

  // DPI factor centered around 460
  const dpiFactor = sample.dpi / 460;
  // Smaller fire button increases upward swipe travel room slightly
  const fireBtnFactor = 1 + (50 - sample.fireButtonSize) * 0.006;
  // Safe touch-drag prediction calibration offset (0..10%, default 5%)
  const predictionFactor = 1 + clamp(sample.dragPredictionPct ?? 5, 0, 10) * 0.008;
  // Vertical drag multiplier (centered at default 2.85x so legacy defaults stay locked)
  const yDragFactor = 1 + (clamp(sample.yDragScale ?? 2.85, 1.5, 4.2) - 2.85) * 0.08;

  // Target headbox lies between 72 and 104 lift units
  const rawLift =
    (safeDistance / 90) *
    (combinedSens / 90) *
    dpiFactor *
    fireBtnFactor *
    predictionFactor *
    yDragFactor *
    (0.84 + Math.min(velocityPxPerSec, 1400) / 5600) *
    72;

  const liftScore = Math.round(clamp(rawLift, 5, 140));
  const headboxCenter = 88;
  const headboxRadius = 16; // 72..104

  let outcome: DragOutcome = 'HEADSHOT';
  let recommendation =
    'Locked directly in the headbox. Keep this drag speed and fire button size.';

  if (liftScore < headboxCenter - headboxRadius) {
    outcome = 'BODY_UNDERSHOOT';
    recommendation =
      'Aim stopped at chest/neck. Increase General +6 or Y-Axis Drag +0.20x.';
  } else if (liftScore > headboxCenter + headboxRadius) {
    outcome = 'OVERSHOOT';
    recommendation =
      'Crosshair flew over the head. Lower DPI by 20 or reduce Y-Axis Drag by 0.25x.';
  }

  const distFromCenter = Math.abs(liftScore - headboxCenter);
  const headboxAccuracy = Math.round(clamp(100 - distFromCenter * 1.45, 8, 100));
  const estimatedDamage =
    outcome === 'HEADSHOT'
      ? Math.round(clamp(132 + headboxAccuracy * 0.95, 165, 227))
      : outcome === 'BODY_UNDERSHOOT'
        ? Math.round(clamp(28 + headboxAccuracy * 0.25, 28, 52))
        : 0;

  return {
    outcome,
    liftScore,
    headboxAccuracy,
    velocityPxPerSec,
    speedPxPerMs,
    elevationDeg,
    estimatedDamage,
    recommendation,
  };
}

export function classifyDeviceTier(metrics: DeviceMetrics): DeviceTier {
  if (metrics.forcedLowEnd) return 'low';
  if (metrics.ramGb <= 3.5 || metrics.cores <= 4) return 'low';
  if (metrics.ramGb >= 6 && metrics.cores >= 8 && metrics.refreshHz >= 90) {
    return 'high';
  }
  return 'mid';
}

export function evaluateFpsOptions(metrics: DeviceMetrics): FpsOptionInfo[] {
  const tier = classifyDeviceTier(metrics);
  const hz = metrics.refreshHz;

  return [
    {
      fps: 60,
      supported: true,
      recommended: tier === 'low' || hz < 85,
      reason:
        tier === 'low'
          ? 'Most stable frame pacing for low-end SoCs; avoids thermal drop.'
          : 'Universal baseline supported on every Android & iOS panel.',
    },
    {
      fps: 90,
      supported: hz >= 85 && (tier !== 'low' || hz >= 90),
      recommended: hz >= 85 && hz < 115 && tier !== 'low',
      reason:
        hz >= 85
          ? 'Matches 90Hz panels for smoother drag tracking with moderate battery draw.'
          : `Requires a 90Hz+ display (detected ${Math.round(hz)}Hz).`,
    },
    {
      fps: 120,
      supported: hz >= 115 && metrics.ramGb >= 4 && !metrics.forcedLowEnd,
      recommended: hz >= 115 && hz < 140 && tier === 'high',
      reason:
        hz >= 115 && !metrics.forcedLowEnd
          ? 'Matches 120Hz / ProMotion panels for crisp close-range flicks.'
          : metrics.forcedLowEnd
            ? 'Disabled in Low-End Boost mode to protect frame stability.'
            : `Requires 120Hz+ panel and 4GB+ RAM (detected ${Math.round(hz)}Hz).`,
    },
    {
      fps: 144,
      supported: hz >= 138 && metrics.ramGb >= 6 && !metrics.forcedLowEnd,
      recommended: hz >= 138 && tier === 'high',
      reason:
        hz >= 138 && !metrics.forcedLowEnd
          ? 'Matches 144Hz gaming displays when game & OS refresh lock align.'
          : `Requires a 144Hz gaming panel & 6GB+ RAM (detected ${Math.round(hz)}Hz).`,
    },
  ];
}

export function computeBoostReadiness(params: {
  tier: DeviceTier;
  checkedIds: string[];
  platform: PlatformTarget;
  smoothGraphics: boolean;
  lowEndBoostActive: boolean;
}): { score: number; label: string } {
  const relevantItems = LOW_END_CHECKLIST.filter(
    (item) => item.platform === 'both' || item.platform === params.platform
  );
  const maxWeight = relevantItems.reduce((acc, i) => acc + i.impactWeight, 0);
  const earnedWeight = relevantItems
    .filter((i) => params.checkedIds.includes(i.id))
    .reduce((acc, i) => acc + i.impactWeight, 0);

  const checklistPct = maxWeight > 0 ? (earnedWeight / maxWeight) * 65 : 0;
  const gfxBonus = params.smoothGraphics ? 20 : 8;
  const boostBonus = params.lowEndBoostActive ? 15 : 5;

  const score = Math.round(clamp(checklistPct + gfxBonus + boostBonus, 10, 100));
  const label =
    score >= 85
      ? 'Tournament Ready'
      : score >= 60
        ? 'Balanced Stability'
        : 'Needs Optimization';
  return { score, label };
}

export function formatFreeFireConfig(
  config: SensitivityConfig,
  platform: PlatformTarget,
  targetFps: number
): string {
  const platformLine =
    platform === 'android'
      ? `Android DPI (Smallest Width): ${config.dpi} dp`
      : `iOS Gliding Cursor / Tracking Speed: ${config.iosTouchSpeed}`;

  return [
    `[PASIYA SENSI — ${config.name} (${config.cap}-Cap)]`,
    `General: ${config.general}`,
    `Red Dot: ${config.redDot}`,
    `2x Scope: ${config.x2}`,
    `4x Scope: ${config.x4}`,
    `AWM Scope: ${config.awm}`,
    `Free Look: ${config.freeLook}`,
    `Fire Button Size: ${config.fireButtonSize}%`,
    platformLine,
    `Target FPS Sync: ${targetFps} FPS`,
    `Drag Cue: ${config.dragCue}`,
  ].join('\n');
}

export type PlayStyleTarget = 'balanced' | 'one-tap' | 'fast-gloo';

export function computeRecommendedDpi(params: {
  screenWidthPx: number;
  style: PlayStyleTarget;
}): { recommendedDpi: number; touchStepIos: number; note: string } {
  const width = clamp(Math.round(params.screenWidthPx || 390), 320, 480);
  const baseFactor = width < 380 ? 20 : width > 420 ? -15 : 0;

  if (params.style === 'one-tap') {
    const dpi = clamp(500 + baseFactor, 440, 560);
    return {
      recommendedDpi: dpi,
      touchStepIos: 108,
      note: 'Tuned for crisp vertical Desert Eagle / M1887 J-drag headshots without jitter.',
    };
  }

  if (params.style === 'fast-gloo') {
    const dpi = clamp(540 + baseFactor, 460, 600);
    return {
      recommendedDpi: dpi,
      touchStepIos: 115,
      note: 'Higher horizontal turn rate for rapid 360° crouch gloo-wall placement.',
    };
  }

  const dpi = clamp(440 + baseFactor, 400, 500);
  return {
    recommendedDpi: dpi,
    touchStepIos: 94,
    note: 'Balanced ranked DPI preserving UI readability while smoothing AR & SMG tracking.',
  };
}

export function computeDragPhysicsRatio(
  xAxisScale = 1.45,
  yDragScale = 2.85
): number {
  const safeX = clamp(xAxisScale, 0.8, 3);
  const safeY = clamp(yDragScale, 1, 5);
  return Number((safeY / safeX).toFixed(2));
}

export function computeAutoCalibratedConfig(params: {
  base: SensitivityConfig;
  platform: PlatformTarget;
  refreshHz: number;
  screenWidthPx: number;
  style: PlayStyleTarget;
}): SensitivityConfig {
  const cap = params.base.cap;
  const scaleFactor = cap === 200 ? 1 : 0.5;
  const hzBonus = params.refreshHz >= 120 ? 3 : params.refreshHz >= 90 ? 1 : 0;
  const dpiRec = computeRecommendedDpi({
    screenWidthPx: params.screenWidthPx,
    style: params.style,
  });

  const general = clamp(Math.round((192 + hzBonus) * scaleFactor), 0, cap);
  const redDot = clamp(Math.round((188 + hzBonus) * scaleFactor), 0, cap);
  const x2 = clamp(Math.round((180 + hzBonus) * scaleFactor), 0, cap);
  const x4 = clamp(Math.round((170 + hzBonus) * scaleFactor), 0, cap);
  const awm = clamp(Math.round(148 * scaleFactor), 0, cap);
  const freeLook = clamp(Math.round(160 * scaleFactor), 0, cap);

  return {
    ...params.base,
    id: `autocal-${params.style}-${cap}`,
    name: `Auto-Calibrated (${params.refreshHz}Hz ${params.platform === 'ios' ? 'iOS' : 'Android'})`,
    general,
    redDot,
    x2,
    x4,
    awm,
    freeLook,
    dpi: dpiRec.recommendedDpi,
    iosTouchSpeed: dpiRec.touchStepIos,
    fireButtonSize: params.style === 'one-tap' ? 43 : params.style === 'fast-gloo' ? 46 : 48,
    fireButtonYOffset: params.style === 'one-tap' ? 18 : 20,
    xAxisScale: params.style === 'fast-gloo' ? 1.65 : 1.45,
    yDragScale: params.style === 'one-tap' ? 3.2 : 2.85,
    touchDeadzoneMm: params.refreshHz >= 120 ? 0.12 : 0.16,
    recoilDampeningPct: 78,
    source: 'custom',
  };
}

export function encodeConfigShareCode(config: SensitivityConfig): string {
  const fields = [
    config.cap,
    config.general,
    config.redDot,
    config.x2,
    config.x4,
    config.awm,
    config.freeLook,
    config.dpi,
    config.iosTouchSpeed,
    config.fireButtonSize,
    Math.round((config.xAxisScale ?? 1.45) * 100),
    Math.round((config.yDragScale ?? 2.85) * 100),
  ];
  return `#PS-${fields.map((n) => Math.max(0, Math.round(n)).toString(36).toUpperCase()).join('-')}`;
}

export function decodeConfigShareCode(
  code: string,
  base: SensitivityConfig
): SensitivityConfig | null {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed.startsWith('#PS-')) return null;
  const parts = trimmed.slice(4).split('-');
  if (parts.length < 10) return null;

  const nums = parts.map((p) => Number.parseInt(p, 36));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;

  const cap: SensitivityCap = nums[0] === 100 ? 100 : 200;
  const clampMax = (v: number) => clamp(v, 0, cap);

  return {
    ...base,
    id: `imported-${Date.now()}`,
    name: `Shared Code (${trimmed.slice(0, 14)})`,
    cap,
    general: clampMax(nums[1]),
    redDot: clampMax(nums[2]),
    x2: clampMax(nums[3]),
    x4: clampMax(nums[4]),
    awm: clampMax(nums[5]),
    freeLook: clampMax(nums[6]),
    dpi: clamp(nums[7], 280, 720),
    iosTouchSpeed: clamp(nums[8], 40, 120),
    fireButtonSize: clamp(nums[9], 32, 75),
    xAxisScale: nums[10] ? clamp(Number((nums[10] / 100).toFixed(2)), 1, 2.2) : 1.45,
    yDragScale: nums[11] ? clamp(Number((nums[11] / 100).toFixed(2)), 1.5, 4.2) : 2.85,
    source: 'custom',
  };
}

export type OptimizationProfileMode =
  | 'all-round'
  | 'fps-focus'
  | 'battery-saver'
  | 'competitive';

export interface OptimizationProfileSpec {
  id: OptimizationProfileMode;
  label: string;
  targetFps: 60 | 90 | 120 | 144;
  resolutionScale: number;
  smoothGraphics: boolean;
  lowEndBoost: boolean;
  summary: string;
}

export const OPTIMIZATION_PROFILES: OptimizationProfileSpec[] = [
  {
    id: 'all-round',
    label: 'All-Round',
    targetFps: 90,
    resolutionScale: 90,
    smoothGraphics: true,
    lowEndBoost: false,
    summary: 'Balances crisp visibility with steady 90 FPS pacing across BR & CS.',
  },
  {
    id: 'fps-focus',
    label: 'FPS Focus',
    targetFps: 120,
    resolutionScale: 80,
    smoothGraphics: true,
    lowEndBoost: false,
    summary: 'Drops heavy shader resolution scale to 80% for maximum 120Hz fluidity.',
  },
  {
    id: 'battery-saver',
    label: 'Thermal Safe',
    targetFps: 60,
    resolutionScale: 75,
    smoothGraphics: true,
    lowEndBoost: true,
    summary: 'Prevents SoC thermal throttling during extended scrims on budget devices.',
  },
  {
    id: 'competitive',
    label: 'Tournament',
    targetFps: 144,
    resolutionScale: 100,
    smoothGraphics: false,
    lowEndBoost: false,
    summary: 'Full 100% render clarity & unlocked frame ceiling for high-end gaming panels.',
  },
];

export type AdaptiveSensiTierId = 'aggressive' | 'balanced' | 'stable';

export interface AdaptiveSensiTier {
  id: AdaptiveSensiTierId;
  label: string;
  tagline: string;
  general: number;
  redDot: number;
  x2: number;
  x4: number;
  awm: number;
  freeLook: number;
  dpi: number;
  iosTouchSpeed: number;
  xAxisScale: number;
  yDragScale: number;
  recoilDampeningPct: number;
  fireButtonSize: number;
  rationale: string;
}

export function computeAdaptiveSensiRecommendations(params: {
  base: SensitivityConfig;
  platform: PlatformTarget;
  targetFps: number;
}): AdaptiveSensiTier[] {
  const { base, platform, targetFps } = params;
  const cap = base.cap;
  const scaleFactor = cap === 200 ? 1 : 0.5;
  const isIos = platform === 'ios';

  // High refresh frames (120/144Hz) tolerate tighter micro-flick sensitivity; 60Hz uses gentler gain
  const fpsGain200 =
    targetFps >= 144 ? 5 : targetFps >= 120 ? 3 : targetFps >= 90 ? 1 : -3;
  // iOS digitizer is natively linear & low-latency, requiring slightly less raw general inflation
  const platformBias200 = isIos ? -2 : 2;
  const frameMs = (1000 / Math.max(30, targetFps)).toFixed(1);

  const scaleVal = (val200: number) =>
    Math.round(clamp(val200 * scaleFactor, 0, cap));

  return [
    {
      id: 'aggressive',
      label: 'Aggressive',
      tagline: 'One-Tap Flick & 360° Rush',
      general: scaleVal(196 + fpsGain200 + platformBias200),
      redDot: scaleVal(193 + fpsGain200 + platformBias200),
      x2: scaleVal(186 + fpsGain200),
      x4: scaleVal(178 + fpsGain200),
      awm: scaleVal(154 + Math.max(0, fpsGain200)),
      freeLook: scaleVal(174),
      dpi: isIos ? base.dpi : clamp(540 + (targetFps >= 120 ? 20 : 0), 380, 620),
      iosTouchSpeed: isIos ? clamp(114 + (targetFps >= 120 ? 4 : 0), 60, 120) : base.iosTouchSpeed,
      xAxisScale: 1.7,
      yDragScale: isIos ? 3.2 : 3.35,
      recoilDampeningPct: 68,
      fireButtonSize: 43,
      rationale: `${isIos ? 'iOS ProMotion' : 'Android DPI'} at ${targetFps} FPS (${frameMs}ms frame window) sustains peak vertical snap velocity for M1887 & Desert Eagle.`,
    },
    {
      id: 'balanced',
      label: 'Balanced',
      tagline: 'Ranked All-Round Precision',
      general: scaleVal(186 + fpsGain200 + platformBias200),
      redDot: scaleVal(182 + fpsGain200 + platformBias200),
      x2: scaleVal(176 + fpsGain200),
      x4: scaleVal(168 + fpsGain200),
      awm: scaleVal(144),
      freeLook: scaleVal(158),
      dpi: isIos ? base.dpi : clamp(480 + (targetFps >= 120 ? 15 : 0), 360, 560),
      iosTouchSpeed: isIos ? clamp(102 + (targetFps >= 120 ? 3 : 0), 60, 120) : base.iosTouchSpeed,
      xAxisScale: 1.45,
      yDragScale: 2.85,
      recoilDampeningPct: 78,
      fireButtonSize: 47,
      rationale: `Matches ${targetFps}Hz frame pacing for clean collarbone drags and controllable 2x/4x AR spray transitions on ${isIos ? 'iOS' : 'Android'}.`,
    },
    {
      id: 'stable',
      label: 'Stable',
      tagline: 'Anti-Overshoot Zero-Recoil',
      general: scaleVal(174 + Math.min(2, fpsGain200) + platformBias200),
      redDot: scaleVal(170 + Math.min(2, fpsGain200)),
      x2: scaleVal(164),
      x4: scaleVal(156),
      awm: scaleVal(132),
      freeLook: scaleVal(145),
      dpi: isIos ? base.dpi : clamp(425, 340, 500),
      iosTouchSpeed: isIos ? 88 : base.iosTouchSpeed,
      xAxisScale: 1.25,
      yDragScale: 2.45,
      recoilDampeningPct: 88,
      fireButtonSize: 52,
      rationale: `Eliminates jitter and headbox overshoot during ${targetFps <= 60 ? '60Hz frame drops' : 'sustained full-auto bursts'} with stronger micro-recoil dampening.`,
    },
  ];
}

export function applyAdaptiveSensiTier(
  base: SensitivityConfig,
  tier: AdaptiveSensiTier,
  platform: PlatformTarget,
  targetFps: number
): SensitivityConfig {
  return {
    ...base,
    id: `adaptive-${tier.id}-${platform}-${targetFps}`,
    name: `${tier.label} (${platform === 'ios' ? 'iOS' : 'Android'} ${targetFps}Hz)`,
    general: tier.general,
    redDot: tier.redDot,
    x2: tier.x2,
    x4: tier.x4,
    awm: tier.awm,
    freeLook: tier.freeLook,
    dpi: tier.dpi,
    iosTouchSpeed: tier.iosTouchSpeed,
    xAxisScale: tier.xAxisScale,
    yDragScale: tier.yDragScale,
    recoilDampeningPct: tier.recoilDampeningPct,
    fireButtonSize: tier.fireButtonSize,
    source: 'custom',
  };
}

