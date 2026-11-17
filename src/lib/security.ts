import type { SensitivityConfig } from './optimizer';

export interface SignedConfigBundle {
  version: 1;
  issuedAt: string;
  config: SensitivityConfig;
  checksum: string;
  signature?: string;
}

export interface BundleVerificationResult {
  valid: boolean;
  reason: string;
  config?: SensitivityConfig;
  computedChecksum?: string;
}

export interface SecurityAuditItem {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  weight: number;
}

export function canonicalPayload(config: SensitivityConfig): string {
  return [
    config.id,
    config.name.trim(),
    config.category,
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
  ].join('|');
}

export async function computeSha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateConfigBounds(config: unknown): config is SensitivityConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  if (typeof c.id !== 'string' || !c.id.trim()) return false;
  if (typeof c.name !== 'string' || !c.name.trim()) return false;
  if (c.cap !== 100 && c.cap !== 200) return false;

  const maxVal = c.cap;
  const sensFields = ['general', 'redDot', 'x2', 'x4', 'awm', 'freeLook'];
  for (const field of sensFields) {
    const v = c[field];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > maxVal) {
      return false;
    }
  }

  if (
    typeof c.dpi !== 'number' ||
    !Number.isFinite(c.dpi) ||
    c.dpi < 240 ||
    c.dpi > 960
  ) {
    return false;
  }

  if (
    typeof c.fireButtonSize !== 'number' ||
    !Number.isFinite(c.fireButtonSize) ||
    c.fireButtonSize < 25 ||
    c.fireButtonSize > 85
  ) {
    return false;
  }

  return true;
}

export async function createSignedBundle(
  config: SensitivityConfig
): Promise<SignedConfigBundle> {
  const payload = canonicalPayload(config);
  const checksum = await computeSha256Hex(payload);
  return {
    version: 1,
    issuedAt: new Date().toISOString(),
    config: { ...config, checksum },
    checksum,
    signature: config.signature,
  };
}

export async function verifyConfigBundleJson(
  rawJson: string
): Promise<BundleVerificationResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, reason: 'Invalid JSON payload — cannot parse config bundle.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, reason: 'Malformed bundle structure.' };
  }

  const bundle = parsed as Partial<SignedConfigBundle>;
  if (bundle.version !== 1 || !bundle.config || !bundle.checksum) {
    return {
      valid: false,
      reason: 'Missing bundle version, config object, or SHA-256 checksum.',
    };
  }

  if (!validateConfigBounds(bundle.config)) {
    return {
      valid: false,
      reason: 'Out-of-bounds sensitivity or DPI values rejected by schema guard.',
    };
  }

  const computedChecksum = await computeSha256Hex(
    canonicalPayload(bundle.config)
  );
  if (computedChecksum !== bundle.checksum) {
    return {
      valid: false,
      reason:
        'Tamper detected: payload SHA-256 checksum does not match the embedded digest.',
      computedChecksum,
    };
  }

  return {
    valid: true,
    reason: 'Payload checksum intact and schema validated.',
    config: {
      ...bundle.config,
      checksum: computedChecksum,
      signature: bundle.signature ?? bundle.config.signature,
    },
    computedChecksum,
  };
}

export function calculateSecurityScore(items: SecurityAuditItem[]): number {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total === 0) return 100;
  const passed = items
    .filter((i) => i.ok)
    .reduce((sum, i) => sum + i.weight, 0);
  return Math.round((passed / total) * 100);
}
