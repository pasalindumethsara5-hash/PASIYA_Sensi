import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_CONFIGS } from './optimizer';
import {
  RETICLE_SHAPES,
  SCOPE_OVERLAY_PRESETS,
  WEAPON_CLASS_PROFILES,
  computeOverlayScopeSync,
  computeTacticalAimSolution,
  getScopePreset,
  getWeaponClassProfile,
} from './aimAssist';

test('getWeaponClassProfile resolves all five Free Fire weapon classes', () => {
  assert.equal(WEAPON_CLASS_PROFILES.length, 5);
  const sniper = getWeaponClassProfile('sniper');
  assert.equal(sniper.id, 'sniper');
  assert.equal(sniper.recommendedReticle, 'sniper-mil-range');
  assert.ok(sniper.positioningTips.length >= 4);

  const smg = getWeaponClassProfile('smg');
  assert.equal(smg.recommendedReticle, 'smg-rush-brackets');
});

test('RETICLE_SHAPES and SCOPE_OVERLAY_PRESETS cover sniper, SMG, and AR optics cleanly', () => {
  assert.equal(RETICLE_SHAPES.length, 8);
  assert.equal(SCOPE_OVERLAY_PRESETS.length, 5);

  const sniperScope = getScopePreset('awm-sniper');
  assert.equal(sniperScope.recommendedShape, 'sniper-mil-range');
  assert.equal(sniperScope.magnification, '8.0x');

  const smgScope = getScopePreset('hipfire-general');
  assert.equal(smgScope.recommendedShape, 'smg-rush-brackets');
});

test('computeOverlayScopeSync maps active sensitivity slider per Free Fire scope', () => {
  const base = BUILTIN_CONFIGS[0];

  const awm = computeOverlayScopeSync('awm-sniper', base);
  assert.equal(awm.sensitivityLabel, 'AWM Scope');
  assert.equal(awm.sensitivityValue, base.awm);

  const x4 = computeOverlayScopeSync('scope-4x', base);
  assert.equal(x4.sensitivityLabel, '4x Scope');
  assert.equal(x4.sensitivityValue, base.x4);

  const smg = computeOverlayScopeSync('hipfire-general', base);
  assert.equal(smg.sensitivityLabel, 'General');
  assert.equal(smg.sensitivityValue, base.general);
});

test('computeTacticalAimSolution pairs correct scope sensitivity per class and range', () => {
  const base = BUILTIN_CONFIGS[0];

  const arLong = computeTacticalAimSolution({
    weaponClass: 'ar',
    range: 'long',
    config: base,
    platform: 'android',
  });
  assert.equal(arLong.pairedScopeLabel, '4x Scope');
  assert.equal(arLong.pairedScopeValue, base.x4);

  const sniperMid = computeTacticalAimSolution({
    weaponClass: 'sniper',
    range: 'mid',
    config: base,
    platform: 'ios',
  });
  assert.equal(sniperMid.pairedScopeLabel, 'AWM Scope');
  assert.equal(sniperMid.pairedScopeValue, base.awm);
  assert.ok(sniperMid.targetHeightPct > 70);
});

test('anchor height increases with distance for long-range precision classes', () => {
  const base = BUILTIN_CONFIGS[0];
  const closeOneTap = computeTacticalAimSolution({
    weaponClass: 'one-tap',
    range: 'close',
    config: base,
    platform: 'android',
  });
  const longOneTap = computeTacticalAimSolution({
    weaponClass: 'one-tap',
    range: 'long',
    config: base,
    platform: 'android',
  });

  assert.ok(longOneTap.targetHeightPct > closeOneTap.targetHeightPct);
  assert.ok(longOneTap.bloomRadiusPx < closeOneTap.bloomRadiusPx);
});
