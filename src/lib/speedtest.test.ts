import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMbps,
  computePingStats,
  evaluateFreeFireNetwork,
  speedMbpsToGaugeRatio,
} from './speedtest';

test('computePingStats trims cold-start spike and calculates jitter', () => {
  const stats = computePingStats([120, 24, 26, 22, 25]);
  assert.equal(stats.pingMs, 25);
  assert.ok(stats.jitterMs > 0);
});

test('calculateMbps accurately converts bytes and duration', () => {
  // 1,250,000 bytes (10 Megabits) in 1000ms = 10 Mbps
  assert.equal(calculateMbps(1_250_000, 1000), 10);
  assert.equal(calculateMbps(0, 1000), 0);
});

test('speedMbpsToGaugeRatio maps non-linear Ookla stops cleanly', () => {
  assert.equal(speedMbpsToGaugeRatio(0), 0);
  assert.equal(speedMbpsToGaugeRatio(1000), 1);
  // 50 Mbps is stop index 4 out of 8 => 0.5
  assert.equal(speedMbpsToGaugeRatio(50), 0.5);
});

test('evaluateFreeFireNetwork classifies PRO, STABLE, and LAGGING tiers', () => {
  assert.equal(evaluateFreeFireNetwork(22, 3, 85).tier, 'PRO');
  assert.equal(evaluateFreeFireNetwork(64, 14, 24).tier, 'STABLE');
  assert.equal(evaluateFreeFireNetwork(145, 38, 2.5).tier, 'LAGGING');
});
