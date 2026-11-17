import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_CONFIGS } from './optimizer';
import {
  calculateSecurityScore,
  canonicalPayload,
  createSignedBundle,
  validateConfigBounds,
  verifyConfigBundleJson,
} from './security';

test('createSignedBundle + verifyConfigBundleJson accepts untampered config', async () => {
  const sample = BUILTIN_CONFIGS[0];
  const bundle = await createSignedBundle(sample);
  const res = await verifyConfigBundleJson(JSON.stringify(bundle));
  assert.equal(res.valid, true);
  assert.equal(res.config?.id, sample.id);
  assert.equal(res.computedChecksum, bundle.checksum);
});

test('verifyConfigBundleJson detects 1-point payload tampering', async () => {
  const sample = BUILTIN_CONFIGS[0];
  const bundle = await createSignedBundle(sample);
  const tampered = {
    ...bundle,
    config: {
      ...bundle.config,
      general: bundle.config.general - 1,
    },
  };
  const res = await verifyConfigBundleJson(JSON.stringify(tampered));
  assert.equal(res.valid, false);
  assert.match(res.reason, /Tamper detected/i);
});

test('validateConfigBounds rejects out-of-range hacked values', () => {
  const bad = {
    ...BUILTIN_CONFIGS[0],
    general: 999,
  };
  assert.equal(validateConfigBounds(bad), false);
});

test('canonicalPayload is deterministic', () => {
  const a = canonicalPayload(BUILTIN_CONFIGS[0]);
  const b = canonicalPayload({ ...BUILTIN_CONFIGS[0] });
  assert.equal(a, b);
});

test('calculateSecurityScore weights passed checks accurately', () => {
  const score = calculateSecurityScore([
    { id: 'a', label: 'A', ok: true, detail: '', weight: 60 },
    { id: 'b', label: 'B', ok: false, detail: '', weight: 40 },
  ]);
  assert.equal(score, 60);
});
