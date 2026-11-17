import type { PlatformTarget, SensitivityConfig } from './optimizer';

export type WeaponClassId = 'one-tap' | 'shotgun' | 'smg' | 'ar' | 'sniper';

export type ReticleShapeId =
  | 'precision-dot'
  | 'chevron-head'
  | 'smg-circle'
  | 'smg-rush-brackets'
  | 'tactical-cross'
  | 'red-dot-holo'
  | 'sniper-mil-range'
  | 'booyah-diamond';

export type ScopeModeId =
  | 'hipfire-general'
  | 'red-dot'
  | 'scope-2x'
  | 'scope-4x'
  | 'awm-sniper';

export type EngagementRange = 'close' | 'mid' | 'long';

export interface ReticleOverlayConfig {
  shape: ReticleShapeId;
  color: '#EF4444' | '#FFFFFF' | '#22C55E' | '#F59E0B';
  scale: number; // 0.7 - 1.5
  gapPx: number; // 2 - 16
  opacityPct: number; // 40 - 100
  showCenterDot: boolean;
}

export interface ScopeOverlayPreset {
  id: ScopeModeId;
  label: string;
  shortLabel: string;
  magnification: string;
  weaponFocus: string;
  recommendedShape: ReticleShapeId;
  recommendedGapPx: number;
  recommendedScale: number;
  recommendedClass: WeaponClassId;
  scopeCue: string;
}

export interface TacticalTip {
  id: string;
  title: string;
  detail: string;
}

export interface WeaponClassProfile {
  id: WeaponClassId;
  label: string;
  shortLabel: string;
  weapons: string[];
  recommendedReticle: ReticleShapeId;
  recommendedGapPx: number;
  idealRangeLabel: string;
  primaryAnchorName: string;
  anchorByRange: Record<
    EngagementRange,
    {
      targetHeightPct: number; // 0 = bottom chest, 100 = top of headbox
      dragVectorLabel: string;
      curveAngleDeg: number;
      bloomRadiusPx: number;
      stanceNote: string;
    }
  >;
  positioningTips: TacticalTip[];
}

export const RETICLE_SHAPES: {
  id: ReticleShapeId;
  label: string;
  tag: string;
  cue: string;
}[] = [
  {
    id: 'precision-dot',
    label: 'Surgical Dot',
    tag: 'One-Tap',
    cue: 'Minimal occlusion for headshot taps',
  },
  {
    id: 'chevron-head',
    label: 'Apex Chevron',
    tag: 'Head Lift',
    cue: 'Upward arrow aligns chin-to-head drag',
  },
  {
    id: 'smg-circle',
    label: 'Rush Halo',
    tag: 'SMG',
    cue: 'Dynamic ring tracks SMG spread envelope',
  },
  {
    id: 'smg-rush-brackets',
    label: 'SMG Brackets',
    tag: 'SMG Pro',
    cue: 'Corner CQB brackets frame MP40 & UMP spray',
  },
  {
    id: 'red-dot-holo',
    label: 'Red-Dot Holo',
    tag: 'Red Dot',
    cue: 'Broken holographic ring for fast snap transitions',
  },
  {
    id: 'tactical-cross',
    label: 'Mil-Dot 4x',
    tag: '2x / 4x',
    cue: 'Horizon ticks stabilize scoped bursts',
  },
  {
    id: 'sniper-mil-range',
    label: 'AWM Sniper',
    tag: '8x AWM',
    cue: 'Stadia rangefinder hairlines for quick-scope locks',
  },
  {
    id: 'booyah-diamond',
    label: 'Diamond Lock',
    tag: 'Shotgun',
    cue: '45° angled frame speeds close flicks',
  },
];

export const SCOPE_OVERLAY_PRESETS: ScopeOverlayPreset[] = [
  {
    id: 'hipfire-general',
    label: 'General / SMG Rush',
    shortLabel: 'SMG / Gen',
    magnification: '1.0x',
    weaponFocus: 'MP40 · UMP · M1887',
    recommendedShape: 'smg-rush-brackets',
    recommendedGapPx: 8,
    recommendedScale: 1.05,
    recommendedClass: 'smg',
    scopeCue: 'Keep corner brackets floating on upper sternum before initiating upward drag.',
  },
  {
    id: 'red-dot',
    label: 'Red Dot Sight',
    shortLabel: 'Red Dot',
    magnification: '1.25x',
    weaponFocus: 'Desert Eagle · SCAR · Woodpecker',
    recommendedShape: 'red-dot-holo',
    recommendedGapPx: 6,
    recommendedScale: 1.0,
    recommendedClass: 'one-tap',
    scopeCue: 'Float the central crimson/green dot on collarbone line for instant tap lock.',
  },
  {
    id: 'scope-2x',
    label: '2x Assault Scope',
    shortLabel: '2x Scope',
    magnification: '2.0x',
    weaponFocus: 'Groza · M4A1 · UMP Mid',
    recommendedShape: 'smg-circle',
    recommendedGapPx: 6,
    recommendedScale: 1.0,
    recommendedClass: 'ar',
    scopeCue: 'Contain first 5 AR burst shots inside the inner ring before re-tapping crouch.',
  },
  {
    id: 'scope-4x',
    label: '4x Long-Range Scope',
    shortLabel: '4x Scope',
    magnification: '4.0x',
    weaponFocus: 'AK47 · AC80 · SKS',
    recommendedShape: 'tactical-cross',
    recommendedGapPx: 5,
    recommendedScale: 1.05,
    recommendedClass: 'ar',
    scopeCue: 'Use lower mil-dot ticks to judge vertical lead on elevated ridges and slopes.',
  },
  {
    id: 'awm-sniper',
    label: 'AWM / M82B Sniper',
    shortLabel: 'AWM Sniper',
    magnification: '8.0x',
    weaponFocus: 'AWM · M82B · Kar98k',
    recommendedShape: 'sniper-mil-range',
    recommendedGapPx: 4,
    recommendedScale: 1.1,
    recommendedClass: 'sniper',
    scopeCue: 'Pre-align the stadia center dot before scoping so quick-switch shots connect instantly.',
  },
];

export const RETICLE_COLORS: {
  hex: ReticleOverlayConfig['color'];
  label: string;
}[] = [
  { hex: '#EF4444', label: 'Crimson' },
  { hex: '#FFFFFF', label: 'Pure White' },
  { hex: '#22C55E', label: 'Lock Green' },
  { hex: '#F59E0B', label: 'Gold Sight' },
];

export const WEAPON_CLASS_PROFILES: WeaponClassProfile[] = [
  {
    id: 'one-tap',
    label: 'One-Tap Marksman',
    shortLabel: 'One-Tap',
    weapons: ['Desert Eagle', 'Woodpecker', 'AC80', 'SKS'],
    recommendedReticle: 'precision-dot',
    recommendedGapPx: 5,
    idealRangeLabel: '14–38 m',
    primaryAnchorName: 'Upper Chest / Collarbone',
    anchorByRange: {
      close: {
        targetHeightPct: 58,
        dragVectorLabel: 'Fast J-Curve Lift (70 ms)',
        curveAngleDeg: 18,
        bloomRadiusPx: 14,
        stanceNote:
          'Keep white crosshair slightly offset left/right of shoulder before snapping straight up into the crown.',
      },
      mid: {
        targetHeightPct: 68,
        dragVectorLabel: 'Crisp Vertical Snap (85 ms)',
        curveAngleDeg: 6,
        bloomRadiusPx: 10,
        stanceNote:
          'Anchor cleanly on the collarbone line; pause 120ms after strafing so first-shot accuracy resets.',
      },
      long: {
        targetHeightPct: 79,
        dragVectorLabel: 'Micro Upward Tap (45 ms)',
        curveAngleDeg: 2,
        bloomRadiusPx: 7,
        stanceNote:
          'Use short micro-drags only; full swipes at 40m+ overshoot past the smaller head hitbox.',
      },
    },
    positioningTips: [
      {
        id: 'ot-anchor',
        title: 'Right-Shoulder Peek Advantage',
        detail:
          'Expose only your right shoulder around hard cover or gloo walls so your reticle sees the enemy before their line of sight clears.',
      },
      {
        id: 'ot-drag',
        title: 'Counter-Strafe Reset Rhythm',
        detail:
          'Release the movement joystick for a split second right as you start the upward flick—moving diagonally cuts one-tap accuracy.',
      },
      {
        id: 'ot-gloo',
        title: 'Instant Gloo Animation Cancel',
        detail:
          'Fire one decisive tap, switch to gloo wall immediately, and step diagonally rather than waiting to confirm recoil recovery.',
      },
      {
        id: 'ot-elev',
        title: 'High-Ground Headbox Bias',
        detail:
          'When holding elevated roofs or slopes, aim lower on chest level—gravity perspective makes drag speed travel faster to the head.',
      },
    ],
  },
  {
    id: 'shotgun',
    label: 'Close-Range Shotguns',
    shortLabel: 'Shotgun',
    weapons: ['M1887', 'M1014', 'Trogon', 'Charge Buster'],
    recommendedReticle: 'booyah-diamond',
    recommendedGapPx: 10,
    idealRangeLabel: '2–11 m',
    primaryAnchorName: 'Mid-Chest / Neck Line',
    anchorByRange: {
      close: {
        targetHeightPct: 54,
        dragVectorLabel: 'Explosive C-Flick (65 ms)',
        curveAngleDeg: 24,
        bloomRadiusPx: 22,
        stanceNote:
          'At point-blank under 6m, pull a tight C-curve opposite the enemy strafe direction so pellet spread crowns the head.',
      },
      mid: {
        targetHeightPct: 65,
        dragVectorLabel: 'Vertical Snap (80 ms)',
        curveAngleDeg: 10,
        bloomRadiusPx: 17,
        stanceNote:
          'Stop advancing right at 10m; trigger 2-shell M1887 bursts while crouching briefly after landing to tighten pellet cone.',
      },
      long: {
        targetHeightPct: 72,
        dragVectorLabel: 'Switch to Secondary AR',
        curveAngleDeg: 4,
        bloomRadiusPx: 26,
        stanceNote:
          'Beyond 15m pellet damage drops sharply—pressure with secondary pistol/AR instead of forcing dry shotgun peeks.',
      },
    },
    positioningTips: [
      {
        id: 'sg-angle',
        title: 'Cross-Gloo Bait & Cut',
        detail:
          'Place a close gloo wall at 45° and sprint around the opposite corner to force enemies to over-rotate their camera.',
      },
      {
        id: 'sg-jump',
        title: 'Timing Jump-Shots Safely',
        detail:
          'Initiate the upward drag only after your boots touch ground frames—mid-air shots balloon spread and skip aim magnetism.',
      },
      {
        id: 'sg-distance',
        title: 'Hold the 7–9m Sweet Spot',
        detail:
          'Avoid colliding barrel-to-chest where aim lock sticks to torso; keep one stride of space so drag lift passes chest cleanly.',
      },
      {
        id: 'sg-switch',
        title: 'Quick-Reload Sprint Reset',
        detail:
          'After firing both M1887 shells, swap to melee/gloo instantly rather than standing exposed during the reload animation.',
      },
    ],
  },
  {
    id: 'smg',
    label: 'Rush SMGs',
    shortLabel: 'Rush SMG',
    weapons: ['MP40', 'UMP', 'MAC10', 'Thompson'],
    recommendedReticle: 'smg-rush-brackets',
    recommendedGapPx: 8,
    idealRangeLabel: '6–22 m',
    primaryAnchorName: 'Upper Sternum',
    anchorByRange: {
      close: {
        targetHeightPct: 60,
        dragVectorLabel: 'Steady Hold-Up (110 ms)',
        curveAngleDeg: 14,
        bloomRadiusPx: 18,
        stanceNote:
          'Start at sternum and apply smooth continuous upward pressure during the first 6 rounds before recoil blooms.',
      },
      mid: {
        targetHeightPct: 67,
        dragVectorLabel: '5-Round Burst + Pull',
        curveAngleDeg: 7,
        bloomRadiusPx: 15,
        stanceNote:
          'Fire 5–7 round bursts with tiny half-second resets; holding full-auto past 10 bullets widens horizontal SMG spread.',
      },
      long: {
        targetHeightPct: 75,
        dragVectorLabel: 'Tap-Burst Only (2x/Red)',
        curveAngleDeg: 3,
        bloomRadiusPx: 21,
        stanceNote:
          'Use short scoped 3-round taps to chip armor while rotating closer via smoke or gloo cover.',
      },
    },
    positioningTips: [
      {
        id: 'smg-strafe',
        title: 'Lateral Circle Strafe',
        detail:
          'Strafe perpendicularly to your target while mirroring their run direction so your drag vector stays almost purely vertical.',
      },
      {
        id: 'smg-burst',
        title: '6-Bullet Recoil Ceiling',
        detail:
          'MP40 and UMP deliver maximum headshot lock in the first 5–6 bullets; crouch or re-release fire to reset bloom.',
      },
      {
        id: 'smg-flank',
        title: 'Close Angles with Hard Cover',
        detail:
          'Push along building edges and terrain dips instead of open fields to close the distance into lethal 12m SMG range.',
      },
      {
        id: 'smg-pre',
        title: 'Chest-Height Pre-Aim Through Corners',
        detail:
          'Keep your reticle floating at standing chest level before rounding corners so no downward adjustment is needed.',
      },
    ],
  },
  {
    id: 'ar',
    label: 'Mid / Long Assault ARs',
    shortLabel: 'Assault AR',
    weapons: ['SCAR', 'Groza', 'M4A1', 'AK47'],
    recommendedReticle: 'tactical-cross',
    recommendedGapPx: 6,
    idealRangeLabel: '22–55 m',
    primaryAnchorName: 'Collar / Chin Red-Dot',
    anchorByRange: {
      close: {
        targetHeightPct: 62,
        dragVectorLabel: 'Hip-Fire Lift (95 ms)',
        curveAngleDeg: 12,
        bloomRadiusPx: 16,
        stanceNote:
          'Stay unscoped under 12m so higher General sensitivity tracks fast lateral dashes without tunnel vision.',
      },
      mid: {
        targetHeightPct: 71,
        dragVectorLabel: '2x / Red-Dot Micro Drag',
        curveAngleDeg: 5,
        bloomRadiusPx: 11,
        stanceNote:
          'Lock Red-Dot onto chest, tap scope briefly to snap default aim, and glide gently upward through chin level.',
      },
      long: {
        targetHeightPct: 80,
        dragVectorLabel: '4x Scoped 4-Shot Tap',
        curveAngleDeg: 2,
        bloomRadiusPx: 8,
        stanceNote:
          'Use crouch-and-peek 4-round bursts; never spray full magazines at 50m+ where vertical kick outruns recoil dampening.',
      },
    },
    positioningTips: [
      {
        id: 'ar-anchor',
        title: 'Crouch Stability Anchor',
        detail:
          'Crouching behind ridges or window frames trims vertical recoil bounce and tightens 4x scope spread by up to 20%.',
      },
      {
        id: 'ar-burst',
        title: '2x / 4x Scope Tap-Reset',
        detail:
          'Release and re-tap fire every 4–5 shots to keep every burst inside the zero-recoil cone on Groza and SCAR.',
      },
      {
        id: 'ar-third',
        title: 'Pinning Rotating Squads',
        detail:
          'Hold crossfire angles covering open zone rotations rather than chasing down knocked players out of cover.',
      },
      {
        id: 'ar-lead',
        title: 'Sprinting Target Horizontal Lead',
        detail:
          'When enemies sprint horizontally past 40m, place the reticle edge half a body-width ahead of their chest before firing.',
      },
    ],
  },
  {
    id: 'sniper',
    label: 'Precision Snipers',
    shortLabel: 'Sniper',
    weapons: ['AWM', 'M82B', 'Kar98k'],
    recommendedReticle: 'sniper-mil-range',
    recommendedGapPx: 4,
    idealRangeLabel: '35–90+ m',
    primaryAnchorName: 'Center-Crown Pre-Aim',
    anchorByRange: {
      close: {
        targetHeightPct: 64,
        dragVectorLabel: 'No-Scope Quick-Switch',
        curveAngleDeg: 8,
        bloomRadiusPx: 19,
        stanceNote:
          'Overlay the crosshair dead-center on torso before tapping Fire + Switch Weapon in one fluid two-thumb rhythm.',
      },
      mid: {
        targetHeightPct: 78,
        dragVectorLabel: 'Quick-Scope Snap (60 ms)',
        curveAngleDeg: 3,
        bloomRadiusPx: 6,
        stanceNote:
          'Align the center chevron over the target before opening scope so zero pan correction is required while zoomed.',
      },
      long: {
        targetHeightPct: 86,
        dragVectorLabel: 'Stationary Head Hold',
        curveAngleDeg: 0,
        bloomRadiusPx: 4,
        stanceNote:
          'Predict enemy stopping points (looting crates, healing behind trees) rather than burning ammo on zig-zagging runners.',
      },
    },
    positioningTips: [
      {
        id: 'sn-pre',
        title: 'Pre-Align Before Scoping',
        detail:
          'Center the visual reticle directly on the target while unscoped—your scope opens onto the exact pixel your center dot sits.',
      },
      {
        id: 'sn-m82b',
        title: 'M82B Gloo Penetration Lanes',
        detail:
          'With M82B, line up shots through single gloo walls at crouching silhouette height to force enemies off heals.',
      },
      {
        id: 'sn-rotate',
        title: 'Re-Peek From Alternate Cover',
        detail:
          'After firing one sniper shot, relocate to a new window or rock edge immediately—enemy counter-snipers pre-aim your last flash.',
      },
      {
        id: 'sn-switch',
        title: 'Fast Weapon-Swap Cadence',
        detail:
          'Double-AWM quick-switching bypasses bolt-action cooldown; practice steady 250ms Fire → Swap → Scope cadence.',
      },
    ],
  },
];

export function getWeaponClassProfile(id: WeaponClassId): WeaponClassProfile {
  return (
    WEAPON_CLASS_PROFILES.find((p) => p.id === id) ?? WEAPON_CLASS_PROFILES[0]
  );
}

export interface TacticalAimSolution {
  profile: WeaponClassProfile;
  range: EngagementRange;
  targetHeightPct: number;
  dragVectorLabel: string;
  curveAngleDeg: number;
  bloomRadiusPx: number;
  stanceNote: string;
  pairedScopeLabel: string;
  pairedScopeValue: number;
  effectiveReticleGapPx: number;
}

export function computeTacticalAimSolution(params: {
  weaponClass: WeaponClassId;
  range: EngagementRange;
  config: SensitivityConfig;
  platform: PlatformTarget;
}): TacticalAimSolution {
  const { weaponClass, range, config, platform } = params;
  const profile = getWeaponClassProfile(weaponClass);
  const rangeSpec = profile.anchorByRange[range];

  let pairedScopeLabel = 'General';
  let pairedScopeValue = config.general;

  if (weaponClass === 'sniper') {
    pairedScopeLabel = 'AWM Scope';
    pairedScopeValue = config.awm;
  } else if (weaponClass === 'ar') {
    pairedScopeLabel = range === 'long' ? '4x Scope' : '2x Scope';
    pairedScopeValue = range === 'long' ? config.x4 : config.x2;
  } else if (weaponClass === 'one-tap') {
    pairedScopeLabel = range === 'close' ? 'General' : 'Red Dot';
    pairedScopeValue = range === 'close' ? config.general : config.redDot;
  } else if (weaponClass === 'smg') {
    pairedScopeLabel = range === 'long' ? '2x Scope' : 'General';
    pairedScopeValue = range === 'long' ? config.x2 : config.general;
  } else {
    pairedScopeLabel = 'General';
    pairedScopeValue = config.general;
  }

  // Slight bloom compensation for iOS crisp digitizer vs Android DPI
  const platformGapOffset = platform === 'ios' ? -1 : 0;
  const effectiveReticleGapPx = Math.max(
    2,
    Math.min(18, profile.recommendedGapPx + platformGapOffset)
  );

  return {
    profile,
    range,
    targetHeightPct: rangeSpec.targetHeightPct,
    dragVectorLabel: rangeSpec.dragVectorLabel,
    curveAngleDeg: rangeSpec.curveAngleDeg,
    bloomRadiusPx: rangeSpec.bloomRadiusPx,
    stanceNote: rangeSpec.stanceNote,
    pairedScopeLabel,
    pairedScopeValue,
    effectiveReticleGapPx,
  };
}

export function getScopePreset(scopeId: ScopeModeId): ScopeOverlayPreset {
  return (
    SCOPE_OVERLAY_PRESETS.find((s) => s.id === scopeId) ??
    SCOPE_OVERLAY_PRESETS[0]
  );
}

export function computeOverlayScopeSync(
  scopeId: ScopeModeId,
  config: SensitivityConfig
): {
  preset: ScopeOverlayPreset;
  sensitivityLabel: string;
  sensitivityValue: number;
} {
  const preset = getScopePreset(scopeId);
  switch (scopeId) {
    case 'red-dot':
      return {
        preset,
        sensitivityLabel: 'Red Dot',
        sensitivityValue: config.redDot,
      };
    case 'scope-2x':
      return {
        preset,
        sensitivityLabel: '2x Scope',
        sensitivityValue: config.x2,
      };
    case 'scope-4x':
      return {
        preset,
        sensitivityLabel: '4x Scope',
        sensitivityValue: config.x4,
      };
    case 'awm-sniper':
      return {
        preset,
        sensitivityLabel: 'AWM Scope',
        sensitivityValue: config.awm,
      };
    case 'hipfire-general':
    default:
      return {
        preset,
        sensitivityLabel: 'General',
        sensitivityValue: config.general,
      };
  }
}
