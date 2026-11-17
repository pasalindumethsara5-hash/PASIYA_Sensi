import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPATIAL_DIRECTIONS,
  azimuthToSpatialCoords,
  evaluateSoundStageAccuracy,
} from './tacticalAudio';

test('SPATIAL_DIRECTIONS covers all 8 Free Fire compass vectors cleanly', () => {
  assert.equal(SPATIAL_DIRECTIONS.length, 8);
  const angles = SPATIAL_DIRECTIONS.map((d) => d.azimuthDeg);
  assert.deepEqual(angles, [0, 45, 90, 135, 180, 225, 270, 315]);
});

test('azimuthToSpatialCoords maps front, right, rear, and left HRTF coordinates accurately', () => {
  const front = azimuthToSpatialCoords(0);
  assert.equal(front.x, 0);
  assert.ok(front.z < 0);
  assert.equal(front.leftGainPct, 50);
  assert.equal(front.rightGainPct, 50);
  assert.equal(front.isRear, false);

  const right = azimuthToSpatialCoords(90);
  assert.ok(right.x > 0);
  assert.equal(right.pan, 1);
  assert.equal(right.leftGainPct, 0);
  assert.equal(right.rightGainPct, 100);

  const rear = azimuthToSpatialCoords(180);
  assert.ok(rear.z > 0);
  assert.equal(rear.isRear, true);
  assert.ok(rear.lowpassHz < front.lowpassHz);

  const left = azimuthToSpatialCoords(270);
  assert.ok(left.x < 0);
  assert.equal(left.pan, -1);
  assert.equal(left.leftGainPct, 100);
  assert.equal(left.rightGainPct, 0);
});

test('evaluateSoundStageAccuracy grades zero-attempt, pro stereo, and channel-check tiers', () => {
  assert.equal(evaluateSoundStageAccuracy(0, 0).verdict, 'Ready to Calibrate');
  assert.equal(
    evaluateSoundStageAccuracy(5, 5).verdict,
    'Tournament Stereo Lock'
  );
  assert.equal(
    evaluateSoundStageAccuracy(4, 1).verdict,
    'Check Earbuds / Mono Setting'
  );
});
