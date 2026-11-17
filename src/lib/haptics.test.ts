import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HAPTIC_PATTERNS,
  resetHapticCooldownForTests,
  resolveHapticPattern,
  triggerHaptic,
  triggerSliderDetent,
} from './haptics';

test('resolveHapticPattern returns expected crisp timing patterns', () => {
  assert.equal(resolveHapticPattern('tap'), 10);
  assert.equal(resolveHapticPattern('action'), 16);
  assert.deepEqual(resolveHapticPattern('success'), [12, 26, 20]);
  assert.deepEqual(resolveHapticPattern('warning'), [24, 34, 24]);

  // Verify returned array is a copy, not mutating shared preset
  const copy = resolveHapticPattern('success') as number[];
  copy[0] = 999;
  assert.deepEqual(HAPTIC_PATTERNS.success, [12, 26, 20]);
});

test('triggerHaptic invokes navigator.vibrate with pattern and enforces deduplication cooldown', () => {
  resetHapticCooldownForTests();
  const calls: (number | number[])[] = [];
  const mockNav = {
    vibrate: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
  };

  assert.equal(
    triggerHaptic('action', { navigatorObj: mockNav, nowMs: 1000, enabled: true }),
    true
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0], 16);

  // Within 45ms deduplication window -> skipped
  assert.equal(
    triggerHaptic('tap', {
      navigatorObj: mockNav,
      nowMs: 1012,
      minIntervalMs: 45,
      enabled: true,
    }),
    false
  );
  assert.equal(calls.length, 1);

  // Outside 45ms cooldown -> triggers
  assert.equal(
    triggerHaptic('tap', {
      navigatorObj: mockNav,
      nowMs: 1060,
      minIntervalMs: 45,
      enabled: true,
    }),
    true
  );
  assert.equal(calls.length, 2);
  assert.equal(calls[1], 10);
});

test('triggerHaptic degrades cleanly when navigator.vibrate is unavailable or disabled', () => {
  resetHapticCooldownForTests();
  assert.equal(
    triggerHaptic('tap', { navigatorObj: {}, nowMs: 2000, enabled: true }),
    false
  );
  assert.equal(
    triggerHaptic('tap', { navigatorObj: null, nowMs: 2000, enabled: true }),
    false
  );

  let called = false;
  assert.equal(
    triggerHaptic('success', {
      navigatorObj: {
        vibrate: () => {
          called = true;
          return true;
        },
      },
      nowMs: 2000,
      enabled: false,
    }),
    false
  );
  assert.equal(called, false);
});

test('triggerSliderDetent throttles rapid range scrubbing to 45ms intervals', () => {
  resetHapticCooldownForTests();
  const calls: (number | number[])[] = [];
  const mockNav = {
    vibrate: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
  };

  assert.equal(
    triggerSliderDetent({ navigatorObj: mockNav, nowMs: 500, enabled: true }),
    true
  );
  assert.equal(
    triggerSliderDetent({ navigatorObj: mockNav, nowMs: 520, enabled: true }),
    false
  );
  assert.equal(
    triggerSliderDetent({ navigatorObj: mockNav, nowMs: 550, enabled: true }),
    true
  );
  assert.deepEqual(calls, [6, 6]);
});
