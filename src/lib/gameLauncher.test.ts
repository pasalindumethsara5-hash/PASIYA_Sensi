import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_CONFIGS } from './optimizer';
import { buildGameLaunchSpec } from './gameLauncher';

test('buildGameLaunchSpec generates valid Android intent deep links and Play Store fallbacks', () => {
  const std = buildGameLaunchSpec('freefire', 'android', BUILTIN_CONFIGS[0], 120);
  assert.equal(std.packageId, 'com.dts.freefireth');
  assert.ok(std.deepLinkUrl.startsWith('intent://#Intent;package=com.dts.freefireth'));
  assert.ok(std.storeFallbackUrl.includes('com.dts.freefireth'));
  assert.ok(std.sensitivitySummary.includes('Target FPS Sync: 120 FPS'));

  const max = buildGameLaunchSpec('freefire-max', 'android', BUILTIN_CONFIGS[0], 90);
  assert.equal(max.packageId, 'com.dts.freefiremax');
  assert.ok(max.deepLinkUrl.includes('package=com.dts.freefiremax'));
});

test('buildGameLaunchSpec generates clean iOS URL schemes and App Store fallbacks', () => {
  const iosStd = buildGameLaunchSpec('freefire', 'ios', BUILTIN_CONFIGS[0], 60);
  assert.equal(iosStd.deepLinkUrl, 'freefire://');
  assert.ok(iosStd.storeFallbackUrl.includes('apps.apple.com'));

  const iosMax = buildGameLaunchSpec('freefire-max', 'ios', BUILTIN_CONFIGS[0], 120);
  assert.equal(iosMax.deepLinkUrl, 'freefiremax://');
});
