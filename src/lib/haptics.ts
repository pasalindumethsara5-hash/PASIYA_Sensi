export type HapticPattern =
  | 'tap'
  | 'detent'
  | 'selection'
  | 'action'
  | 'success'
  | 'warning'
  | 'impact';

export const HAPTIC_STORAGE_KEY = 'pasiya_haptics_enabled_v1';

export const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 10,
  detent: 6,
  selection: [8, 18, 12],
  action: 16,
  success: [12, 26, 20],
  warning: [24, 34, 24],
  impact: 22,
};

let lastHapticTimestamp = 0;
let lastDetentTimestamp = 0;

export function resetHapticCooldownForTests(): void {
  lastHapticTimestamp = 0;
  lastDetentTimestamp = 0;
}

export function resolveHapticPattern(
  type: HapticPattern = 'tap'
): number | number[] {
  const pattern = HAPTIC_PATTERNS[type];
  return Array.isArray(pattern) ? [...pattern] : pattern;
}

export function isValidHapticType(value: string): value is HapticPattern {
  return Object.prototype.hasOwnProperty.call(HAPTIC_PATTERNS, value);
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(HAPTIC_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage access restrictions
  }
}

export interface VibrateNavigator {
  vibrate?: (pattern: number | number[]) => boolean;
}

export interface TriggerHapticOptions {
  minIntervalMs?: number;
  nowMs?: number;
  navigatorObj?: VibrateNavigator | null;
  enabled?: boolean;
}

export function triggerHaptic(
  type: HapticPattern = 'tap',
  options: TriggerHapticOptions = {}
): boolean {
  const enabled = options.enabled ?? isHapticsEnabled();
  if (!enabled) return false;

  const nav =
    options.navigatorObj !== undefined
      ? options.navigatorObj
      : typeof navigator !== 'undefined'
        ? navigator
        : null;

  if (!nav || typeof nav.vibrate !== 'function') {
    return false;
  }

  const now =
    options.nowMs ??
    (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const minIntervalMs = options.minIntervalMs ?? 0;

  if (minIntervalMs > 0 && now - lastHapticTimestamp < minIntervalMs) {
    return false;
  }

  lastHapticTimestamp = now;

  try {
    return Boolean(nav.vibrate(resolveHapticPattern(type)));
  } catch {
    return false;
  }
}

export function triggerSliderDetent(
  options: Omit<TriggerHapticOptions, 'minIntervalMs'> = {}
): boolean {
  const enabled = options.enabled ?? isHapticsEnabled();
  if (!enabled) return false;

  const nav =
    options.navigatorObj !== undefined
      ? options.navigatorObj
      : typeof navigator !== 'undefined'
        ? navigator
        : null;

  if (!nav || typeof nav.vibrate !== 'function') {
    return false;
  }

  const now =
    options.nowMs ??
    (typeof performance !== 'undefined' ? performance.now() : Date.now());

  if (now - lastDetentTimestamp < 45) {
    return false;
  }

  lastDetentTimestamp = now;
  lastHapticTimestamp = now;

  try {
    return Boolean(nav.vibrate(resolveHapticPattern('detent')));
  } catch {
    return false;
  }
}

const INTERACTIVE_SELECTOR =
  'button, [role="button"], [role="switch"], a[href], input[type="checkbox"]';

export function installGlobalButtonHaptics(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;

    const interactive = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
    if (!interactive) return;

    if (
      (interactive as HTMLButtonElement).disabled ||
      interactive.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }

    const attr = interactive.dataset?.haptic;
    if (attr === 'off') return;

    const pattern: HapticPattern =
      attr && isValidHapticType(attr) ? attr : 'tap';

    // Deduplicate against semantic triggerHaptic() calls fired synchronously in React handlers
    triggerHaptic(pattern, { minIntervalMs: 45 });
  };

  document.addEventListener('click', handleDocumentClick, false);
  return () => {
    document.removeEventListener('click', handleDocumentClick, false);
  };
}
