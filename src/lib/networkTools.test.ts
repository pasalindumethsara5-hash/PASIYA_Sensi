import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTouchSamples, rankProbeResults } from './networkTools';

test('evaluateTouchSamples computes intervals and snapped touch sampling rate', () => {
  const empty = evaluateTouchSamples([]);
  assert.equal(empty.sampleCount, 0);
  assert.equal(empty.estimatedTouchHz, 0);

  const fast = evaluateTouchSamples([110, 95, 4.2, 85]);
  assert.equal(fast.sampleCount, 4);
  assert.equal(fast.fastestIntervalMs, 4.2);
  assert.equal(fast.estimatedTouchHz, 240);
  assert.equal(fast.grade, 'ULTRA');
});

test('rankProbeResults sorts lowest latency first and pushes unreachable last', () => {
  const ranked = rankProbeResults([
    { id: 'sg', latencyMs: 38 },
    { id: 'offline', latencyMs: null },
    { id: 'dns-cf', latencyMs: 11 },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.id),
    ['dns-cf', 'sg', 'offline']
  );
});
