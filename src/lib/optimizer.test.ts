import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_CONFIGS,
  applyAdaptiveSensiTier,
  applyMaxSensitivityBoost,
  classifyDeviceTier,
  computeAdaptiveSensiRecommendations,
  computeAutoCalibratedConfig,
  computeBoostReadiness,
  computeDragPhysicsRatio,
  computeRecommendedDpi,
  convertConfigCap,
  decodeConfigShareCode,
  encodeConfigShareCode,
  evaluateFpsOptions,
  simulateDragHeadshot,
} from './optimizer';

test('convertConfigCap scales between 200 and 100 caps cleanly', () => {
  const dragMax = BUILTIN_CONFIGS[0];
  assert.equal(dragMax.cap, 200);

  const classic = convertConfigCap(dragMax, 100);
  assert.equal(classic.cap, 100);
  assert.equal(classic.general, Math.round(dragMax.general / 2));
  assert.equal(classic.redDot, Math.round(dragMax.redDot / 2));

  const backTo200 = convertConfigCap(classic, 200);
  assert.equal(backTo200.cap, 200);
  assert.ok(backTo200.general <= 200);
});

test('applyMaxSensitivityBoost pushes primary sensitivities to cap', () => {
  const lowEnd = BUILTIN_CONFIGS.find((c) => c.id === 'lowend-safe')!;
  const maxed = applyMaxSensitivityBoost(lowEnd);
  assert.equal(maxed.general, 200);
  assert.equal(maxed.redDot, 200);
  assert.ok(maxed.dpi >= 500);
  assert.ok(maxed.fireButtonSize <= 46);
});

test('simulateDragHeadshot distinguishes undershoot, headshot, and overshoot', () => {
  const undershoot = simulateDragHeadshot({
    dragDistancePx: 26,
    dragDurationMs: 260,
    general: 90,
    redDot: 85,
    cap: 200,
    dpi: 380,
    fireButtonSize: 58,
  });
  assert.equal(undershoot.outcome, 'BODY_UNDERSHOOT');

  const sweetSpot = simulateDragHeadshot({
    dragDistancePx: 86,
    dragDurationMs: 95,
    general: 196,
    redDot: 192,
    cap: 200,
    dpi: 500,
    fireButtonSize: 45,
  });
  assert.equal(sweetSpot.outcome, 'HEADSHOT');
  assert.ok(sweetSpot.headboxAccuracy >= 75);
  assert.ok(sweetSpot.speedPxPerMs > 0);
  assert.ok(sweetSpot.estimatedDamage >= 165);

  const overshoot = simulateDragHeadshot({
    dragDistancePx: 210,
    dragDurationMs: 65,
    general: 200,
    redDot: 200,
    cap: 200,
    dpi: 640,
    fireButtonSize: 40,
  });
  assert.equal(overshoot.outcome, 'OVERSHOOT');
});

test('classifyDeviceTier and evaluateFpsOptions enforce hardware limits', () => {
  assert.equal(
    classifyDeviceTier({ ramGb: 2, cores: 4, refreshHz: 60 }),
    'low'
  );
  assert.equal(
    classifyDeviceTier({ ramGb: 8, cores: 8, refreshHz: 120 }),
    'high'
  );
  assert.equal(
    classifyDeviceTier({ ramGb: 8, cores: 8, refreshHz: 120, forcedLowEnd: true }),
    'low'
  );

  const lowOptions = evaluateFpsOptions({ ramGb: 3, cores: 4, refreshHz: 60 });
  assert.equal(lowOptions.find((o) => o.fps === 60)?.supported, true);
  assert.equal(lowOptions.find((o) => o.fps === 120)?.supported, false);
  assert.equal(lowOptions.find((o) => o.fps === 144)?.supported, false);

  const flagOptions = evaluateFpsOptions({ ramGb: 8, cores: 8, refreshHz: 144 });
  assert.equal(flagOptions.find((o) => o.fps === 144)?.supported, true);
});

test('computeBoostReadiness increases as checklist items are completed', () => {
  const empty = computeBoostReadiness({
    tier: 'low',
    checkedIds: [],
    platform: 'android',
    smoothGraphics: false,
    lowEndBoostActive: false,
  });
  const optimized = computeBoostReadiness({
    tier: 'low',
    checkedIds: [
      'ff-smooth-gfx',
      'storage-headroom',
      'thermal-clear',
      'android-anim-off',
      'android-bg-limit',
    ],
    platform: 'android',
    smoothGraphics: true,
    lowEndBoostActive: true,
  });
  assert.ok(optimized.score > empty.score);
  assert.equal(optimized.score, 100);
});

test('computeRecommendedDpi scales safely for playstyles within Android bounds', () => {
  const balanced = computeRecommendedDpi({ screenWidthPx: 390, style: 'balanced' });
  const gloo = computeRecommendedDpi({ screenWidthPx: 390, style: 'fast-gloo' });
  assert.ok(gloo.recommendedDpi > balanced.recommendedDpi);
  assert.ok(gloo.recommendedDpi <= 600);
  assert.ok(balanced.touchStepIos >= 80);
});

test('computeDragPhysicsRatio, computeAutoCalibratedConfig, and ShareCode encode/decode cleanly', () => {
  assert.equal(computeDragPhysicsRatio(1.45, 2.9), 2);

  const calibrated = computeAutoCalibratedConfig({
    base: BUILTIN_CONFIGS[0],
    platform: 'android',
    refreshHz: 120,
    screenWidthPx: 390,
    style: 'one-tap',
  });
  assert.ok(calibrated.general >= 192);
  assert.equal(calibrated.yDragScale, 3.2);

  const code = encodeConfigShareCode(calibrated);
  assert.ok(code.startsWith('#PS-'));

  const decoded = decodeConfigShareCode(code, BUILTIN_CONFIGS[0]);
  assert.ok(decoded !== null);
  assert.equal(decoded?.general, calibrated.general);
  assert.equal(decoded?.dpi, calibrated.dpi);
  assert.equal(decoded?.yDragScale, calibrated.yDragScale);
  assert.equal(decodeConfigShareCode('INVALID', BUILTIN_CONFIGS[0]), null);
});

test('computeAdaptiveSensiRecommendations generates 3 tiers tailored to platform and FPS', () => {
  const android60 = computeAdaptiveSensiRecommendations({
    base: BUILTIN_CONFIGS[0],
    platform: 'android',
    targetFps: 60,
  });
  const ios120 = computeAdaptiveSensiRecommendations({
    base: BUILTIN_CONFIGS[0],
    platform: 'ios',
    targetFps: 120,
  });

  assert.equal(android60.length, 3);
  assert.deepEqual(
    android60.map((t) => t.id),
    ['aggressive', 'balanced', 'stable']
  );
  assert.ok(android60[0].general > android60[1].general);
  assert.ok(android60[1].general > android60[2].general);
  assert.ok(ios120[1].iosTouchSpeed > 95);
  assert.ok(ios120[0].general <= 200);

  const classicBase = convertConfigCap(BUILTIN_CONFIGS[0], 100);
  const classicTiers = computeAdaptiveSensiRecommendations({
    base: classicBase,
    platform: 'ios',
    targetFps: 120,
  });
  assert.ok(classicTiers.every((t) => t.general <= 100 && t.redDot <= 100));

  const applied = applyAdaptiveSensiTier(
    BUILTIN_CONFIGS[0],
    ios120[0],
    'ios',
    120
  );
  assert.equal(applied.general, ios120[0].general);
  assert.equal(applied.iosTouchSpeed, ios120[0].iosTouchSpeed);
  assert.equal(applied.source, 'custom');
});
